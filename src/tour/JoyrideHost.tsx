/**
 * JoyrideHost component manages the onboarding tour state and rendering.
 * Integrates with localStorage for first-visit detection and tour completion tracking.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Joyride, { CallBackProps, STATUS } from 'react-joyride';
import { JOYRIDE_STEPS } from './spec';
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
    const { status, index, type, action } = data;
    
    console.log('Joyride callback:', { status, index, type, action });
    
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      setStepIndex(0);
      
      // Mark tutorial as completed
      updateTutorialState({
        done: true,
        version: TUTORIAL_VERSION
      });
    } else if (status === STATUS.ERROR) {
      console.warn('Joyride error at step:', index);
      // Stop the tour on error
      setRun(false);
      setStepIndex(0);
    } else if (action === 'close') {
      // Handle close button (X) click
      setRun(false);
      setStepIndex(0);
      
      // Mark tutorial as completed when closed
      updateTutorialState({
        done: true,
        version: TUTORIAL_VERSION
      });
    }
    // Note: React Joyride manages stepIndex internally when continuous=true
    // We don't need to manually update stepIndex for next/prev actions
  }, [updateTutorialState]);

  // Public method to restart tour
  const startTour = useCallback(() => {
    setStepIndex(0);
    setShowSplash(true);
    setRun(false);
  }, []);

  // Handle splash screen actions
  const handleStartTour = useCallback(() => {
    setShowSplash(false);
    setStepIndex(0);
    setRun(true);
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
        run={run}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        disableOverlayClose
        hideCloseButton={false}
        spotlightClicks={false}
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
