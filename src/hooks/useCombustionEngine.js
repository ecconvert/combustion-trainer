import { useState, useMemo, useEffect, useRef } from 'react';
import { FUELS } from '../lib/fuels';
import { clamp, lerp } from '../lib/math';
import { computeCombustion } from '../lib/chemistry';

/**
 * Hook for managing combustion engine simulation
 * Handles fuel/air calculations, chemistry, efficiency, and flame modeling
 */
export default function useCombustionEngine() {
  // ----------------------- Fuel selection -----------------------
  const [fuelKey, setFuelKey] = useState("Natural Gas");
  const fuel = FUELS[fuelKey];
  const isOil = fuelKey === "Fuel Oil #2" || fuelKey === "Biodiesel";
  const isGas = !isOil;

  // ----------------------- Flow inputs -----------------------
  const [fuelFlow, setFuelFlow] = useState(5); // fuel flow (arbitrary mol/min scale)
  const [airFlow, setAirFlow] = useState(60); // combustion air flow (mol/min)
  const [ambientF, setAmbientF] = useState(70); // surrounding temperature
  
  // ----------------------- Burner state -----------------------
  const [simStackF, setSimStackF] = useState(150); // simulated stack temperature
  const [setpointF, setSetpointF] = useState(350); // stack temperature target
  const [t5Spark, setT5Spark] = useState(false);
  const [t6Pilot, setT6Pilot] = useState(false);
  const [t7Main, setT7Main] = useState(false);
  const [flameSignal, setFlameSignal] = useState(0);
  
  // ----------------------- Fuel management -----------------------
  const [minFuel, setMinFuel] = useState(2);
  const [maxFuel, setMaxFuel] = useState(18);
  const [regPress, setRegPress] = useState(3.5); // in. w.c. for NG baseline
  
  // ----------------------- Metering -----------------------
  const [gasDialSize, setGasDialSize] = useState(1);
  const [nozzleGPH100, setNozzleGPH100] = useState(0.75);
  const [oilPressure, setOilPressure] = useState(100);

  // ----------------------- Calculated values -----------------------
  const effectiveFuel = useMemo(
    () => (t7Main ? fuelFlow : (t6Pilot ? Math.min(fuelFlow, Math.max(0.5, minFuel * 0.5)) : 0)),
    [t7Main, t6Pilot, fuelFlow, minFuel]
  );

  const gasCFH = useMemo(() => (isGas ? Math.max(0, fuelFlow) : 0), [isGas, fuelFlow]);
  const gasBurnerCFH = useMemo(() => (isGas ? Math.max(0, effectiveFuel) : 0), [isGas, effectiveFuel]);
  const gasMBH = useMemo(() => gasBurnerCFH * fuel.HHV / 1000, [gasBurnerCFH, fuel]);

  const oilGPH = useMemo(
    () => nozzleGPH100 * Math.sqrt(oilPressure / 100),
    [nozzleGPH100, oilPressure],
  );
  const oilMBH = useMemo(() => oilGPH * fuel.HHV / 1000, [oilGPH, fuel]);
  const oilBurnerGPH = useMemo(() => (isOil ? Math.max(0, effectiveFuel) : 0), [isOil, effectiveFuel]);

  // ----------------------- Combustion calculations -----------------------
  const steady = useMemo(
    () => computeCombustion({ fuel, fuelFlow: effectiveFuel, airFlow, stackTempF: simStackF, ambientF }),
    [fuel, effectiveFuel, airFlow, simStackF, ambientF],
  );

  const [disp, setDisp] = useState({ O2: 20.9, CO2: 0, CO: 0, COaf: 0, NOx: 0, StackF: 70, Eff: 0 });
  const dispRef = useRef(disp);
  const simStackRef = useRef(simStackF);
  const steadyRef = useRef(steady);
  
  useEffect(() => { dispRef.current = disp; }, [disp]);
  useEffect(() => { simStackRef.current = simStackF; }, [simStackF]);
  useEffect(() => { steadyRef.current = steady; }, [steady]);

  // ----------------------- Analyzer smoothing -----------------------
  useEffect(() => {
    const tauO2 = 0.8, tauCO = 2.0, tauNOx = 1.2, tauT = 3.0; // seconds
    const dt = 0.2; // s
    const id = setInterval(() => {
      const s = steadyRef.current;
      const stackTarget = simStackRef.current;
      setDisp((prev) => {
        const nextO2 = lerp(prev.O2, s.O2_pct, dt / tauO2);
        const nextCO = lerp(prev.CO, s.CO_ppm, dt / tauCO);
        const nextNOx = lerp(prev.NOx, s.NOx_ppm, dt / tauNOx);
        const nextT = lerp(prev.StackF, stackTarget, dt / tauT);
        const nextCO2 = lerp(prev.CO2, s.CO2_pct, dt / 1.0);
        const COaf = Math.round(nextCO * (20.9 / Math.max(0.1, 20.9 - nextO2)));
        const Eff = s.efficiency; // keep efficiency from steady calc
        return { O2: nextO2, CO2: nextCO2, CO: nextCO, COaf, NOx: nextNOx, StackF: nextT, Eff };
      });
    }, 200);
    return () => clearInterval(id);
  }, []);

  // ----------------------- Auto setpoint calculation -----------------------
  useEffect(() => {
    const { C, H, O } = fuel.formula;
    const fuelMol = Math.max(0.0001, fuelFlow);
    const O2_needed = fuelMol * (C + H / 4 - O / 2);
    const airStoich = O2_needed / 0.21;
    const EA = Math.max(0.2, airFlow / Math.max(0.001, airStoich));
    const base = 250 + 18 * fuelMol + 40 * Math.tanh((EA - 1) * 1.5);
    setSetpointF(clamp(base, 150, 600));
  }, [fuel, fuelFlow, airFlow]);

  // ----------------------- Fuel pressure management -----------------------
  useEffect(() => {
    const baseP = isOil ? 100 : (fuelKey === "Propane" ? 11 : 3.5);
    setRegPress(baseP);
  }, [fuelKey, isOil]);

  const BASE_MIN_FUEL = 2;
  const BASE_MAX_FUEL = 18;

  useEffect(() => {
    const baseP = isOil ? 100 : (fuelKey === "Propane" ? 11 : 3.5);
    const scale = Math.sqrt(Math.max(0, regPress) / Math.max(0.0001, baseP));
    const newMin = Math.max(0, BASE_MIN_FUEL * scale);
    const newMax = Math.max(newMin, BASE_MAX_FUEL * scale);
    setMinFuel(newMin);
    setMaxFuel(newMax);
  }, [regPress, fuelKey, isOil]);

  useEffect(() => {
    setFuelFlow((v) => clamp(v, minFuel, maxFuel));
  }, [minFuel, maxFuel]);

  // ----------------------- Flame modeling -----------------------
  const ea = steady.excessAir;
  const phi = 1 / Math.max(0.01, ea);
  const flameIntensity = effectiveFuel / 10;
  const pilotFuel = Math.min(fuelFlow, Math.max(0.5, minFuel * 0.5));
  const pilotIntensity = pilotFuel / 10;

  const flameActive = (t7Main || t6Pilot) && flameSignal >= 10;
  const showPilotFlame = flameActive && t6Pilot;
  const showMainFlame = flameActive && t7Main;

  return {
    // Fuel selection
    fuelKey,
    setFuelKey,
    fuel,
    isOil,
    isGas,
    
    // Flow inputs
    fuelFlow,
    setFuelFlow,
    airFlow,
    setAirFlow,
    ambientF,
    setAmbientF,
    
    // Burner state
    simStackF,
    setSimStackF,
    setpointF,
    setSetpointF,
    t5Spark,
    setT5Spark,
    t6Pilot,
    setT6Pilot,
    t7Main,
    setT7Main,
    flameSignal,
    setFlameSignal,
    
    // Fuel management
    minFuel,
    setMinFuel,
    maxFuel,
    setMaxFuel,
    regPress,
    setRegPress,
    
    // Metering
    gasDialSize,
    setGasDialSize,
    nozzleGPH100,
    setNozzleGPH100,
    oilPressure,
    setOilPressure,
    
    // Calculated values
    effectiveFuel,
    gasCFH,
    gasBurnerCFH,
    gasMBH,
    oilGPH,
    oilMBH,
    oilBurnerGPH,
    
    // Combustion results
    steady,
    disp,
    dispRef,
    
    // Flame modeling
    ea,
    phi,
    flameIntensity,
    pilotIntensity,
    flameActive,
    showPilotFlame,
    showMainFlame,
  };
}