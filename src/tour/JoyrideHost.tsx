/**
 * JoyrideHost component manages the onboarding tour state and rendering.
 * Integrates with localStorage for first-visit detection and tour completion tracking.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { JOYRIDE_STEPS } from './spec';

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

  // Load tutorial state from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const config = JSON.parse(stored);
        const tutorial = config.tutorial;
        
        // Check if this is first visit or if tutorial version changed
        if (runOnFirstVisit && (!tutorial || !tutorial.done || tutorial.version < TUTORIAL_VERSION)) {
          setRun(true);
        }
      } else if (runOnFirstVisit) {
        // No config exists, definitely first visit
        setRun(true);
      }
    } catch (error) {
      console.warn('Failed to load tutorial state:', error);
      if (runOnFirstVisit) {
        setRun(true);
      }
    }
  }, [runOnFirstVisit]);

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
    const { status, index, type } = data;
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);
      
      // Mark tutorial as completed
      updateTutorialState({
        done: true,
        version: TUTORIAL_VERSION
      });
    } else if (type === 'step:after') {
      setStepIndex(index + 1);
    }
  }, [updateTutorialState]);

  // Public method to restart tour
  const startTour = useCallback(() => {
    setStepIndex(0);
    setRun(true);
  }, []);

  // Expose startTour method globally for settings menu
  useEffect(() => {
    (window as any).startCombustionTour = startTour;
    return () => {
      delete (window as any).startCombustionTour;
    };
  }, [startTour]);

  return (
    <Joyride
      steps={JOYRIDE_STEPS}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
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
        },
        tooltipContent: {
          padding: '8px 0',
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          fontSize: '14px',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#6b7280',
          fontSize: '14px',
          padding: '8px 16px',
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: '14px',
        },
      }}
    />
  );
}
