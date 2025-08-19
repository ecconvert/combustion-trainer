import { useState, useEffect, useRef, useCallback } from 'react';
import { clamp } from '../lib/math';
import { computeCombustion } from '../lib/chemistry';

// ----------------------- Constants -----------------------
// Programmer timing constants derived from a common Fireye EP-160 sequence
const EP160 = { 
  PURGE_HF_SEC: 30, 
  LOW_FIRE_MIN_SEC: 30, 
  LOW_FIRE_DRIVE_SEC: 5, 
  PTFI_SEC: 10, 
  MTFI_SPARK_OFF_SEC: 10, 
  MTFI_PILOT_OFF_SEC: 15, 
  POST_PURGE_SEC: 15, 
  FFRT_SEC: 4 
};

// Ranges for air/fuel ratio expressed as excess air (EA)
const IGNITABLE_EA = { min: 0.85, max: 1.6 }; // flame can light within this EA window
const STABLE_EA = { min: 0.9, max: 1.5 }; // stable flame once running

/**
 * Hook for managing burner programmer state machine
 * Handles timing sequences, safety interlocks, and flame management
 */
export default function useBurnerProgrammer({ 
  boilerOn,
  _simSpeedMultiplier,
  fuel,
  fuelFlow,
  airFlow,
  ambientF,
  _setpointF,
  effectiveFuel,
  fuelFlowRef,
  airFlowRef,
  fuelRef,
  ambientFRef,
  setpointFRef,
  simSpeedMultiplierRef,
  boilerOnRef
}) {
  // ----------------------- State -----------------------
  const [burnerState, setBurnerState] = useState("OFF"); // current programmer state
  const [simStackF, setSimStackF] = useState(150); // simulated stack temperature
  const [t5Spark, setT5Spark] = useState(false); // output relay states for animation
  const [t6Pilot, setT6Pilot] = useState(false);
  const [t7Main, setT7Main] = useState(false);
  const [flameSignal, setFlameSignal] = useState(0); // simulated flame scanner strength
  const [stateCountdown, setStateCountdown] = useState(null); // seconds remaining in timed states
  const [lockoutReason, setLockoutReason] = useState("");
  const [lockoutPending, setLockoutPending] = useState(false);

  // ----------------------- Refs for simulation loop -----------------------
  const stateTimeRef = useRef(0); // milliseconds elapsed in current state
  const flameOutTimerRef = useRef(0); // tracks flame failure detection time
  const burnerStateRef = useRef(burnerState);
  const flameSignalRef = useRef(flameSignal);
  const lockoutPendingRef = useRef(lockoutPending);
  const steadyRef = useRef(null);
  const simStackRef = useRef(simStackF);

  // ----------------------- Keep refs updated -----------------------
  useEffect(() => { burnerStateRef.current = burnerState; }, [burnerState]);
  useEffect(() => { flameSignalRef.current = flameSignal; }, [flameSignal]);
  useEffect(() => { lockoutPendingRef.current = lockoutPending; }, [lockoutPending]);
  useEffect(() => { simStackRef.current = simStackF; }, [simStackF]);

  // ----------------------- Computed steady state combustion -----------------------
  const steady = computeCombustion({ fuel, fuelFlow: effectiveFuel, airFlow, stackTempF: simStackF, ambientF });
  useEffect(() => { steadyRef.current = steady; }, [steady]);

  // ----------------------- Main state machine simulation loop -----------------------
  useEffect(() => {
    const id = setInterval(() => {
      const dtms = 100; // loop interval in milliseconds
      const speedMultiplier = simSpeedMultiplierRef.current;
      const effectiveDtms = dtms * speedMultiplier; // apply speed multiplier
      stateTimeRef.current += effectiveDtms; // track elapsed time in current state

      const currentBoilerOn = boilerOnRef.current;
      const currentBurnerState = burnerStateRef.current;
      const currentFuel = fuelRef.current;
      const currentFuelFlow = fuelFlowRef.current;
      const currentAirFlow = airFlowRef.current;
      const currentFlameSignal = flameSignalRef.current;
      const currentLockoutPending = lockoutPendingRef.current;
      const currentAmbientF = ambientFRef.current;
      const currentSetpointF = setpointFRef.current;

      const { C: _C, H: _H, O: _O } = currentFuel.formula;
      const _O2_needed = Math.max(0.0001, currentFuelFlow) * (_C + _H / 4 - _O / 2);
      const _airStoich = _O2_needed / 0.21;
      const EA_now = Math.max(0.1, currentAirFlow / Math.max(0.001, _airStoich));

      let nextBurnerState = currentBurnerState;
      
      // State machine logic
      if (!currentBoilerOn) {
        if (currentBurnerState !== "OFF" && currentBurnerState !== "POSTPURGE") {
          setT5Spark(false); setT6Pilot(false); setT7Main(false);
          nextBurnerState = "POSTPURGE";
          stateTimeRef.current = 0;
        }
      } else if (currentBurnerState === "OFF") {
        nextBurnerState = "DRIVE_HI";
        stateTimeRef.current = 0;
      } else if (currentBurnerState === "DRIVE_HI") {
        if (stateTimeRef.current >= 1000) { nextBurnerState = "PREPURGE_HI"; stateTimeRef.current = 0; }
      } else if (currentBurnerState === "PREPURGE_HI") {
        if (stateTimeRef.current >= EP160.PURGE_HF_SEC * 1000) { nextBurnerState = "DRIVE_LOW"; stateTimeRef.current = 0; }
      } else if (currentBurnerState === "DRIVE_LOW") {
        if (stateTimeRef.current >= EP160.LOW_FIRE_DRIVE_SEC * 1000) { nextBurnerState = "LOW_PURGE_MIN"; stateTimeRef.current = 0; }
      } else if (currentBurnerState === "LOW_PURGE_MIN") {
        if (stateTimeRef.current >= EP160.LOW_FIRE_MIN_SEC * 1000) {
          nextBurnerState = "PTFI";
          setT5Spark(true); setT6Pilot(true); setT7Main(false);
          stateTimeRef.current = 0;
        }
      } else if (currentBurnerState === "PTFI") {
        if (stateTimeRef.current >= EP160.PTFI_SEC * 1000) {
          if (currentFlameSignal >= 10) {
            setT7Main(true); // main flame on
            nextBurnerState = "MTFI";
            stateTimeRef.current = 0;
          } else {
            setT5Spark(false); setT6Pilot(false); setT7Main(false);
            nextBurnerState = "LOCKOUT";
            setLockoutReason("PTFI FLAME FAIL");
            stateTimeRef.current = 0;
          }
        }
      } else if (currentBurnerState === "MTFI") {
        if (stateTimeRef.current >= EP160.MTFI_SPARK_OFF_SEC * 1000) setT5Spark(false);
        if (stateTimeRef.current >= EP160.MTFI_PILOT_OFF_SEC * 1000) {
          setT6Pilot(false);
          nextBurnerState = "RUN_AUTO";
          stateTimeRef.current = 0;
        }
      } else if (currentBurnerState === "RUN_AUTO") {
        if (EA_now < IGNITABLE_EA.min || EA_now > IGNITABLE_EA.max) {
          setT7Main(false);
          nextBurnerState = "POSTPURGE";
          setLockoutReason("FLAME BLOWOUT (EA out of range)");
          setLockoutPending(true);
          stateTimeRef.current = 0;
        } else if (currentFlameSignal < 10) {
          flameOutTimerRef.current += effectiveDtms;
          if (flameOutTimerRef.current >= EP160.FFRT_SEC * 1000) {
            setT7Main(false);
            nextBurnerState = "LOCKOUT";
            setLockoutReason("FLAME FAIL");
            stateTimeRef.current = 0;
          }
        } else {
          flameOutTimerRef.current = 0;
        }
      } else if (currentBurnerState === "POSTPURGE") {
        if (stateTimeRef.current >= EP160.POST_PURGE_SEC * 1000) {
          if (currentLockoutPending) {
            nextBurnerState = "LOCKOUT";
          } else {
            nextBurnerState = "OFF";
          }
          setLockoutPending(false);
          setStateCountdown(null);
          stateTimeRef.current = 0;
        }
      }

      if (nextBurnerState !== currentBurnerState) {
        setBurnerState(nextBurnerState);
        try {
          window.dispatchEvent(new CustomEvent('programmerStateChanged', { detail: { state: nextBurnerState } }));
        } catch {
          // Failed to dispatch programmer event
        }
      }

      // Update countdown timer
      let remaining = null;
      if (currentBurnerState === "PREPURGE_HI" || currentBurnerState === "DRIVE_HI") remaining = EP160.PURGE_HF_SEC - stateTimeRef.current / 1000;
      else if (currentBurnerState === "DRIVE_LOW") remaining = EP160.LOW_FIRE_DRIVE_SEC - stateTimeRef.current / 1000;
      else if (currentBurnerState === "LOW_PURGE_MIN") remaining = EP160.LOW_FIRE_MIN_SEC - stateTimeRef.current / 1000;
      else if (currentBurnerState === "PTFI") remaining = EP160.PTFI_SEC - stateTimeRef.current / 1000;
      else if (currentBurnerState === "MTFI") remaining = EP160.MTFI_PILOT_OFF_SEC - stateTimeRef.current / 1000;
      else if (currentBurnerState === "POSTPURGE") remaining = EP160.POST_PURGE_SEC - stateTimeRef.current / 1000;
      setStateCountdown(remaining !== null ? Math.max(0, Math.ceil(remaining)) : null);

      // Update flame signal simulation
      setFlameSignal((prev) => {
        if (!(currentBurnerState === "PTFI" || currentBurnerState === "MTFI" || currentBurnerState === "RUN_AUTO")) {
          return 0;
        }
        let target = 0;
        const { C, H, O } = currentFuel.formula;
        const O2_needed = Math.max(0.0001, currentFuelFlow) * (C + H / 4 - O / 2);
        const airStoich = O2_needed / 0.21;
        const EA = Math.max(0.1, currentAirFlow / Math.max(0.001, airStoich));
        const k = Math.exp(-Math.pow((EA - 1.05) / 0.35, 2));
        if (currentBurnerState === "PTFI") {
          const ignitable = EA > IGNITABLE_EA.min && EA < IGNITABLE_EA.max && currentFuelFlow > 0.5;
          target = ignitable ? 22 + 6 * k : 5;
        } else if (currentBurnerState === "MTFI" || currentBurnerState === "RUN_AUTO") {
          target = 25 + 55 * k * Math.tanh(currentFuelFlow / 10);
        }
        const noise = (Math.random() - 0.5) * 2;
        return clamp(prev + (target - prev) * 0.25 + noise, 0, 80);
      });

      // Update simulated stack temperature
      setSimStackF((prev) => {
        const dt = 0.1; // integration step seconds
        let tau = 1.5; // time constant
        let target = currentAmbientF;
        if (currentBurnerState === "OFF" || currentBurnerState === "DRIVE_HI" || currentBurnerState === "PREPURGE_HI" || currentBurnerState === "DRIVE_LOW" || currentBurnerState === "LOW_PURGE_MIN" || currentBurnerState === "POSTPURGE" || currentBurnerState === "LOCKOUT") { 
          tau = 3; target = currentAmbientF; // cool to ambient
        } else if (currentBurnerState === "PTFI") {
          tau = 2.5; target = Math.max(currentAmbientF + 40, currentSetpointF - 80);
        } else if (currentBurnerState === "MTFI") {
          tau = 4; target = Math.max(currentAmbientF + 80, currentSetpointF - 40);
        } else if (currentBurnerState === "RUN_AUTO") {
          tau = 6; target = currentSetpointF;
        }
        return prev + (target - prev) * (dt / tau);
      });
    }, 100);
    
    return () => clearInterval(id);
  }, [airFlowRef, ambientFRef, boilerOnRef, fuelFlowRef, fuelRef, setpointFRef, simSpeedMultiplierRef]);

  // ----------------------- Control actions -----------------------
  const resetProgrammer = useCallback(() => {
    setLockoutReason("");
    setLockoutPending(false);
    flameOutTimerRef.current = 0;
    stateTimeRef.current = 0;
    setT5Spark(false); setT6Pilot(false); setT7Main(false);
    setBurnerState(boilerOn ? "DRIVE_HI" : "OFF");
  }, [boilerOn]);

  const advanceStep = useCallback(() => {
    const s = burnerStateRef.current;
    const jump = (next) => { setBurnerState(next); burnerStateRef.current = next; stateTimeRef.current = 0; };

    if (s === "OFF") { jump("DRIVE_HI"); return; }
    if (s === "DRIVE_HI") { jump("PREPURGE_HI"); return; }
    if (s === "PREPURGE_HI") { jump("DRIVE_LOW"); return; }
    if (s === "DRIVE_LOW") { jump("LOW_PURGE_MIN"); return; }
    if (s === "LOW_PURGE_MIN") {
      setT5Spark(true); setT6Pilot(true); setT7Main(false); jump("PTFI"); return; }
    if (s === "PTFI") {
      setFlameSignal(25); flameSignalRef.current = 25; setT7Main(true); jump("MTFI"); return; }
    if (s === "MTFI") {
      setT5Spark(false); setT6Pilot(false); jump("RUN_AUTO");
      return; }
    if (s === "RUN_AUTO") { return; }
    if (s === "POSTPURGE") { jump("OFF"); return; }
    if (s === "LOCKOUT") { return; }

    if (s === "PREPURGE_HI") { stateTimeRef.current = EP160.PURGE_HF_SEC * 1000; return; }
  }, []);

  // ----------------------- Computed values -----------------------
  const effectiveFuelOutput = t7Main ? fuelFlow : (t6Pilot ? Math.min(fuelFlow, Math.max(0.5, 2 * 0.5)) : 0);

  return {
    // State
    burnerState,
    setBurnerState,
    simStackF,
    setSimStackF,
    t5Spark,
    setT5Spark,
    t6Pilot,
    setT6Pilot,
    t7Main,
    setT7Main,
    flameSignal,
    setFlameSignal,
    stateCountdown,
    setStateCountdown,
    lockoutReason,
    setLockoutReason,
    lockoutPending,
    setLockoutPending,
    
    // Computed values
    effectiveFuelOutput,
    steady,
    
    // Actions
    resetProgrammer,
    advanceStep,
    
    // Constants
    EP160,
    IGNITABLE_EA,
    STABLE_EA,
    
    // Refs (for external access if needed)
    stateTimeRef,
    flameOutTimerRef,
    burnerStateRef,
    flameSignalRef,
    lockoutPendingRef,
    steadyRef,
    simStackRef,
  };
}