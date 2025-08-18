/**
 * JoyrideHost component manages the onboarding tour state and rendering.
 * Integrates with localStorage for first-visit detection and tour completion tracking.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { JOYRIDE_STEPS } from './spec';
import { FAST_FORWARD_MULTIPLIER, STARTUP_STEP_SELECTOR } from './constants';
import WelcomeSplash from '../components/WelcomeSplash';

declare const process: any;

interface TutorialState {
  done: boolean;
  version: number;
}

interface JoyrideHostProps {
  runOnFirstVisit?: boolean;
}

const STORAGE_KEY = "app_config_v1";
const TUTORIAL_VERSION = 1;

export default function JoyrideHost({ runOnFirstVisit = true }: JoyrideHostProps) {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [showSplash, setShowSplash] = useState(false);
  const [pauseForAnimation, setPauseForAnimation] = useState(false);
  const [originalBoilerState, setOriginalBoilerState] = useState<boolean | null>(null);
  // Track whether we activated fast-forward so we only restore if we set it
  const activatedFastForwardRef = useRef(false);
  // Remember previous simulation speed so we can restore it
  const previousSpeedRef = useRef<number | null>(null);

  // Don't show splash in test environment
  const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

  // Load tutorial state from localStorage
  useEffect(() => {
    // Skip splash screen entirely in test environment
    if (isTestEnv) {
      return;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        const tutorial = config.tutorial;
        
        // Check if this is first visit or if tutorial version changed
        if (runOnFirstVisit && (!tutorial || !tutorial.done || tutorial.version < TUTORIAL_VERSION)) {
          setShowSplash(true);
        }
      } else if (runOnFirstVisit) {
        // No config exists, definitely first visit
        setShowSplash(true);
      }
    } catch (error) {
      console.warn('Failed to load tutorial state:', error);
      if (runOnFirstVisit) {
        setShowSplash(true);
      }
    }
  }, [runOnFirstVisit, isTestEnv]);

  // Update tutorial state in localStorage
  const updateTutorialState = useCallback((tutorial: TutorialState) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const config = stored ? JSON.parse(stored) : {};
      
      config.tutorial = tutorial;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save tutorial state:', error);
    }
  }, []);

  // Handle tour completion or skip
  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, index, type, action, step } = data;
    
    console.log('Joyride callback:', { status, index, type, action });
    
    // Handle automatic actions for specific steps
    if (type === 'step:after' && step?.target === "[data-tour='power']") {
      // Save original boiler state and automatically turn on boiler for tour
      if (originalBoilerState === null && (window as any).getBoilerOn) {
        setOriginalBoilerState((window as any).getBoilerOn());
      }
      setTimeout(() => {
        if ((window as any).setBoilerOn) {
          (window as any).setBoilerOn(true);
        }
      }, 200);
    } else if (type === 'step:after' && step?.target === "[data-tour='technician']") {
      // Pause the tour and open the technician drawer
      setPauseForAnimation(true);
      setTimeout(() => {
        const techButton = document.querySelector("[data-tour='technician']") as HTMLButtonElement;
        if (techButton) {
          techButton.click();
          // Wait for drawer animation to complete before resuming tour
          setTimeout(() => {
            setPauseForAnimation(false);
          }, 400); // 300ms animation + 100ms buffer
        }
      }, 200);
      return; // Don't process other actions while pausing
    } else if (type === 'step:after' && step?.target === STARTUP_STEP_SELECTOR) {
      // Enable fast-forward for startup sequence during tour
      if ((window as any).setSimSpeed && (window as any).getSimSpeed) {
        try {
          const current = (window as any).getSimSpeed();
          // Only activate if not already at desired multiplier
          if (current !== FAST_FORWARD_MULTIPLIER) {
            previousSpeedRef.current = current;
            (window as any).setSimSpeed(FAST_FORWARD_MULTIPLIER);
            activatedFastForwardRef.current = true;
          }
        } catch (err) {
          console.warn('Fast-forward activation failed:', err);
        }
      }
    }
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);
      setPauseForAnimation(false);
      
      // Restore original boiler state if tour is cancelled or completed
      if (originalBoilerState !== null && (window as any).setBoilerOn) {
        (window as any).setBoilerOn(originalBoilerState);
        setOriginalBoilerState(null);
      }
      
      // Reset simulation speed to previous value if we activated it
      if ((window as any).setSimSpeed && activatedFastForwardRef.current) {
        const toRestore = previousSpeedRef.current ?? 1;
        try {
          (window as any).setSimSpeed(toRestore);
        } catch (err) {
          console.warn('Failed to restore sim speed:', err);
        }
        activatedFastForwardRef.current = false;
        previousSpeedRef.current = null;
      }
      
      // Mark tutorial as completed
      updateTutorialState({
        done: true,
        version: TUTORIAL_VERSION
      });
    } else if (status === STATUS.ERROR) {
      console.warn('Joyride error at step:', index);
      // Stop the tour on error and restore boiler state
      setRun(false);
      setStepIndex(0);
      setPauseForAnimation(false);
      
      // Restore original boiler state
      if (originalBoilerState !== null && (window as any).setBoilerOn) {
        (window as any).setBoilerOn(originalBoilerState);
        setOriginalBoilerState(null);
      }
    } else if (action === 'close') {
      // Handle close button (X) click
      setRun(false);
      setStepIndex(0);
      setPauseForAnimation(false);
      
      // Restore original boiler state when tour is cancelled
      if (originalBoilerState !== null && (window as any).setBoilerOn) {
        (window as any).setBoilerOn(originalBoilerState);
        setOriginalBoilerState(null);
      }
      
      // Mark tutorial as completed when closed
      updateTutorialState({
        done: true,
        version: TUTORIAL_VERSION
      });
    }
    // Note: React Joyride manages stepIndex internally when continuous=true
    // We don't need to manually update stepIndex for next/prev actions
  }, [updateTutorialState, originalBoilerState]);

  // Clean up on unmount: restore sim speed and boiler state if necessary
  useEffect(() => {
    return () => {
      if (activatedFastForwardRef.current && (window as any).setSimSpeed) {
        const toRestore = previousSpeedRef.current ?? 1;
        try {
          (window as any).setSimSpeed(toRestore);
        } catch (err) {
          console.warn('Failed to restore sim speed on unmount:', err);
        }
      }
      if (originalBoilerState !== null && (window as any).setBoilerOn) {
        try {
          (window as any).setBoilerOn(originalBoilerState);
        } catch (err) {
          console.warn('Failed to restore boiler state on unmount:', err);
        }
      }
    };
  }, [originalBoilerState]);

  // Public method to restart tour
  const startTour = useCallback(() => {
    setStepIndex(0);
    setShowSplash(true);
    setRun(false);
    setPauseForAnimation(false);
    setOriginalBoilerState(null); // Reset boiler state tracking
  }, []);

  // Handle splash screen actions
  const handleStartTour = useCallback(() => {
    setShowSplash(false);
    setStepIndex(0);
    setRun(true);
    setPauseForAnimation(false);
    setOriginalBoilerState(null); // Reset boiler state tracking
  }, []);

  const handleSkipTour = useCallback(() => {
    setShowSplash(false);
    setRun(false);
    
    // Mark tutorial as completed
    updateTutorialState({
      done: true,
      version: TUTORIAL_VERSION
    });
  }, [updateTutorialState]);

  // Expose startTour method globally for settings menu
  useEffect(() => {
    (window as any).startCombustionTour = startTour;
    return () => {
      delete (window as any).startCombustionTour;
    };
  }, [startTour]);

  return (
    <>
      {showSplash && (
        <WelcomeSplash 
          onStartTour={handleStartTour}
          onSkip={handleSkipTour}
        />
      )}
      <Joyride
        steps={JOYRIDE_STEPS}
        run={run && !pauseForAnimation}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        disableOverlayClose
        hideCloseButton={false}
        spotlightClicks={true}
        styles={{
          options: {
            primaryColor: '#3b82f6',
            textColor: '#1f2937',
            backgroundColor: '#ffffff',
            overlayColor: 'rgba(0, 0, 0, 0.4)',
            arrowColor: '#ffffff',
            zIndex: 1000,
          },
          tooltip: {
            fontSize: '14px',
            padding: '16px',
            borderRadius: '8px',
            maxWidth: '400px',
          },
          tooltipContent: {
            padding: '8px 0',
          },
          tooltipTitle: {
            fontSize: '16px',
            fontWeight: 'bold',
            marginBottom: '8px',
          },
          buttonNext: {
            backgroundColor: '#3b82f6',
            fontSize: '14px',
            padding: '8px 16px',
            borderRadius: '4px',
          },
          buttonBack: {
            color: '#6b7280',
            fontSize: '14px',
            padding: '8px 16px',
            borderRadius: '4px',
          },
          buttonSkip: {
            color: '#6b7280',
            fontSize: '14px',
          }
        }}
      />
    </>
  );
}
