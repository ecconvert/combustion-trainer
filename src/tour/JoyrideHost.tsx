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

    // When power step is shown, save original state and turn boiler on
    if (run && type === 'step:after' && step?.target === "[data-tour='power']") {
      if ((window as any).getBoilerOn && (window as any).setBoilerOn) {
        try {
          const currentState = (window as any).getBoilerOn();
          setOriginalBoilerState(currentState);
          if (!currentState) {
            (window as any).setBoilerOn(true);
          }
        } catch (err) {
          console.warn('Boiler startup for tour failed:', err);
        }
      }
    }

    // When programmer/startup step is shown, enable fast-forward
    if ((type === 'step:after' || type === 'step:before') && step?.target === STARTUP_STEP_SELECTOR) {
      if ((window as any).setSimSpeed && (window as any).getSimSpeed) {
        try {
          const current = (window as any).getSimSpeed();
          if (current !== FAST_FORWARD_MULTIPLIER) {
            previousSpeedRef.current = current;
            (window as any).setSimSpeed(FAST_FORWARD_MULTIPLIER);
            activatedFastForwardRef.current = true;
            setFastForwardActive(true);
            forceTick();
          }
        } catch (err) {
          console.warn('Fast-forward activation failed:', err);
        }
      }
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

      updateTutorialState({ done: true, version: TUTORIAL_VERSION });
    }

    if (action === 'close') {
      setRun(false);
      setPauseForAnimation(false);
      if (originalBoilerState !== null && (window as any).setBoilerOn) {
        (window as any).setBoilerOn(originalBoilerState);
        setOriginalBoilerState(null);
      }
      updateTutorialState({ done: true, version: TUTORIAL_VERSION });
    }
  }, [run, originalBoilerState, updateTutorialState]);

  // Watch for RUN_AUTO when fast-forward is active
  useEffect(() => {
    let raf: number | null = null;
    const tick = () => {
      try {
        if ((window as any).getProgrammerState) {
          const st = (window as any).getProgrammerState();
          if (st === 'RUN_AUTO') {
            if ((window as any).setSimSpeed) {
              const toRestore = previousSpeedRef.current ?? 1;
              (window as any).setSimSpeed(toRestore);
            }
            activatedFastForwardRef.current = false;
            setFastForwardActive(false);
            previousSpeedRef.current = null;
            forceTick();
            return;
          }
        }
      } catch (err) {
        // ignore
      }
      if (activatedFastForwardRef.current) raf = requestAnimationFrame(tick);
    };
    if (fastForwardActive && activatedFastForwardRef.current) raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [fastForwardActive]);

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
        steps={JOYRIDE_STEPS as any}
        run={run && !pauseForAnimation}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        disableOverlayClose
        hideCloseButton={false}
        spotlightClicks
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
