/**
 * useTour Hook
 * 
 * Manages tour/onboarding system functionality including:
 * - JoyrideHost component state and global API exposure
 * - Simulation speed multiplier for tour fast-forward
 * - Global window API for tour integration with boiler controls
 * - Tour lifecycle and integration points
 * 
 * Extracted from App.jsx for modular architecture.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import JoyrideHost from '../tour/JoyrideHost';

export function useTour({ 
  boilerOn,
  setBoilerOn,
  setRheostat,
  burnerStateRef
}) {
  // Tour simulation speed for fast-forward functionality
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(1);

  // advanceStep function reference for dynamic updates
  const advanceStepRef = useRef(null);

  // Set advanceStep function (called after it's defined in App.jsx)
  const setAdvanceStep = useCallback((fn) => {
    advanceStepRef.current = fn;
  }, []);

  // Expose global window API for tour integration
  useEffect(() => {
    // Boiler control functions for tour
    window.setBoilerOn = setBoilerOn;
    window.getBoilerOn = () => boilerOn;
    
    // Simulation speed control for tour fast-forward
    window.setSimSpeed = setSimSpeedMultiplier;
    window.getSimSpeed = () => simSpeedMultiplier;
    
    // Test helper: forcibly set rheostat (firing rate) bypassing disabled state for deterministic e2e
    window.setRheostat = (val) => {
      try {
        const n = Math.max(0, Math.min(100, parseInt(val)));
        setRheostat(n);
      } catch {
        // ignore invalid values
      }
    };
    
    // Expose programmer/burner state for tour fast-forward auto-exit logic
    window.getProgrammerState = () => burnerStateRef.current;
    
    // Expose a test helper to advance the programmer state machine
    const adv = () => {
      try {
        const advanceStep = advanceStepRef.current;
        if (typeof advanceStep === 'function') { 
          advanceStep(); 
          return true; 
        }
      } catch {
        // ignore errors in step advancement
      }
      return false;
    };
    window.advanceStep = adv;

    // Cleanup function to remove global API
    return () => {
      delete window.setBoilerOn;
      delete window.getBoilerOn;
      delete window.setSimSpeed;
      delete window.getSimSpeed;
      delete window.setRheostat;
      delete window.getProgrammerState;
      delete window.advanceStep;
    };
  }, [
    boilerOn,
    setBoilerOn,
    simSpeedMultiplier,
    setRheostat,
    burnerStateRef
  ]);

  // Manual tour start function that can be exposed globally
  const startTour = useCallback(() => {
    if (window.startCombustionTour) {
      window.startCombustionTour();
    }
  }, []);

  // Expose global tour start function
  useEffect(() => {
    window.startCombustionTour = startTour;
    return () => {
      delete window.startCombustionTour;
    };
  }, [startTour]);

  // JoyrideHost component ready for rendering
  const TourComponent = () => React.createElement(JoyrideHost);

  return {
    // State
    simSpeedMultiplier,
    
    // Actions
    setSimSpeedMultiplier,
    setAdvanceStep,
    startTour,
    
    // Component
    TourComponent
  };
}