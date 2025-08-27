/**
 * JoyrideHost component manages the onboarding tour state and rendering.
 * Integrates with localStorage for first-visit detection and tour completion tracking.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { JOYRIDE_STEPS } from './spec';
import { FAST_FORWARD_MULTIPLIER, STARTUP_STEP_SELECTOR } from './constants';
import FastForwardBadge from '../components/FastForwardBadge';
import WelcomeSplash from '../components/WelcomeSplash';

declare const process: any;

const STORAGE_KEY = 'app_config_v1';
const TUTORIAL_VERSION = 1;

export default function JoyrideHost({ runOnFirstVisit = true }: { runOnFirstVisit?: boolean }) {
  const [run, setRun] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [pauseForAnimation, setPauseForAnimation] = useState(false);
  const [originalBoilerState, setOriginalBoilerState] = useState<boolean | null>(null);

  // Track whether we activated fast-forward so we only restore if we set it
  const activatedFastForwardRef = useRef(false);
  const [fastForwardActive, setFastForwardActive] = useState(false);
  const previousSpeedRef = useRef<number | null>(null);

  const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

  useEffect(() => {
    if (isTestEnv) return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        const tutorial = config.tutorial;
        if (runOnFirstVisit && (!tutorial || !tutorial.done || tutorial.version < TUTORIAL_VERSION)) {
          setShowSplash(true);
        }
      } else if (runOnFirstVisit) {
        setShowSplash(true);
      }
    } catch (err) {
      console.warn('Failed to read tutorial state', err);
      if (runOnFirstVisit) setShowSplash(true);
    }
  }, [runOnFirstVisit, isTestEnv]);

  const updateTutorialState = useCallback((tutorial: { done: boolean; version: number }) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const config = stored ? JSON.parse(stored) : {};
      config.tutorial = tutorial;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (err) {
      console.warn('Failed to save tutorial state', err);
    }
  }, []);

  const forceTickRef = useRef(0);
  const [, setTick] = useState(0);
  const forceTick = useCallback(() => setTick((t) => t + 1), []);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, step, action } = data;

    // Guard against cross-origin frame access errors
    const safeWindowAccess = (fn: () => void) => {
      try {
        // Check if we're in a cross-origin iframe
        if (window.parent !== window && window.top !== window) {
          try {
            // Test if we can access parent - will throw if cross-origin
            window.parent.location.href;
          } catch {
            // Cross-origin detected - skip window API calls
            console.warn('Cross-origin frame detected, skipping window API access');
            return;
          }
        }
        fn();
      } catch (err) {
        console.warn('Window API access failed (likely cross-origin):', err);
      }
    };

    // When power step is shown, save original state and turn boiler on
    if (run && type === 'step:after' && step?.target === "[data-tour='power']") {
      safeWindowAccess(() => {
        if ((window as any).getBoilerOn && (window as any).setBoilerOn) {
          const currentState = (window as any).getBoilerOn();
          setOriginalBoilerState(currentState);
          if (!currentState) {
            (window as any).setBoilerOn(true);
          }
        }
      });
    }

    // When programmer/startup step is shown, enable fast-forward
    if ((type === 'step:after' || type === 'step:before') && step?.target === STARTUP_STEP_SELECTOR) {
      safeWindowAccess(() => {
        if ((window as any).setSimSpeed && (window as any).getSimSpeed) {
          const current = (window as any).getSimSpeed();
          if (current !== FAST_FORWARD_MULTIPLIER) {
            previousSpeedRef.current = current;
            (window as any).setSimSpeed(FAST_FORWARD_MULTIPLIER);
            activatedFastForwardRef.current = true;
            setFastForwardActive(true);
            forceTick();
          }
        }
      });
    }

    // When firing rate step is shown, demonstrate ramping effects
    if (type === 'step:after' && step?.target === "[data-tour='firing-rate']") {
      safeWindowAccess(() => {
        if ((window as any).setRheostat) {
          // Start a demonstration ramp from 20% to 60% and back
          let currentRate = 20;
          let direction = 1; // 1 for up, -1 for down
          let rampCount = 0;
          const maxRamps = 2; // Complete 2 full cycles
          
          const rampInterval = setInterval(() => {
            (window as any).setRheostat(currentRate);
            
            currentRate += direction * 5; // 5% increments
            
            // Reverse direction at bounds
            if (currentRate >= 60) {
              direction = -1;
            } else if (currentRate <= 20) {
              direction = 1;
              rampCount++;
            }
            
            // Stop after completing cycles and settle at 30%
            if (rampCount >= maxRamps) {
              clearInterval(rampInterval);
              setTimeout(() => {
                (window as any).setRheostat(30);
              }, 500);
            }
          }, 800); // Change every 800ms for visible effect
          
          // Clean up interval on component unmount or tour end
          const cleanupFiringRateDemo = () => clearInterval(rampInterval);
          (window as any).__cleanupFiringRateDemo = cleanupFiringRateDemo;
        }
      });
    }

    // Handle technician drawer pausing behavior
    if (type === 'step:after' && step?.target === "[data-tour='technician']") {
      setPauseForAnimation(true);
      setTimeout(() => {
        const techButton = document.querySelector("[data-tour='technician']") as HTMLButtonElement | null;
        if (techButton) {
          techButton.click();
          setTimeout(() => setPauseForAnimation(false), 400);
        } else {
          setPauseForAnimation(false);
        }
      }, 200);
      return;
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setPauseForAnimation(false);

      if (originalBoilerState !== null && (window as any).setBoilerOn) {
        (window as any).setBoilerOn(originalBoilerState);
        setOriginalBoilerState(null);
      }

      if ((window as any).setSimSpeed && activatedFastForwardRef.current) {
        const toRestore = previousSpeedRef.current ?? 1;
        try {
          (window as any).setSimSpeed(toRestore);
        } catch (err) {
          console.warn('Failed to restore sim speed:', err);
        }
        activatedFastForwardRef.current = false;
        setFastForwardActive(false);
        forceTick();
        previousSpeedRef.current = null;
      }

      // Clean up firing rate demo if active
      if ((window as any).__cleanupFiringRateDemo) {
        (window as any).__cleanupFiringRateDemo();
        delete (window as any).__cleanupFiringRateDemo;
      }

      updateTutorialState({ done: true, version: TUTORIAL_VERSION });
    }

    if (action === 'close') {
      setRun(false);
      setPauseForAnimation(false);
      if (originalBoilerState !== null && (window as any).setBoilerOn) {
        (window as any).setBoilerOn(originalBoilerState);
        setOriginalBoilerState(null);
      }
      
      // Clean up firing rate demo if active
      if ((window as any).__cleanupFiringRateDemo) {
        (window as any).__cleanupFiringRateDemo();
        delete (window as any).__cleanupFiringRateDemo;
      }
      
      updateTutorialState({ done: true, version: TUTORIAL_VERSION });
    }
  }, [run, originalBoilerState, updateTutorialState]);

  // Watch for RUN_AUTO when fast-forward is active
  useEffect(() => {
    const handleProgState = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (activatedFastForwardRef.current && customEvent.detail?.state === 'RUN_AUTO') {
        try {
          if ((window as any).setSimSpeed) {
            const toRestore = previousSpeedRef.current ?? 1;
            (window as any).setSimSpeed(toRestore);
          }
        } catch (e) {
          console.warn('Failed to restore sim speed on RUN_AUTO', e);
        } finally {
          activatedFastForwardRef.current = false;
          setFastForwardActive(false);
          previousSpeedRef.current = null;
          forceTick();
        }
      }
    };

    window.addEventListener('programmerStateChanged', handleProgState);
    return () => {
      window.removeEventListener('programmerStateChanged', handleProgState);
    };
  }, [forceTick]);

  useEffect(() => {
    return () => {
      if (activatedFastForwardRef.current && (window as any).setSimSpeed) {
        const toRestore = previousSpeedRef.current ?? 1;
        try { (window as any).setSimSpeed(toRestore); } catch { }
        activatedFastForwardRef.current = false;
        setFastForwardActive(false);
      }
      if (originalBoilerState !== null && (window as any).setBoilerOn) {
        try { (window as any).setBoilerOn(originalBoilerState); } catch { }
      }
      // Clean up firing rate demo on unmount
      if ((window as any).__cleanupFiringRateDemo) {
        (window as any).__cleanupFiringRateDemo();
        delete (window as any).__cleanupFiringRateDemo;
      }
    };
  }, [originalBoilerState]);

  const startTour = useCallback(() => { setRun(true); setShowSplash(false); setPauseForAnimation(false); setOriginalBoilerState(null); }, []);
  const handleStartTour = useCallback(() => { setShowSplash(false); setRun(true); setPauseForAnimation(false); setOriginalBoilerState(null); }, []);
  const handleSkipTour = useCallback(() => { setShowSplash(false); setRun(false); updateTutorialState({ done: true, version: TUTORIAL_VERSION }); }, [updateTutorialState]);

  useEffect(() => {
    (window as any).startCombustionTour = startTour;
    return () => { delete (window as any).startCombustionTour; };
  }, [startTour]);

  return (
    <>
      {showSplash && <WelcomeSplash onStartTour={handleStartTour} onSkip={handleSkipTour} />}
      <Joyride
        data-testid="joyride-host-instance"
        steps={JOYRIDE_STEPS as any}
        run={run && !pauseForAnimation}
        continuous
        scrollToFirstStep
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        disableOverlayClose
        hideCloseButton={false}
        spotlightClicks
        // floaterProps uses Popper modifiers; cast to any to avoid strict prop typing
        floaterProps={(({
          modifiers: [
            { name: 'preventOverflow', options: { altAxis: true, tether: false, padding: 8, rootBoundary: 'viewport' } },
            { name: 'flip', options: { fallbackPlacements: ['top', 'bottom', 'right', 'left'] } }
          ]
        }) as any)}
        styles={{
          options: {
            primaryColor: '#3b82f6',
            textColor: '#1f2937',
            backgroundColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.4)',
            arrowColor: '#ffffff',
            zIndex: 1000,
          },
          tooltip: { fontSize: '14px', padding: '16px', borderRadius: '8px', maxWidth: '400px' },
          tooltipContent: { padding: '8px 0' },
          tooltipTitle: { fontSize: '16px', fontWeight: 'bold', marginBottom: '8px' },
          buttonNext: { backgroundColor: '#3b82f6', fontSize: '14px', padding: '8px 16px', borderRadius: '4px' },
          buttonBack: { color: '#6b7280', fontSize: '14px', padding: '8px 16px', borderRadius: '4px' },
          buttonSkip: { color: '#6b7280', fontSize: '14px' }
        }}
      />
      <FastForwardBadge visible={!!activatedFastForwardRef.current} multiplier={FAST_FORWARD_MULTIPLIER} />
    </>
  );
}
