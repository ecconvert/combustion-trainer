/**
 * useAppState Hook
 * 
 * Central state coordination hook that manages:
 * - Core simulation state (boiler, burner, fuel, air)
 * - Cross-component state synchronization
 * - Shared computations and derived state
 * - Event coordination between systems
 * - Reference management for performance
 * 
 * This hook serves as the central nervous system for the combustion trainer,
 * coordinating state that multiple components and systems depend on.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { FUELS } from '../lib/fuels';
import { f2c } from '../lib/math';
import { computeCombustion } from '../lib/chemistry';

const SAVED_KEY = "ct_saved_v1";

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_KEY)) || [];
    return saved.slice(-100); // keep only the most recent 100
  } catch (e) {
    console.error("Failed to load saved data:", e);
    return [];
  }
}

export function useAppState() {
  // ----------------------- Core simulation state -----------------------
  const [boilerOn, setBoilerOn] = useState(false); // master power switch
  const [rheostat, setRheostat] = useState(0); // firing-rate input 0–100%
  const [minFuel, setMinFuel] = useState(2); // derived from regulator pressure
  const [maxFuel, setMaxFuel] = useState(18);

  // User-adjustable flow inputs (molar basis)
  const [fuelFlow, setFuelFlow] = useState(5); // fuel flow (arbitrary mol/min scale)
  const [airFlow, setAirFlow] = useState(60); // combustion air flow (mol/min)
  const [ambientF, setAmbientF] = useState(70); // surrounding temperature

  // ----------------------- Burner simulator state machine -----------------------
  const [burnerState, setBurnerState] = useState("OFF"); // current programmer state
  const [simStackF, setSimStackF] = useState(150); // simulated stack temperature
  const [setpointF, setSetpointF] = useState(350); // stack temperature target
  const stateTimeRef = useRef(0); // milliseconds elapsed in current state

  // ----------------------- Analyzer state machine -----------------------
  const [saved, setSaved] = useState(loadSaved); // logged analyzer readings
  const [t5Spark, setT5Spark] = useState(false); // output relay states for animation
  const [t6Pilot, setT6Pilot] = useState(false);
  const [t7Main, setT7Main] = useState(false);
  const [flameSignal, setFlameSignal] = useState(0); // simulated flame scanner strength
  const [stateCountdown, setStateCountdown] = useState(null); // seconds remaining in timed states
  const flameOutTimerRef = useRef(0); // tracks flame failure detection time
  const [lockoutReason, setLockoutReason] = useState("");
  const [lockoutPending, setLockoutPending] = useState(false);

  // ----------------------- Fuel and scenario management -----------------------
  const [fuelKey, setFuelKey] = useState("Natural Gas"); // currently selected fuel key
  const [scenarioSel, setScenarioSel] = useState("");

  // Derived fuel object
  const fuel = useMemo(() => FUELS[fuelKey] || FUELS["Natural Gas"], [fuelKey]);
  const isGas = fuel.type === "gas";
  const isOil = fuel.type === "oil";

  // ----------------------- Metering system state -----------------------
  const [meterTab, setMeterTab] = useState("Gas"); // which meter UI is visible
  const [gasDialSize, setGasDialSize] = useState(1); // cubic ft per dial revolution
  const [gasRunning, setGasRunning] = useState(false); // manual timing running?
  const [gasLaps, setGasLaps] = useState([]); // recorded revolution times
  
  // Gas meter timer ref
  const gasStartRef = useRef(null);

  // Oil metering parameters
  const [nozzleGPH100, setNozzleGPH100] = useState(0.75); // nozzle rating at 100 psi
  const [oilPressure, setOilPressure] = useState(100); // pump pressure

  // ----------------------- Regulator pressure state -----------------------
  const [regPress, setRegPress] = useState(3.5); // in. w.c. for NG baseline; reset on fuel change

  // ----------------------- Performance references -----------------------
  // Create refs for performance-critical state that needs to be accessed in intervals
  const boilerOnRef = useRef(boilerOn);
  const burnerStateRef = useRef(burnerState);
  const fuelRef = useRef(fuel);
  const flameSignalRef = useRef(flameSignal);
  const lockoutPendingRef = useRef(lockoutPending);
  const ambientFRef = useRef(ambientF);
  const setpointFRef = useRef(setpointF);
  const fuelFlowRef = useRef(fuelFlow);
  const airFlowRef = useRef(airFlow);

  // Update refs when state changes
  useEffect(() => { boilerOnRef.current = boilerOn; }, [boilerOn]);
  useEffect(() => { burnerStateRef.current = burnerState; }, [burnerState]);
  useEffect(() => { fuelRef.current = fuel; }, [fuel]);
  useEffect(() => { flameSignalRef.current = flameSignal; }, [flameSignal]);
  useEffect(() => { lockoutPendingRef.current = lockoutPending; }, [lockoutPending]);
  useEffect(() => { ambientFRef.current = ambientF; }, [ambientF]);
  useEffect(() => { setpointFRef.current = setpointF; }, [setpointF]);
  useEffect(() => { fuelFlowRef.current = fuelFlow; }, [fuelFlow]);
  useEffect(() => { airFlowRef.current = airFlow; }, [airFlow]);

  // ----------------------- Derived computations -----------------------
  // Combustion calculations
  const disp = useMemo(() => {
    try {
      return computeCombustion(fuelFlow, airFlow, fuel, f2c(simStackF), f2c(ambientF));
    } catch (e) {
      console.warn("Combustion calculation failed:", e);
      return { O2: 0, CO2: 0, CO: 0, NOx: 0, phi: 1, temperature: simStackF };
    }
  }, [fuelFlow, airFlow, fuel, simStackF, ambientF]);

  // Effective fuel flow (accounting for valve states)
  const effectiveFuel = useMemo(
    () => (t7Main ? fuelFlow : (t6Pilot ? Math.min(fuelFlow, Math.max(0.5, minFuel * 0.5)) : 0)),
    [t7Main, t6Pilot, fuelFlow, minFuel]
  );

  // Gas flow calculations for meters
  const gasCamCFH = useMemo(() => (isGas ? Math.max(0, fuelFlow) : 0), [isGas, fuelFlow]);
  const gasBurnerCFH = useMemo(() => (isGas ? Math.max(0, effectiveFuel) : 0), [isGas, effectiveFuel]);
  
  // Gas meter statistics
  const gasAvg = useMemo(() => {
    if (gasLaps.length === 0) return 0;
    return gasLaps.reduce((sum, t) => sum + t, 0) / gasLaps.length;
  }, [gasLaps]);
  
  const gasCFH = useMemo(
    () => (gasAvg > 0 ? (3600 * gasDialSize) / gasAvg : 0),
    [gasAvg, gasDialSize],
  );
  
  const gasMBH = useMemo(() => gasCFH * fuel.HHV / 1000, [gasCFH, fuel]);
  
  const gasMeterRevSec = useMemo(
    () => (gasBurnerCFH > 0 ? (3600 * gasDialSize) / gasBurnerCFH : 0),
    [gasBurnerCFH, gasDialSize]
  );
  const gasMBH_model = useMemo(() => gasBurnerCFH * fuel.HHV / 1000, [gasBurnerCFH, fuel]);

  // Oil flow calculations
  const oilGPH = useMemo(
    () => nozzleGPH100 * Math.sqrt(oilPressure / 100),
    [nozzleGPH100, oilPressure],
  );
  const oilMBH = useMemo(() => oilGPH * fuel.HHV / 1000, [oilGPH, fuel]);
  
  // Always-tracking mapping vs actual burner flow for oil
  const oilCamGPH = useMemo(() => (isOil ? Math.max(0, fuelFlow) : 0), [isOil, fuelFlow]);
  const oilBurnerGPH = useMemo(() => (isOil ? Math.max(0, effectiveFuel) : 0), [isOil, effectiveFuel]);
  const oilSecPerGal = useMemo(() => (oilBurnerGPH > 0 ? 3600 / oilBurnerGPH : 0), [oilBurnerGPH]);

  // ----------------------- State coordination actions -----------------------
  // Reset burner system
  const resetBurner = useCallback(() => {
    setT5Spark(false);
    setT6Pilot(false);
    setT7Main(false);
    setBurnerState(boilerOn ? "DRIVE_HI" : "OFF");
    setFlameSignal(0);
    setLockoutReason("");
    setLockoutPending(false);
    stateTimeRef.current = 0;
  }, [boilerOn]);

  // Gas meter control functions
  const startGasClock = useCallback(() => {
    setGasRunning(true);
    gasStartRef.current = performance.now();
    setGasLaps([]);
  }, []);

  const lapGasClock = useCallback(() => {
    if (!gasRunning) return;
    const now = performance.now();
    const dt = (now - gasStartRef.current) / 1000;
    setGasLaps((l) => [...l, dt]);
    gasStartRef.current = now;
  }, [gasRunning]);

  const stopGasClock = useCallback(() => setGasRunning(false), []);

  const resetGasClock = useCallback(() => {
    setGasRunning(false);
    setGasLaps([]);
    gasStartRef.current = null;
  }, []);

  // Scenario application
  const applyScenario = useCallback((scenario) => {
    setScenarioSel(scenario);
    // Scenario logic would be implemented here based on scenario type
    // This is a placeholder for scenario coordination
  }, []);

  // Save reading to localStorage
  const saveReading = useCallback((reading) => {
    const newSaved = [...saved, reading].slice(-100); // keep only latest 100
    setSaved(newSaved);
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(newSaved));
    } catch (e) {
      console.error("Failed to save reading:", e);
    }
  }, [saved]);

  return {
    // Core state
    boilerOn,
    setBoilerOn,
    rheostat,
    setRheostat,
    minFuel,
    setMinFuel,
    maxFuel,
    setMaxFuel,
    fuelFlow,
    setFuelFlow,
    airFlow,
    setAirFlow,
    ambientF,
    setAmbientF,

    // Burner state
    burnerState,
    setBurnerState,
    simStackF,
    setSimStackF,
    setpointF,
    setSetpointF,
    stateTimeRef,

    // Analyzer state
    saved,
    setSaved,
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
    flameOutTimerRef,
    lockoutReason,
    setLockoutReason,
    lockoutPending,
    setLockoutPending,

    // Fuel and scenarios
    fuelKey,
    setFuelKey,
    fuel,
    isGas,
    isOil,
    scenarioSel,
    setScenarioSel,

    // Metering system
    meterTab,
    setMeterTab,
    gasDialSize,
    setGasDialSize,
    gasRunning,
    setGasRunning,
    gasLaps,
    setGasLaps,
    gasStartRef,
    nozzleGPH100,
    setNozzleGPH100,
    oilPressure,
    setOilPressure,

    // Regulator pressure
    regPress,
    setRegPress,

    // Performance refs
    boilerOnRef,
    burnerStateRef,
    fuelRef,
    flameSignalRef,
    lockoutPendingRef,
    ambientFRef,
    setpointFRef,
    fuelFlowRef,
    airFlowRef,

    // Derived computations
    disp,
    effectiveFuel,
    gasCamCFH,
    gasBurnerCFH,
    gasAvg,
    gasCFH,
    gasMBH,
    gasMeterRevSec,
    gasMBH_model,
    oilGPH,
    oilMBH,
    oilCamGPH,
    oilBurnerGPH,
    oilSecPerGal,

    // Coordination actions
    resetBurner,
    startGasClock,
    lapGasClock,
    stopGasClock,
    resetGasClock,
    applyScenario,
    saveReading
  };
}