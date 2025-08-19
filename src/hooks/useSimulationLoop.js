/**
 * useSimulationLoop Hook
 * 
 * Manages the main simulation coordination including:
 * - 10Hz simulation loop with speed multiplier support
 * - Burner state machine advancement
 * - Temperature simulation and stack temperature
 * - Flame detection and safety systems
 * - Cross-system state synchronization
 * - Real-time sensor simulation
 * 
 * This hook coordinates the core simulation timing and state progression
 * that drives the entire combustion trainer system.
 */

import { useEffect, useCallback } from 'react';

// EP160 timing constants (in seconds)
const EP160 = {
  PURGE_HF_SEC: 4,
  PURGE_LF_SEC: 15,
  PTFI_SEC: 5,
  MTFI_SEC: 10,
  POSTPURGE_SEC: 10,
  FLAME_FAIL_SEC: 2,
};

export function useSimulationLoop({
  // State refs for performance
  simSpeedMultiplierRef,
  stateTimeRef,
  boilerOnRef,
  burnerStateRef,
  fuelRef,
  fuelFlowRef,
  airFlowRef,
  flameSignalRef,
  lockoutPendingRef,
  ambientFRef,
  setpointFRef,
  
  // State setters
  setBurnerState,
  setSimStackF,
  setT5Spark,
  setT6Pilot,
  setT7Main,
  setFlameSignal,
  setStateCountdown,
  setLockoutReason,
  setLockoutPending,
  
  // Current state values
  flameOutTimerRef
}) {
  
  // Advance burner state machine based on EP160 timing
  const advanceBurnerState = useCallback((currentBurnerState, currentBoilerOn, stateTimeMs) => {
    if (!currentBoilerOn && currentBurnerState !== "OFF") {
      setBurnerState("POSTPURGE");
      setT5Spark(false);
      setT6Pilot(false);
      setT7Main(false);
      stateTimeRef.current = 0;
      return;
    }

    const stateTimeSec = stateTimeMs / 1000;

    switch (currentBurnerState) {
      case "OFF":
        if (currentBoilerOn) {
          setBurnerState("DRIVE_HI");
          stateTimeRef.current = 0;
        }
        break;

      case "DRIVE_HI":
        if (stateTimeSec >= 2) {
          setBurnerState("PREPURGE_HI");
          stateTimeRef.current = 0;
        }
        break;

      case "PREPURGE_HI":
        if (stateTimeSec >= EP160.PURGE_HF_SEC) {
          setBurnerState("DRIVE_LOW");
          stateTimeRef.current = 0;
        }
        break;

      case "DRIVE_LOW":
        if (stateTimeSec >= 2) {
          setBurnerState("LOW_PURGE_MIN");
          stateTimeRef.current = 0;
        }
        break;

      case "LOW_PURGE_MIN":
        if (stateTimeSec >= EP160.PURGE_LF_SEC) {
          setBurnerState("PTFI");
          setT5Spark(true);
          setT6Pilot(true);
          setT7Main(false);
          stateTimeRef.current = 0;
        }
        break;

      case "PTFI":
        if (stateTimeSec >= EP160.PTFI_SEC) {
          if (flameSignalRef.current > 15) {
            setBurnerState("MTFI");
            setT7Main(true);
            stateTimeRef.current = 0;
          } else {
            setBurnerState("LOCKOUT");
            setLockoutReason("Pilot flame failure");
            setLockoutPending(true);
            setT5Spark(false);
            setT6Pilot(false);
            setT7Main(false);
          }
        }
        break;

      case "MTFI":
        if (stateTimeSec >= EP160.MTFI_SEC) {
          setBurnerState("RUN_AUTO");
          setT5Spark(false);
          setT6Pilot(false);
          setT7Main(true);
          stateTimeRef.current = 0;
        }
        break;

      case "RUN_AUTO":
        // Monitor flame signal for flame failure
        if (flameSignalRef.current < 10) {
          flameOutTimerRef.current += 100; // increment timer
          if (flameOutTimerRef.current >= EP160.FLAME_FAIL_SEC * 1000) {
            setBurnerState("LOCKOUT");
            setLockoutReason("Main flame failure");
            setLockoutPending(true);
            setT5Spark(false);
            setT6Pilot(false);
            setT7Main(false);
          }
        } else {
          flameOutTimerRef.current = 0; // reset timer on good flame
        }
        break;

      case "POSTPURGE":
        if (stateTimeSec >= EP160.POSTPURGE_SEC) {
          setBurnerState("OFF");
          stateTimeRef.current = 0;
        }
        break;

      case "LOCKOUT":
        // Stay in lockout until manual reset
        break;

      default:
        break;
    }
  }, [
    setBurnerState, setT5Spark, setT6Pilot, setT7Main,
    setLockoutReason, setLockoutPending, stateTimeRef, flameOutTimerRef, flameSignalRef
  ]);

  // Simulate stack temperature based on firing conditions
  const updateStackTemperature = useCallback((currentFuel, currentFuelFlow, currentAirFlow, currentAmbientF, currentSetpointF) => {
    const isRunning = burnerStateRef.current === "RUN_AUTO" && flameSignalRef.current > 10;
    
    if (isRunning) {
      // Simulate temperature rise based on fuel flow and air/fuel ratio
      const phi = (currentFuelFlow * currentFuel.stoichAir) / Math.max(1, currentAirFlow);
      const targetTemp = Math.min(currentSetpointF + (phi - 1) * 100, 2000);
      
      setSimStackF(prev => {
        const diff = targetTemp - prev;
        return prev + diff * 0.02; // gradual temperature change
      });
    } else {
      // Cool down toward ambient when not running
      setSimStackF(prev => {
        const diff = currentAmbientF - prev;
        return prev + diff * 0.01; // slower cooling
      });
    }
  }, [setSimStackF, burnerStateRef, flameSignalRef]);

  // Simulate flame signal based on fuel flow and air conditions
  const updateFlameSignal = useCallback((currentFuelFlow, currentAirFlow, currentFuel) => {
    const currentBurnerState = burnerStateRef.current;
    
    if (currentBurnerState === "PTFI" || currentBurnerState === "MTFI" || currentBurnerState === "RUN_AUTO") {
      // Base signal from fuel flow
      let signal = Math.min(100, currentFuelFlow * 8);
      
      // Reduce signal for poor air/fuel ratios
      const phi = (currentFuelFlow * currentFuel.stoichAir) / Math.max(1, currentAirFlow);
      if (phi < 0.8 || phi > 1.3) {
        signal *= 0.5; // poor combustion
      }
      
      // Add some noise for realism
      signal += (Math.random() - 0.5) * 5;
      
      setFlameSignal(Math.max(0, Math.min(100, signal)));
    } else {
      setFlameSignal(0);
    }
  }, [setFlameSignal, burnerStateRef]);

  // Update countdown display
  const updateStateCountdown = useCallback((currentBurnerState, stateTimeMs) => {
    const stateTimeSec = stateTimeMs / 1000;
    let remainingSec = null;

    switch (currentBurnerState) {
      case "PREPURGE_HI":
        remainingSec = Math.max(0, EP160.PURGE_HF_SEC - stateTimeSec);
        break;
      case "LOW_PURGE_MIN":
        remainingSec = Math.max(0, EP160.PURGE_LF_SEC - stateTimeSec);
        break;
      case "PTFI":
        remainingSec = Math.max(0, EP160.PTFI_SEC - stateTimeSec);
        break;
      case "MTFI":
        remainingSec = Math.max(0, EP160.MTFI_SEC - stateTimeSec);
        break;
      case "POSTPURGE":
        remainingSec = Math.max(0, EP160.POSTPURGE_SEC - stateTimeSec);
        break;
      default:
        remainingSec = null;
    }

    setStateCountdown(remainingSec);
  }, [setStateCountdown]);

  // Main simulation loop
  useEffect(() => {
    const id = setInterval(() => {
      const dtms = 100; // loop interval in milliseconds
      const speedMultiplier = simSpeedMultiplierRef.current;
      const effectiveDtms = dtms * speedMultiplier; // apply speed multiplier
      stateTimeRef.current += effectiveDtms; // track elapsed time in current state

      // Get latest values from refs
      const currentBoilerOn = boilerOnRef.current;
      const currentBurnerState = burnerStateRef.current;
      const currentFuel = fuelRef.current;
      const currentFuelFlow = fuelFlowRef.current;
      const currentAirFlow = airFlowRef.current;
      const currentAmbientF = ambientFRef.current;
      const currentSetpointF = setpointFRef.current;

      // Update all simulation systems
      advanceBurnerState(currentBurnerState, currentBoilerOn, stateTimeRef.current);
      updateFlameSignal(currentFuelFlow, currentAirFlow, currentFuel);
      updateStackTemperature(currentFuel, currentFuelFlow, currentAirFlow, currentAmbientF, currentSetpointF);
      updateStateCountdown(currentBurnerState, stateTimeRef.current);

    }, 100); // 10Hz update rate

    return () => clearInterval(id);
  }, [
    simSpeedMultiplierRef, stateTimeRef, boilerOnRef, burnerStateRef, fuelRef,
    fuelFlowRef, airFlowRef, ambientFRef, setpointFRef,
    advanceBurnerState, updateFlameSignal, updateStackTemperature, updateStateCountdown
  ]);

  return {
    // Expose timing constants for other components
    EP160
  };
}