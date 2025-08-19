/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Main simulator UI for the Combustion Trainer.
 *
 * This single file contains React components and state management for
 * the entire educational boiler simulator. It depends on several helper
 * modules located in `src/lib` for math, chemistry calculations, cam
 * map generation and CSV export. Recharts is used for trend plotting.
 */
/* global process */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useLayoutEffect as _useLayoutEffect,
} from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FUELS } from "./lib/fuels";
import { clamp, lerp, f2c, num } from "./lib/math";
import { downloadCSV } from "./lib/csv";
import { buildSafeCamMap } from "./lib/cam";
import CollapsibleSection from "./components/CollapsibleSection";
import RightDrawer from "./components/RightDrawer";
import { useUIState } from "./components/UIStateContext";
import SettingsMenu from "./components/SettingsMenu";
import AirDrawerIndicator from "./components/AirDrawerIndicator";
import GridAutoSizer from "./components/GridAutoSizer";
import { useTour } from "./hooks/useTour";
import { usePanelManagement } from "./hooks/usePanelManagement";
import useLayoutManager from "./hooks/useLayoutManager";
import { useAppState } from "./hooks/useAppState";
import { useSimulationLoop } from "./hooks/useSimulationLoop";
import useSettings from "./hooks/useSettings";
import { panels } from "./panels";
const ResponsiveGridLayout = WidthProvider(Responsive);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? _useLayoutEffect : useEffect;
const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

/**
 * Visual representation of a flame.
 *
 * @param {Object} props
 * @param {number} props.phi - Equivalence ratio (φ) used to choose color.
 * @param {number} props.intensity - 0–1 scale controlling size/brightness.
 * @param {boolean} [props.pilot=false] - Render a smaller pilot flame.
 */

const seriesConfig = [
  { key: 'O2', name: 'O₂ %', yAxisId: 'left' },
  { key: 'CO2', name: 'CO₂ %', yAxisId: 'left' },
  { key: 'CO', name: 'CO ppm', yAxisId: 'right' },
  { key: 'NOx', name: 'NOₓ ppm', yAxisId: 'right' },
  { key: 'StackF', name: 'Stack °F', yAxisId: 'right' },
  { key: 'Eff', name: 'Eff %', yAxisId: 'left' },
];

const SAVED_KEY = "ct_saved_v1";

function Flame({ phi, intensity, pilot = false }) {
  let color = "#48b3ff"; // lean -> blue
  if (phi > 1.05 && phi < 1.2) color = "#ff8c00"; // near stoich -> orange
  if (phi >= 1.2) color = "#ffd54d"; // rich -> yellow
  let size = clamp(40 + intensity * 60, 30, 120);

  if (pilot) {
    color = "#ff8c00"; // pilot flame bright orange
    size = clamp(20 + intensity * 40, 10, 60);
  }

  return (
    <div
      aria-label="flame"
      className="mx-auto rounded-full opacity-90 shadow-inner"
      style={{
        width: size,
        height: size * (pilot ? 1.1 : 1.2),
        background: `radial-gradient(circle at 50% 60%, ${color}, transparent 60%)`,
        filter: "blur(1px)",
        animation: "flicker 0.18s infinite alternate",
      }}
    />
  );
}

/**
 * Small animated spark used during ignition.
 */
function Spark() {
  return (
    <div
      aria-label="spark"
      className="absolute"
      style={{
        width: 14,
        height: 14,
        borderRadius: "50%",
        background: "radial-gradient(circle, #fff59d, rgba(255,193,7,0.9) 40%, rgba(255,193,7,0) 70%)",
        filter: "blur(0.5px)",
        animation: "spark 0.08s infinite alternate",
      }}
    />
  );
}

/**
 * Puff of smoke displayed when CO levels indicate soot production.
 */
function Smoke() {
  return (
    <div
      aria-label="smoke"
      className="absolute bottom-1/2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
    >
      <div
        className="w-4 h-4 rounded-full bg-gray-400 opacity-60"
        style={{ animation: "smoke 1.5s infinite" }}
      />
      <div
        className="w-3 h-3 rounded-full bg-gray-400 opacity-40 mt-1"
        style={{ animation: "smoke 1.5s infinite 0.3s" }}
      />
      <div
        className="w-5 h-5 rounded-full bg-gray-300 opacity-30 mt-1"
        style={{ animation: "smoke 1.5s infinite 0.6s" }}
      />
    </div>
  );
}


/**
 * Simple status LED with label.
 *
 * @param {Object} props
 * @param {boolean} props.on - Whether the LED is lit.
 * @param {string} props.label - Text label shown to the right.
 * @param {string} [props.color="limegreen"] - Light color when on.
 */
function Led({ on, label, color = "limegreen" }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ background: on ? color : "#cbd5e1", boxShadow: on ? `0 0 10px ${color}` : "none" }}
      />
      <span className="text-xs text-slate-600">{label}</span>
    </div>
  );
}

function PanelHeader({ title, right, dockAction }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="label drag-handle cursor-move select-none">{title}</div>
      <div className="flex items-center gap-2">
        {right}
        {dockAction}
      </div>
    </div>
  );
}

export default function CombustionTrainer({ initialConfig } = { initialConfig: undefined }) {
  const { drawerOpen, setDrawerOpen, seriesVisibility, setSeriesVisibility } = useUIState();
  
  // ----------------------- Core State Management -----------------------
  const appState = useAppState();
  const {
    // Core simulation state
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
    setSetpointF,
    stateTimeRef,
    
    // Analyzer state
    saved,
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
    setLockoutPending,
    
    // Fuel and scenarios
    fuelKey,
    setFuelKey,
    fuel,
    isGas,
    scenarioSel,
    setScenarioSel,
    
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
    rheostatRef,
    simStackFRef,
    
    // Derived computations
    disp,
    effectiveFuel,
    gasCamCFH,
    gasBurnerCFH,
    
    // Coordination actions
    saveReading
  } = appState;
  
  // Initialize settings hook with initial config
  const settingsHook = useSettings(initialConfig);
  const { 
    config,
    showSettings,
    setShowSettings,
    handleApply,
    handleCancel,
    handlePreview,
    configBeforeSettings,
    theme
  } = settingsHook;
  const simSpeedMultiplierRef = useRef(config.general?.fastForward ? 10 : 1);
  
  // ----------------------- Simulation Loop Management -----------------------
  const simulationLoop = useSimulationLoop({
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
    
    // State setters from useAppState  
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
    flameOutTimerRef,
  });
  
  const { EP160 } = simulationLoop;
  
  
  // Settings modal visibility
  const unitSystem = config.units.system;

  // Initialize layout manager hook
  const layoutManager = useLayoutManager();
  const { 
    rglBreakpoints,
    rglCols,
    defaultLayouts,
    layouts,
    setLayouts,
    setAutoSizeLock,
    setBreakpoint,
    handleLayoutChange,
    setItemRows,
    handleResetLayouts
  } = layoutManager;

  useIsomorphicLayoutEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // ----------------------- Panel Management -----------------------
  const panelManagement = usePanelManagement();
  const { mainItems, dock } = panelManagement;

  // Calculate isDarkMode from hook-provided theme  
  const isDarkMode = useMemo(() => {
    if (typeof window === 'undefined') return false;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return theme === 'dark' || (theme === 'system' && prefersDark);
  }, [theme]);

  const applyTheme = (themeValue) => {
    const html = document.documentElement;
    const body = document.body;
    const rootEl = document.getElementById('root');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = themeValue === 'dark' || (themeValue === 'system' && prefersDark);
    // Keep all potential ancestors in sync so Tailwind's dark: variant cannot get stuck
    [html, body, rootEl].forEach((el) => el && el.classList.toggle('dark', isDark));
    // Ensure native form controls (select, inputs) follow current theme
    html.style.setProperty('color-scheme', isDark ? 'dark' : 'light');
  };
  // Extract CSS variables to drive 3rd-party components (e.g., charts)
  const themeVars = useMemo(() => {
    if (typeof window === 'undefined') {
      return { background: '#f8fafc', foreground: '#0f172a', card: '#ffffff', border: '#e2e8f0', muted: '#64748b' };
    }
    const s = getComputedStyle(document.documentElement);
    const read = (name, fallback) => (s.getPropertyValue(name) || '').trim() || fallback;
    return {
      background: read('--background', '#f8fafc'),
      foreground: read('--foreground', '#0f172a'),
      card: read('--card', '#ffffff'),
      border: read('--border', '#e2e8f0'),
      muted: read('--muted', '#64748b'),
    };
  }, [isDarkMode]);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(theme);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);
  
  // Scenario selection state and handler
  const handleScenarioChange = useCallback((e) => {
    const val = e.target.value;
    setScenarioSel(val);
    if (val === "" || val === "Reset") {
      // reset scenario-specific overrides if implemented later
    }
  }, []);
  // ----------------------- Fuel selection -----------------------
  // Helper booleans for conditional UI/logic
  const isOil = fuelKey === "Fuel Oil #2" || fuelKey === "Biodiesel";

  // EP160 timing constants now provided by useSimulationLoop hook
  // Ranges for air/fuel ratio expressed as excess air (EA)
  const IGNITABLE_EA = { min: 0.85, max: 1.6 }; // flame can light within this EA window
  const STABLE_EA = { min: 0.9, max: 1.5 }; // stable flame once running

  // ----------------------- Extracted to useAppState hook -----------------------
  // Core state, burner state, analyzer state, fuel selection all now managed by useAppState
  
  // ----------------------- Remaining local state -----------------------
  const chamberRef = useRef(null); // chamber container for sizing overlays

  // ----------------------- Metering panel -----------------------
  const [meterTab, setMeterTab] = useState("Gas"); // which meter UI is visible
  const [gasDialSize, setGasDialSize] = useState(1); // cubic ft per dial revolution
  const [gasRunning, setGasRunning] = useState(false); // manual timing running?
  const gasStartRef = useRef(null); // timestamp when manual timing started
  const [gasLaps, setGasLaps] = useState([]); // recorded revolution times
  const gasAvg = useMemo(
    () => (gasLaps.length ? gasLaps.reduce((a, b) => a + b, 0) / gasLaps.length : 0),
    [gasLaps],
  );
  // Convert average lap time into cubic feet per hour and MBH
  const gasCFH = useMemo(
    () => (gasAvg > 0 ? (3600 * gasDialSize) / gasAvg : 0),
    [gasAvg, gasDialSize],
  );
  const gasMBH = useMemo(() => gasCFH * fuel.HHV / 1000, [gasCFH, fuel]);

  // Derived gas meter statistics for the running burner (using hook-provided gasBurnerCFH)
  const gasMeterRevSec = useMemo(
    () => (gasBurnerCFH > 0 ? (3600 * gasDialSize) / gasBurnerCFH : 0),
    [gasBurnerCFH, gasDialSize]
  );
  const gasMBH_model = useMemo(() => gasBurnerCFH * fuel.HHV / 1000, [gasBurnerCFH, fuel]);

  // Oil metering parameters
  const [nozzleGPH100, setNozzleGPH100] = useState(0.75); // nozzle rating at 100 psi
  const [oilPressure, setOilPressure] = useState(100); // pump pressure
  const oilGPH = useMemo(
    () => nozzleGPH100 * Math.sqrt(oilPressure / 100),
    [nozzleGPH100, oilPressure],
  );
  const oilMBH = useMemo(() => oilGPH * fuel.HHV / 1000, [oilGPH, fuel]);
  // Always-tracking mapping vs actual burner flow for oil
  const oilCamGPH = useMemo(() => (isOil ? Math.max(0, fuelFlow) : 0), [isOil, fuelFlow]);
  const oilBurnerGPH = useMemo(() => (isOil ? Math.max(0, effectiveFuel) : 0), [isOil, effectiveFuel]);
  const oilSecPerGal = useMemo(() => (oilBurnerGPH > 0 ? 3600 / oilBurnerGPH : 0), [oilBurnerGPH]);

  const startGasClock = () => {
    setGasRunning(true);
    gasStartRef.current = performance.now();
    setGasLaps([]);
  };
  const lapGasClock = () => {
    if (!gasRunning) return;
    const now = performance.now();
    const dt = (now - gasStartRef.current) / 1000;
    setGasLaps((l) => [...l, dt]);
    gasStartRef.current = now;
  };
  const stopGasClock = () => setGasRunning(false);
  const resetGasClock = () => {
    setGasRunning(false);
    setGasLaps([]);
    gasStartRef.current = null;
  };
  const exportGasClock = () => {
    const rows = gasLaps.map((t, i) => ({ lap: i + 1, seconds: t.toFixed(2) }));
    rows.push({ lap: "avg", seconds: gasAvg.toFixed(2), CFH: gasCFH.toFixed(1), MBH: gasMBH.toFixed(1) });
    downloadCSV("gas-clock.csv", rows);
  };
// Auto-clock the gas meter: generate a lap each full revolution at the current burner CFH
useEffect(() => {
  if (!gasRunning || !isGas || gasBurnerCFH <= 0) return;
  let timer = null;
  const schedule = () => {
    const sec = (3600 * gasDialSize) / Math.max(0.01, gasBurnerCFH);
    timer = setTimeout(() => {
      setGasLaps((l) => [...l, sec]);
      schedule();
    }, sec * 1000);
  };
  schedule();
  return () => { if (timer) clearTimeout(timer); };
}, [gasRunning, gasDialSize, gasBurnerCFH, isGas]);

  const exportOilClock = () => {
    const rows = [
      {
        nozzleGPH100: nozzleGPH100,
        pressurePsi: oilPressure,
        gphActual: oilGPH.toFixed(2),
        MBH: oilMBH.toFixed(1),
      },
    ];
    downloadCSV("oil-meter.csv", rows);
  };

  // Tuning Mode

  const [tuningOn, setTuningOn] = useState(false);

  const [defaultsLoaded, setDefaultsLoaded] = useState(false);

  const [allCamMaps, setAllCamMaps] = useState(() => {
    if (typeof window === 'undefined') return {};
    try {
      const raw = localStorage.getItem("ct_cam_maps_v1");
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      if (isDev) console.error("Failed to load cam maps:", e);
      return {};
    }
  });

  const fuelKeyForMap = useMemo(() => fuelKey.replace(/ /g, "_"), [fuelKey]);
  const camMap = useMemo(() => allCamMaps[fuelKeyForMap] || {}, [allCamMaps, fuelKeyForMap]);

  const setCamMap = useCallback((updater) => {
    setAllCamMaps(currentAllCamMaps => {
      const currentMap = currentAllCamMaps[fuelKeyForMap] || {};
      const newMap = typeof updater === 'function' ? updater(currentMap) : updater;
      const newAllCamMaps = { ...currentAllCamMaps, [fuelKeyForMap]: newMap };
      try {
        localStorage.setItem("ct_cam_maps_v1", JSON.stringify(newAllCamMaps));
      } catch (e) {
        if (isDev) console.error("Failed to save cam maps:", e);
      }
      return newAllCamMaps;
    });
  }, [fuelKeyForMap]);

  // Current cam position key (rounded to 10%)
  const currentCam = useMemo(() => clamp(Math.round(rheostat / 10) * 10, 0, 100), [rheostat]);

  // Save current fuel/air at current cam position
  const setCamAtCurrent = () => {
    setCamMap((m) => ({
      ...m,
      [currentCam]: {
        fuel: Number(parseFloat(fuelFlow).toFixed(2)),
        air: Number(parseFloat(airFlow).toFixed(2)),
      },
    }));
  };

  // Clear saved point at current cam position
  const clearCamAtCurrent = () => {
    setCamMap((m) => {
      const n = { ...m };
      delete n[currentCam];
      return n;
    });
  };

  // If a saved cam point exists for a given position, apply its flows
  const applyCamIfSaved = (pos) => {
    const k = clamp(Math.round(pos / 10) * 10, 0, 100);
    if (camMap && camMap[k]) {
      const { fuel: f, air: a } = camMap[k];
      setFuelFlow(num(f, fuelFlow));
      setAirFlow(num(a, airFlow));
    }
  };

  // Build and apply safe default cam map
  const applySafeDefaults = () => {
    if (Object.keys(camMap).length > 0) {
      const ok = window.confirm(
        "Overwrite existing tuning points with safe defaults?",
      );
      if (!ok) return;
    }
    const safe = buildSafeCamMap(fuel, minFuel, maxFuel);
    setCamMap(safe);
    if (safe[currentCam]) {
      const { fuel: f, air: a } = safe[currentCam];
      setFuelFlow(num(f, fuelFlow));
      setAirFlow(num(a, airFlow));
    }
    setDefaultsLoaded(true);
    setTimeout(() => setDefaultsLoaded(false), 3000);
  };

  // Baseline min/max fuel at baseline regulator pressures
  const BASE_MIN_FUEL = 2;
  const BASE_MAX_FUEL = 18;

  // Testing/simulation regulator settings
  const [regPress, setRegPress] = useState(3.5); // in. w.c. for NG baseline; reset on fuel change
  // Only one regulator pressure, use regPress for both min and max


  // Derived setpoint as a function of fuel, air, and EA
  useEffect(() => {
    const { C, H, O } = fuel.formula;
    const fuelMol = Math.max(0.0001, fuelFlow);
    const O2_needed = fuelMol * (C + H / 4 - O / 2);
    const airStoich = O2_needed / 0.21;
    const EA = Math.max(0.2, airFlow / Math.max(0.001, airStoich));
    // Base stack target rises with firing rate and EA (more air = more loss)
    const base = 250 + 18 * fuelMol + 40 * Math.tanh((EA - 1) * 1.5);
    setSetpointF(clamp(base, 150, 600));
  }, [fuel, fuelFlow, airFlow]);

  // Reset regulator baselines when fuel type changes
  useEffect(() => {
    const baseP = isOil ? 100 : (fuelKey === "Propane" ? 11 : 3.5); // psi for oil, in. w.c. for gas
    setRegPress(baseP);
  }, [fuelKey, isOil]);

  // Map regulator setpoints to min/max fuel via sqrt pressure law (orifice/nozzle proxy)
  useEffect(() => {
    const baseP = isOil ? 100 : (fuelKey === "Propane" ? 11 : 3.5);
    const scale = Math.sqrt(Math.max(0, regPress) / Math.max(0.0001, baseP));
    // New logic: map regulator pressure to min/max fuel using Math.max, not clamp
    const newMin = Math.max(0, BASE_MIN_FUEL * scale);
    const newMax = Math.max(newMin, BASE_MAX_FUEL * scale);
    setMinFuel(newMin);
    setMaxFuel(newMax);
  }, [regPress, fuelKey, isOil]);

  // Clamp fuelFlow within min/max bounds whenever they change
  useEffect(() => {
    setFuelFlow((v) => clamp(v, minFuel, maxFuel));
  }, [minFuel, maxFuel]);

  // ----------------------- Tour system -----------------------
  const tour = useTour({
    boilerOn,
    setBoilerOn,
    setRheostat,
    burnerStateRef
  });

  const { simSpeedMultiplier, setAdvanceStep, TourComponent } = tour;
  // simSpeedMultiplierRef created earlier, sync with tour value
  useEffect(() => { simSpeedMultiplierRef.current = simSpeedMultiplier; }, [simSpeedMultiplier]);

  // Main simulation loop now handled by useSimulationLoop hook

  // Link rheostat to fuel/air flows
  useEffect(() => {
    // If a tuned cam point exists for this position, apply it
    const mapKey = clamp(Math.round(rheostat / 10) * 10, 0, 100);
    if (camMap && camMap[mapKey]) {
      const { fuel: f, air: a } = camMap[mapKey];
      setFuelFlow(num(f, fuelFlow));
      setAirFlow(num(a, airFlow));
      return;
    }

    // Fallback to default linear mapping
    const mn = clamp(minFuel, 0, 20);
    const mx = clamp(Math.max(mn, maxFuel), 0, 20);
    const frac = clamp(rheostat / 100, 0, 1);
    const targetFuel = mn + (mx - mn) * frac;
    const { C, H, O } = fuel.formula;
    const O2_needed = Math.max(0.0001, targetFuel) * (C + H / 4 - O / 2);
    const airStoich = O2_needed / 0.21;
    const targetEA = 1.2;
    const targetAir = clamp(airStoich * targetEA, 0, 200);
    setFuelFlow(targetFuel);
    setAirFlow(targetAir);
  }, [rheostat, minFuel, maxFuel, fuel, tuningOn, camMap]);

  // Instantaneous chemistry at the simulated stack temperature
  // steady state combustion calculations now provided by useAppState hook as 'disp'

  // Analyzer displayed values with sensor lag and states (local state for now)
  const [dispLocal, setDispLocal] = useState({ O2: 20.9, CO2: 0, CO: 0, COaf: 0, NOx: 0, StackF: 70, Eff: 0 });
  // Use hook-provided disp for steady-state calculations, dispLocal for smoothed analyzer display  
  const steady = disp; // steady-state combustion values from hook
  
  // Keep latest steady-state and stack temperature in refs for a stable analyzer smoother
  const steadyRef = useRef(steady);
  useEffect(() => { steadyRef.current = steady; }, [steady]);
  // simStackFRef now provided by useAppState hook

  // Analyzer smoothing loop (runs continuously; does not reset on every render)
  useEffect(() => {
    const tauO2 = 0.8, tauCO = 2.0, tauNOx = 1.2, tauT = 3.0; // seconds
    const dt = 0.2; // s
    const id = setInterval(() => {
      const s = steadyRef.current;
      const stackTarget = simStackFRef.current;
      setDispLocal((prev) => {
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


  const resetProgrammer = () => {
    setLockoutReason("");
    setLockoutPending(false);
    flameOutTimerRef.current = 0;
    stateTimeRef.current = 0;
    setT5Spark(false); setT6Pilot(false); setT7Main(false);
    setBurnerState(boilerOn ? "DRIVE_HI" : "OFF");
  };

  // Testing helper: advance one state or finish current timed state
  const advanceStep = () => {
    // Provide a deterministic fast-forward for tests: instead of waiting for the
    // 10Hz loop to notice elapsed timers, directly advance state logic. This keeps
    // production simulation identical (only triggered by explicit user click).
    const s = burnerStateRef.current;
    const jump = (next) => { setBurnerState(next); burnerStateRef.current = next; stateTimeRef.current = 0; };

    if (s === "OFF") { jump("DRIVE_HI"); return; }
    if (s === "DRIVE_HI") { jump("PREPURGE_HI"); return; }
    if (s === "PREPURGE_HI") { jump("DRIVE_LOW"); return; }
    if (s === "DRIVE_LOW") { jump("LOW_PURGE_MIN"); return; }
    if (s === "LOW_PURGE_MIN") {
      // Enter PTFI with spark + pilot
      setT5Spark(true); setT6Pilot(true); setT7Main(false); jump("PTFI"); return; }
    if (s === "PTFI") {
      // Prove flame instantly and advance to MTFI
      setFlameSignal(25); flameSignalRef.current = 25; setT7Main(true); jump("MTFI"); return; }
    if (s === "MTFI") {
      // End of MTFI: spark & pilot off, run auto
      setT5Spark(false); setT6Pilot(false); jump("RUN_AUTO");
      if (isTestEnv) { setRheostat(0); }
      return; }
    if (s === "RUN_AUTO") { return; }
    if (s === "POSTPURGE") { jump("OFF"); return; }
    if (s === "LOCKOUT") { return; }

    // Fallback legacy path (should not normally hit)
    if (s === "PREPURGE_HI") { stateTimeRef.current = EP160.PURGE_HF_SEC * 1000; return; }
  };

  // Register advanceStep function with tour system
  useEffect(() => {
    setAdvanceStep(advanceStep);
  }, [setAdvanceStep]);

  // Log history for trend chart
  const [history, setHistory] = useState([]);
  const dispRef = useRef(dispLocal);
  // rheostatRef now provided by useAppState hook
  useEffect(() => { dispRef.current = dispLocal; }, [dispLocal]);
  // rheostat ref sync now handled by useAppState hook
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const row = {
        ts: now,
        t: new Date(now).toLocaleTimeString(),
        Rate: rheostatRef.current,
        FuelFlow: Number(parseFloat(fuelFlowRef.current).toFixed(2)),
        AirFlow: Number(parseFloat(airFlowRef.current).toFixed(2)),
        O2: Number(dispRef.current.O2.toFixed(2)),
        CO2: Number(dispRef.current.CO2.toFixed(2)),
        CO: Math.round(dispRef.current.CO),
        NOx: Math.round(dispRef.current.NOx),
        StackF: Math.round(dispRef.current.StackF),
        Eff: Number(Number(dispRef.current.Eff).toFixed(1)),
      };
      setHistory((h) => [...h.slice(-config.general.trendLength), row]);
    }, config.analyzer.samplingSec * 1000);
    return () => clearInterval(id);
  }, [config.analyzer.samplingSec, config.general.trendLength]);

  // saveReading function now provided by useAppState hook

  const exportSavedReadings = useCallback(() => {
    if (!saved.length) return;
    const headers = [
      "id",
      "t",
      "fuel",
      "setFire",
      "airFlow",
      "fuelFlow",
      "stackF",
      "O2",
      "CO2",
      "COppm",
      "NOxppm",
      "excessAir",
      "efficiency",
      "notes",
    ];
    const lines = [headers.join(",")].concat(
      saved.map((r) =>
        [
          r.id,
          new Date(r.t).toISOString(),
          r.fuel ?? "",
          r.setFire ?? "",
          r.airFlow ?? "",
          r.fuelFlow ?? "",
          r.stackF ?? "",
          r.O2 ?? "",
          r.CO2 ?? "",
          r.COppm ?? "",
          r.NOxppm ?? "",
          r.excessAir ?? "",
          r.efficiency ?? "",
          JSON.stringify(r.notes ?? ""),
        ].join(","),
      ),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saved_readings.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [saved]);
  // Analyzer simple state machine
  const [anState, setAnState] = useState("OFF");
  const [probeInFlue, setProbeInFlue] = useState(false);
  // ZERO progress state for stabilization UI
  const [zeroProgress, setZeroProgress] = useState(0);
  const ZERO_DURATION_MS = 6000; // 6s stabilization demo
  const startAnalyzer = () => setAnState("ZERO");
  const finishZero = () => setAnState("READY");
  const insertProbe = () => {
    setProbeInFlue(true);
    setAnState("SAMPLING");
  };
  const holdAnalyzer = () => setAnState("HOLD");
  const resumeAnalyzer = () => setAnState("SAMPLING");
  // Tuning assistant
  const tuningActive = tuningOn;
  // Analyzer advanced menu / UI overlay state (incremental implementation toward full simulator PRD)
  const [anMenuOpen, setAnMenuOpen] = useState(false);
  const [anMenuScreen, setAnMenuScreen] = useState('MAIN'); // MAIN | MEASUREMENTS | FUEL | LIVE | RECORDS | SETTINGS | DIAGNOSIS
  const [anMenuIndex, setAnMenuIndex] = useState(0);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null); // e.g. 'Flue Gas Analysis'
  const [selectedFuel, setSelectedFuel] = useState(null);

  const mainMenuItems = [
    'Measurements',
    'Measurement Records',
    'Device Settings',
    'Instrument Diagnosis',
  ];
  const measurementItems = [
    'Flue Gas Analysis',
    'Draught Measurement',
    'Differential Pressure',
    'CO Ambient',
  ];
  const fuelItems = [
    'Natural Gas',
    'Light Oil',
    'Wood Pellets',
  ];

  const handleMenuNav = (dir) => {
    if (!anMenuOpen) return;
    const list = anMenuScreen === 'MAIN' ? mainMenuItems
      : anMenuScreen === 'MEASUREMENTS' ? measurementItems
      : anMenuScreen === 'FUEL' ? fuelItems
      : [];
    if (!list.length) return;
    setAnMenuIndex((i) => {
      const next = (i + (dir === 'up' ? -1 : 1) + list.length) % list.length;
      return next;
    });
  };
  const handleMenuOk = () => {
    if (!anMenuOpen) return;
    if (anMenuScreen === 'MAIN') {
      const sel = mainMenuItems[anMenuIndex];
      if (sel === 'Measurements') { setAnMenuScreen('MEASUREMENTS'); setAnMenuIndex(0); }
      else if (sel === 'Measurement Records') { setAnMenuScreen('RECORDS'); }
      else if (sel === 'Device Settings') { setAnMenuScreen('SETTINGS'); }
      else if (sel === 'Instrument Diagnosis') { setAnMenuScreen('DIAGNOSIS'); }
    } else if (anMenuScreen === 'MEASUREMENTS') {
      const sel = measurementItems[anMenuIndex];
      setSelectedMeasurement(sel);
      if (sel === 'Flue Gas Analysis') {
        setAnMenuScreen('FUEL');
        setAnMenuIndex(0);
      } else {
        // Placeholder: other measurement types not yet simulated
        setAnMenuScreen('LIVE');
      }
    } else if (anMenuScreen === 'FUEL') {
      const sel = fuelItems[anMenuIndex];
      setSelectedFuel(sel);
      setAnMenuScreen('LIVE');
    } else if (anMenuScreen === 'LIVE') {
      // OK could toggle probe insert when READY
      if (anState === 'READY' && !probeInFlue) insertProbe();
    }
  };
  const handleMenuEsc = () => {
    if (!anMenuOpen) return;
    if (anMenuScreen === 'MAIN') { setAnMenuOpen(false); return; }
    if (anMenuScreen === 'MEASUREMENTS') { setAnMenuScreen('MAIN'); setAnMenuIndex(0); return; }
    if (anMenuScreen === 'FUEL') { setAnMenuScreen('MEASUREMENTS'); setAnMenuIndex(0); return; }
    if (anMenuScreen === 'LIVE') { setAnMenuScreen('MAIN'); return; }
    if (['RECORDS','SETTINGS','DIAGNOSIS'].includes(anMenuScreen)) { setAnMenuScreen('MAIN'); return; }
  };

  // Auto-open main menu when READY for the first time (non-intrusive: keep old flow available)
  useEffect(() => {
    if (anState === 'READY' && !anMenuOpen && anMenuScreen === 'MAIN' && !probeInFlue) {
      // do not force open; user can click Menu. Leaving commented optional auto-open.
      // setAnMenuOpen(true);
    }
  }, [anState, anMenuOpen, anMenuScreen, probeInFlue]);

  // Dynamically inject tuning panel into existing user layouts (backward compatible)
  useEffect(() => {
    if (!tuningOn) return;
    setLayouts((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.keys(next).forEach((bp) => {
        const arr = Array.isArray(next[bp]) ? next[bp].slice() : [];
        const template = (defaultLayouts[bp] || []).find((it) => it.i === 'tuning');
        const has = arr.find((it) => it.i === 'tuning');
        if (!has) {
          // Insert new tuning panel using template positioned at bottom to avoid overlap, then rely on user drag if needed
          const yMax = arr.reduce((m, it) => Math.max(m, it.y + (it.h || 0)), 0);
          const newItem = template ? { ...template, y: yMax } : { i: 'tuning', x: 0, y: yMax, w: 6, h: 18 };
          arr.push(newItem);
          next[bp] = arr;
          changed = true;
        } else if (has && template) {
          // Migration: if existing tuning panel still at legacy left-column coords (x 0) or width differs from new template, gently move toward template
          const legacyLike = has.x === 0 && (has.w >= 5 || has.w === prev?.[bp]?.find?.(i=>i.i==='controls')?.w);
          const needsResize = has.w !== template.w || has.h < template.h * 0.8; // expand if notably smaller
          const needsMove = has.x !== template.x;
          if (legacyLike || needsResize || needsMove) {
            const updated = { ...has };
            // Only adopt new size/position if it will not collide; perform naive collision check and push down if needed
            updated.x = template.x;
            updated.w = template.w;
            updated.h = Math.max(has.h, template.h); // don't shrink user height
            // Determine target y: prefer template.y but adjust downward if overlapping existing items in target column
            let targetY = template.y;
            const collides = (item, x, w, y, h) => !(item.x + item.w <= x || x + w <= item.x || item.y + item.h <= y || y + h <= item.y);
            // If collision, move just below the lowest overlapping item
            while (arr.some(it => it.i !== 'tuning' && collides(it, updated.x, updated.w, targetY, updated.h))) {
              const blockers = arr.filter(it => it.i !== 'tuning' && collides(it, updated.x, updated.w, targetY, updated.h));
              const pushDown = Math.max(...blockers.map(b => b.y + b.h));
              targetY = pushDown; // stack below blockers
            }
            updated.y = targetY;
            // Replace in array
            next[bp] = arr.map(it => it.i === 'tuning' ? updated : it);
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [tuningOn, setLayouts]);

  const ea = steady.excessAir; const phi = 1 / Math.max(0.01, ea);
  const stackTempDisplay = unitSystem === "imperial" ? Math.round(simStackF) : Math.round(f2c(simStackF));
  const flameIntensity = effectiveFuel / 10;
  const pilotFuel = Math.min(fuelFlow, Math.max(0.5, minFuel * 0.5));
  const pilotIntensity = pilotFuel / 10;
const flameActive =
  (burnerState === "PTFI" || burnerState === "MTFI" || burnerState === "RUN_AUTO") &&
  (t7Main || t6Pilot) &&
  flameSignal >= 10;
const showPilotFlame = flameActive && t6Pilot;
const showMainFlame = flameActive && t7Main;
const showSpark = burnerState === "PTFI" && t5Spark;
  const canSetFiring = burnerState === "RUN_AUTO";
  const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
  const camControlsEnabled = canSetFiring || isTestEnv; // permit in tests to avoid timing flakiness
const rheostatRampRef = useRef(null);

  // Display fire rate for the gauge/indicator based on programmer state
  const displayFireRate = useMemo(() => {
    if (burnerState === "PREPURGE_HI" || burnerState === "DRIVE_HI") return 100;
    if (burnerState === "LOW_PURGE_MIN" || burnerState === "DRIVE_LOW") return 0;
    if (burnerState === "OFF" || burnerState === "POSTPURGE" || burnerState === "LOCKOUT") return 0;
    return rheostat; // RUN_AUTO, PTFI, MTFI follow current setpoint
  }, [burnerState, rheostat]);

  // Smoothly ramp rheostat to 0 when shutting down (power off, postpurge, or lockout)
  useEffect(() => {
  const shouldRampDown = (!boilerOn) || burnerState === "POSTPURGE" || burnerState === "LOCKOUT" || burnerState === "OFF";

    // Start ramp if needed and not already running
    if (shouldRampDown && rheostat > 0 && !rheostatRampRef.current) {
      rheostatRampRef.current = setInterval(() => {
        setRheostat((v) => {
          const step = 5; // percent per tick
          const next = Math.max(0, v - step);
          if (next === 0 && rheostatRampRef.current) {
            clearInterval(rheostatRampRef.current);
            rheostatRampRef.current = null;
          }
          return next;
        });
      }, 100); // 100 ms for a ~2 second full ramp (100 -> 0)
    }

    // Stop ramp if no longer appropriate
    if ((!shouldRampDown || burnerState === "RUN_AUTO") && rheostatRampRef.current) {
      clearInterval(rheostatRampRef.current);
      rheostatRampRef.current = null;
    }

    // Cleanup on unmount
    return () => {
      if (rheostatRampRef.current) {
        clearInterval(rheostatRampRef.current);
        rheostatRampRef.current = null;
      }
    };
  }, [burnerState, boilerOn, rheostat]);
  // ZERO stabilization timer effect
  useEffect(() => {
    let id = null;
    if (anState === 'ZERO') {
      const start = Date.now();
      setZeroProgress(0);
      id = setInterval(() => {
        const elapsed = Date.now() - start;
        const pct = Math.min(100, Math.round((elapsed / ZERO_DURATION_MS) * 100));
        setZeroProgress(pct);
      }, 100);
    } else {
      // reset when leaving ZERO
      setZeroProgress(0);
    }
    return () => { if (id) clearInterval(id); };
  }, [anState]);
  // Force slider position to follow programmer during purge states
  useEffect(() => {
    if (burnerState === "PREPURGE_HI" || burnerState === "DRIVE_HI") {
      setRheostat(100);
    } else if (burnerState === "LOW_PURGE_MIN" || burnerState === "DRIVE_LOW") {
      setRheostat(0);
    }
  }, [burnerState]);
  
  return (
  <div className="min-h-screen w-full bg-background text-foreground">
      <TourComponent />
  <style>{`
        @keyframes flicker { from { transform: scale(1) translateY(0px); opacity: 0.9; } to { transform: scale(1.04) translateY(-2px); opacity: 1; } }
        @keyframes spark { from { transform: translateY(2px) scale(0.9); opacity: .7; } to { transform: translateY(-2px) scale(1.1); opacity: 1; } }
        @keyframes smoke { from { transform: translateY(0) scale(0.8); opacity: .6; } to { transform: translateY(-30px) scale(1.4); opacity: 0; } }
  .card { background: var(--card); border-radius: 1rem; box-shadow: 0 6px 16px rgba(15,23,42,0.08); padding: 1rem; }
  .label { font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
        .value { font-size: 1.1rem; font-weight: 600; }
  .btn { padding: .5rem .75rem; border-radius: .75rem; border: 1px solid var(--border); background: var(--card); color: var(--foreground); }
  .btn:hover { filter: brightness(1.02); }
  .btn:active { filter: brightness(0.98); }
  .btn-primary { background: #2563eb; color: #ffffff; border-color: transparent; }
  .btn-primary:hover { background: #1d4ed8; }
  .btn-primary:active { background: rgba(29,78,216,0.9); }
        .pill { padding: .25rem .5rem; border-radius: 9999px; font-size: .7rem; }
  /* Digital programmer styling */
  .digital-panel { background: linear-gradient(180deg, #bff5bf 0%, #8fe18f 100%); border: 1px solid #065f46; border-radius: 0.75rem; padding: 0.75rem 1rem; box-shadow: 0 0 18px rgba(16,185,129,0.25), inset 0 0 8px rgba(255,255,255,0.6); }
  .digital-text { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; letter-spacing: 0.02em; color: #052e05; text-shadow: 0 0 3px rgba(16,185,129,0.5); }
  .digital-readout { font-size: 1.05rem; font-weight: 700; padding: 0.15rem 0.4rem; background: rgba(255,255,255,0.45); border-radius: 0.375rem; border: 1px dashed rgba(6,95,70,0.35); }
  /* Ensure chamber top cap follows theme (tokens defined in src/index.css) */
  .chamber-cap { background-color: var(--viz-ring-stroke); }
      `}</style>
        <RightDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>

          <div className="space-y-4">
            <button className="btn" onClick={() => setShowSettings(true)} data-tour="settings">
              Settings
            </button>
            <div className="card">
              <div className="label">Ambient Temperature (°F)</div>
              <input
                aria-label="ambient temperature"
                type="number"
                className="w-full border rounded-md px-2 py-1 mt-2 dark:bg-slate-800 dark:border-slate-600"
                value={ambientF}
                onChange={(e) => setAmbientF(parseFloat(e.target.value || 0))}
              />
            </div>
            <div className="card">
              <div className="label">Start Troubleshooting Scenarios</div>
              <select
                data-tour="scenarios"
                aria-label="troubleshooting scenarios"
                className="w-full border rounded-md px-2 py-2 mt-2"
                value={scenarioSel}
                onChange={handleScenarioChange}
              >
                <option value="">Start Troubleshooting Scenarios</option>
                {[
                  "Low air, hot stack",
                  "High draft, cold stack",
                  "Dirty nozzles (incomplete)",
                  "Biodiesel blend, medium stack",
                  "Reset",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="card">
              <div className="label">Tuning Mode</div>
              <div className="flex gap-2 mt-2" data-tour="tuning-toggle">
                <button
                  className={`btn ${!tuningOn ? "btn-primary" : ""}`}
                  onClick={() => setTuningOn(false)}
                >
                  Off
                </button>
                <button
                  className={`btn ${tuningOn ? "btn-primary" : ""}`}
                  onClick={() => setTuningOn(true)}
                >
                  On
                </button>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                When ON, adjust fuel and air together and step the cam in 10%
                intervals.
              </div>
              {/* Sliders moved to Controls > Fuel/Air Flows section to match tests */}
            </div>
            <CollapsibleSection title="Analyzer">
              <div className="card relative" data-tour="analyzer">
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                  <div className="flex items-center flex-wrap text-sm leading-snug min-w-0">
                    <span className="font-medium mr-1">State:</span>
                    <span className="mr-2 break-all">{anState}</span>
                    {probeInFlue && (
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200 text-slate-700 dark:bg-slate-600/80 dark:text-slate-50 shadow-sm mt-1 md:mt-0 max-w-full"
                        style={{lineHeight: '1.1'}}
                      >
                        <span className="truncate">Probe in flue</span>
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 items-center shrink-0">
                    <Led on={anState !== "OFF"} label="Power" />
                    <Led on={anState === "ZERO"} label="Zero" color="#06b6d4" />
                    <Led on={anState === "SAMPLING"} label="Sampling" color="#84cc16" />
                    <Led on={anState === "HOLD"} label="Hold" color="#f59e0b" />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn" onClick={startAnalyzer}>
                    Start
                  </button>
                  <button
                    className={"btn" + (anState === 'ZERO' && zeroProgress >= 100 ? ' ring-2 ring-cyan-300 animate-pulse' : '')}
                    onClick={finishZero}
                    disabled={anState !== "ZERO"}
                    data-testid="btn-finish-zero"
                  >
                    Finish Zero
                  </button>
                  <button
                    className="btn"
                    onClick={() => { if (anState !== 'OFF') { setAnMenuOpen((o) => !o); setAnMenuScreen('MAIN'); setAnMenuIndex(0); } }}
                    disabled={anState === 'OFF' || anState === 'ZERO'}
                  >
                    {anMenuOpen ? 'Close Menu' : 'Menu'}
                  </button>
                  <button
                    className="btn"
                    onClick={insertProbe}
                    disabled={anState !== "READY"}
                  >
                    Insert Probe
                  </button>
                  <button
                    className="btn"
                    onClick={() => setProbeInFlue(false)}
                  >
                    Remove Probe
                  </button>
                  <button
                    className="btn"
                    onClick={holdAnalyzer}
                    disabled={anState !== "SAMPLING"}
                  >
                    Hold
                  </button>
                  <button
                    className="btn"
                    onClick={resumeAnalyzer}
                    disabled={anState !== "HOLD"}
                  >
                    Resume
                  </button>
                  <button
                    className="btn-primary"
                    data-testid="btn-save-reading"
                    onClick={saveReading}
                    disabled={anState === "OFF"}
                  >
                    Save Reading
                  </button>
                </div>
                {(() => {
                  const help = {
                    OFF: 'Analyzer is powered down. Click Start to begin zeroing (ambient baseline).',
                    ZERO: 'ZERO: Establishing baseline in ambient air – wait, then click Finish Zero when stable.',
                    READY: 'READY: Baseline captured, electronics stable. Safe to Insert Probe into the flue.',
                    SAMPLING: 'SAMPLING: Probe in flue; readings updating in real time. Wait for stability before saving.',
                    HOLD: 'HOLD: Sampling paused – gas path isolated. Resume to continue updating readings.'
                  };
                  const msg = help[anState] || '';
                  return (
                    <>
                      {/* ZERO progress bar (visible only during ZERO) */}
                      {anState === 'ZERO' && (
                        <div className="mt-2">
                          <div
                            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"
                            aria-hidden={false}
                          >
                            <div
                              role="progressbar"
                              aria-label="Analyzer zero stabilization progress"
                              aria-valuemin="0"
                              aria-valuemax="100"
                              aria-valuenow={zeroProgress}
                              style={{ width: `${zeroProgress}%` }}
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-width duration-100 ease-linear"
                              data-testid="analyzer-zero-fill"
                            />
                          </div>
                          <div className="text-[10px] mt-1 text-slate-500" data-testid="analyzer-zero-percent">
                            Stabilizing baseline… {zeroProgress}%
                          </div>
                        </div>
                      )}

                      <div
                        className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed"
                        data-testid="analyzer-state-help"
                        aria-live="polite"
                        role="status"
                      >
                        {msg}
                      </div>

                      {/* Analyzer advanced menu overlay */}
                      {anMenuOpen && (
                        <div className="absolute inset-0 rounded-lg bg-white/95 dark:bg-slate-800/95 border border-slate-300 dark:border-slate-600 p-3 overflow-hidden flex flex-col" data-testid="analyzer-menu">
                          <div className="text-[10px] uppercase tracking-wide font-semibold text-slate-500 mb-1">Analyzer Menu</div>
                          {anMenuScreen === 'MAIN' && (
                            <div className="flex-1 overflow-auto">
                              {mainMenuItems.map((item, i) => (
                                <div key={item} className={`px-2 py-1 rounded cursor-pointer text-sm ${i === anMenuIndex ? 'bg-cyan-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{item}</div>
                              ))}
                              <div className="mt-3 text-[10px] text-slate-500">Use ▲▼ then OK. ESC to exit.</div>
                            </div>
                          )}
                          {anMenuScreen === 'MEASUREMENTS' && (
                            <div className="flex-1 overflow-auto">
                              <div className="text-xs mb-1 font-medium">Select Measurement</div>
                              {measurementItems.map((item, i) => (
                                <div key={item} className={`px-2 py-1 rounded cursor-pointer text-sm ${i === anMenuIndex ? 'bg-cyan-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{item}</div>
                              ))}
                              <div className="mt-3 text-[10px] text-slate-500">OK to choose. ESC to Main Menu.</div>
                            </div>
                          )}
                          {anMenuScreen === 'FUEL' && (
                            <div className="flex-1 overflow-auto">
                              <div className="text-xs mb-1 font-medium">Select Fuel</div>
                              {fuelItems.map((item, i) => (
                                <div key={item} className={`px-2 py-1 rounded cursor-pointer text-sm ${i === anMenuIndex ? 'bg-cyan-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700'}`}>{item}</div>
                              ))}
                              <div className="mt-3 text-[10px] text-slate-500">OK to begin. ESC to Measurements.</div>
                            </div>
                          )}
                          {anMenuScreen === 'LIVE' && (
                            <div className="flex-1 overflow-auto">
                              <div className="text-xs font-medium mb-1">Live Readings {selectedFuel && <>({selectedFuel})</>} {selectedMeasurement && <span className="ml-1 text-slate-400">[{selectedMeasurement}]</span>}</div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] leading-tight">
                                <div>O₂</div><div className="font-semibold">{dispRef.current?.O2?.toFixed?.(2) ?? '--'} %</div>
                                <div>CO</div><div className="font-semibold">{dispRef.current?.CO ? Math.round(dispRef.current.CO) : '--'} ppm</div>
                                <div>CO₂</div><div className="font-semibold">{dispRef.current?.CO2?.toFixed?.(2) ?? '--'} %</div>
                                <div>NOx</div><div className="font-semibold">{dispRef.current?.NOx ? Math.round(dispRef.current.NOx) : '--'} ppm</div>
                                <div>Stack T</div><div className="font-semibold">{dispRef.current?.StackF ? Math.round(dispRef.current.StackF) : '--'} °F</div>
                                <div>Eff</div><div className="font-semibold">{dispRef.current?.Eff?.toFixed?.(1) ?? '--'} %</div>
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button className="btn" onClick={() => { if (anState === 'READY') insertProbe(); }} disabled={anState !== 'READY' || probeInFlue}>Insert Probe</button>
                                <button className="btn" onClick={() => setProbeInFlue(false)} disabled={!probeInFlue}>Remove Probe</button>
                                <button className="btn" onClick={() => { setProbeInFlue(false); setAnState('READY'); setAnMenuScreen('MAIN'); }}>Stop</button>
                                <button className="btn" onClick={holdAnalyzer} disabled={anState !== 'SAMPLING'}>Hold</button>
                                <button className="btn" onClick={resumeAnalyzer} disabled={anState !== 'HOLD'}>Resume</button>
                                <button className="btn-primary" onClick={saveReading} disabled={anState === 'OFF'}>Save</button>
                              </div>
                            </div>
                          )}
                          {anMenuScreen === 'RECORDS' && (
                            <div className="flex-1 overflow-auto text-[11px]">
                              <div className="text-xs font-medium mb-1">Saved Measurements</div>
                              {saved.length === 0 && <div className="text-slate-500">No records.</div>}
                              {saved.slice(0,50).map(r => (
                                <div key={r.id} className="border-b border-slate-200 dark:border-slate-700 py-1 flex justify-between">
                                  <div>{new Date(r.t).toLocaleTimeString()}</div>
                                  <div className="font-semibold">O₂ {r.O2 ?? '--'}%</div>
                                </div>
                              ))}
                              <div className="mt-2"><button className="btn" onClick={exportSavedReadings} disabled={!saved.length}>Export CSV</button></div>
                            </div>
                          )}
                          {anMenuScreen === 'SETTINGS' && (
                            <div className="flex-1 text-[11px]">
                              <div className="text-xs font-medium mb-1">Device Settings (Preview)</div>
                              <p className="text-slate-500">Full settings UI coming soon.</p>
                            </div>
                          )}
                          {anMenuScreen === 'DIAGNOSIS' && (
                            <div className="flex-1 text-[11px]">
                              <div className="text-xs font-medium mb-1">Instrument Diagnosis (Preview)</div>
                              <p className="text-slate-500">Sensor health & drift simulation is planned.</p>
                            </div>
                          )}
                          <div className="mt-2 flex gap-2 justify-end text-[11px]">
                            <button className="btn" onClick={() => handleMenuNav('up')} aria-label="Up">▲</button>
                            <button className="btn" onClick={() => handleMenuNav('down')} aria-label="Down">▼</button>
                            <button className="btn" onClick={handleMenuOk} aria-label="OK">OK</button>
                            <button className="btn" onClick={handleMenuEsc} aria-label="Esc">ESC</button>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </CollapsibleSection>
          </div>
        </RightDrawer>

        <SettingsMenu
          open={showSettings}
          config={config}
          onApply={handleApply}
          onCancel={handleCancel}
          onPreview={handlePreview}
          history={history}
          saved={saved}
          onExportSaved={exportSavedReadings}
          onResetLayouts={handleResetLayouts}
        />


  <header className="px-6 py-4 border-b bg-card border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Combustion Trainer</h1>
          <div className="ml-auto flex items-center gap-3">
            <button className="btn" data-tour="technician" onClick={() => setDrawerOpen(true)}>Technician</button>

            <button
              className="btn"
              aria-label="Settings"
              onClick={() => {
                configBeforeSettings.current = JSON.parse(JSON.stringify(config));
                setShowSettings(true);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-5 h-5"
              >
                <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

  {/* Intro card removed (splash + tour covers onboarding) */}

      <main className="max-w-7xl mx-auto p-6">
        <ResponsiveGridLayout
          data-testid="grid-main"
          className="layout"
          breakpoints={rglBreakpoints}
          cols={rglCols}
          layouts={layouts}
          onBreakpointChange={(bp) => setBreakpoint(bp)}
          onLayoutChange={handleLayoutChange}
          onDragStart={() => setAutoSizeLock(true)}
          onDragStop={() => setAutoSizeLock(false)}
          onResizeStart={() => setAutoSizeLock(true)}
          onResizeStop={() => setAutoSizeLock(false)}
          rowHeight={10}
          margin={[16, 16]}
          draggableHandle=".drag-handle"
          compactType="vertical"
        >
          <GridAutoSizer key="viz" id="viz" className="card overflow-hidden" onRows={(r) => setItemRows("viz", r)} rowHeight={10} data-testid="panel-viz">
            <PanelHeader title="Boiler Visualization" />
            <div className="flex items-center justify-between">
              <div>
                <div className="label">Stack Temperature</div>
                <div className="value">{stackTempDisplay} {unitSystem === "imperial" ? "°F" : "°C"}</div>
                <div className="text-xs text-slate-500">State: {burnerState}</div>
              </div>
              <div className="text-sm text-slate-600">Flame Test {steady.flameTempF} °F</div>
            </div>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <div
                  ref={chamberRef}
                  aria-label="combustion chamber"
                  className="relative h-72 rounded-3xl border border-slate-300 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden dark:from-slate-800 dark:to-slate-700 dark:border-slate-700"
                >
                  <div className="absolute inset-6 rounded-full border-2 border-slate-300 dark:border-slate-600" />
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-8 chamber-cap rounded-t-2xl dark:bg-slate-600" />
                  <div className="absolute inset-0">
                    {(showMainFlame || showPilotFlame) && (
                      <div data-flame-root className="absolute inset-0">
                        {showMainFlame && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Flame phi={phi} intensity={flameIntensity} />
                          </div>
                        )}
                        {showPilotFlame && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Flame phi={1} intensity={pilotIntensity} pilot />
                          </div>
                        )}
                      </div>
                    )}
                    {flameActive && steady.warnings.soot ? <Smoke /> : null}
                    {showSpark ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Spark />
                      </div>
                    ) : null}
                  </div>
                  {/* Adjust scale or offsetRatio to tweak placement relative to the flame */}
                  <AirDrawerIndicator
                    key={isDarkMode ? 'dark' : 'light'}
                    theme={isDarkMode ? 'dark' : 'light'}
                    value={displayFireRate}
                    chamberRef={chamberRef}
                    angleLow={config.gauge.gaugeAngleLow ?? 180}
                    angleHigh={config.gauge.gaugeAngleHigh ?? 300}
                    arcAngleLow={config.gauge.arcAngleLow ?? 220}
                    arcAngleHigh={config.gauge.arcAngleHigh ?? 330}
                    scale={config.gauge.gaugeScale ?? 1.18}
                    speed={ config.gauge.gaugeSpeed ?? 1}
                    flipDirection={config.gauge.gaugeFlipDirection ?? false}
                    dotSize={config.gauge.gaugeDotSize ?? 0.06}
                    needleInner={config.gauge.needleInner ?? 0}
                    arcOffset={config.gauge.arcOffset ?? 0}
                  />
                  <div className="absolute bottom-3 right-3 space-y-1 text-xs">
                    {steady.warnings.soot && (<div className="px-2 py-1 rounded bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border dark:border-yellow-700/40">Soot risk</div>)}
                    {steady.warnings.overTemp && (<div className="px-2 py-1 rounded bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-200 dark:border dark:border-red-700/40">Over-temp</div>)}
                    {steady.warnings.underTemp && (<div className="px-2 py-1 rounded bg-blue-100 text-blue-900 dark:bg-blue-500/20 dark:text-blue-200 dark:border dark:border-blue-700/40">Condensate risk</div>)}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {!tuningActive && (
                  <>
                    <div className="label">Air Flow (cfm, scaled)</div>
                    <div className="value">{Number(airFlow).toFixed(2)}</div>
                  </>
                )}
              </div>
            </div>
            {/* Programmer moved directly below visualization */}
            <div className="mt-6 digital-panel" data-tour="programmer">
              <div className="flex items-center justify-between digital-text">
                <div>
                  <div className="label" style={{ color: "#064e3b" }}>Programmer (EP160)</div>
                  <div className="text-sm">
                    State: <span className="digital-readout">{burnerState}</span>
                    {stateCountdown !== null && (
                      <span className="pill ml-2" style={{ background: "rgba(255,255,255,0.6)", color: "#065f46", border: "1px solid rgba(6,95,70,0.35)" }}>{stateCountdown}s left</span>
                    )}
                    {burnerState === "LOCKOUT" && (
                      <span className="pill ml-2" style={{ background: "#fee2e2", color: "#991b1b", border: "1px solid rgba(185,28,28,0.25)" }}>Lockout: {lockoutReason}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Led on={t5Spark} label="T5 Spark" color="#f59e0b" />
                  <Led on={t6Pilot} label="T6 Pilot" color="#fb923c" />
                  <Led on={t7Main} label="T7 Main" color="#3b82f6" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4 digital-text">
                <div className="text-sm">Flame Signal: <span className="digital-readout">{Math.round(flameSignal)}</span> <span className="opacity-75">(10 min, 20–80 normal)</span></div>
                <button className="btn" onClick={advanceStep}>Advance</button>
                {burnerState === "LOCKOUT" && (<button className="btn btn-primary" onClick={resetProgrammer}>Reset</button>)}
              </div>
              <div className="mt-2 text-xs digital-text" style={{ opacity: 0.8 }}>Prepurge {EP160.PURGE_HF_SEC}s → Low fire {EP160.LOW_FIRE_MIN_SEC}s → PTFI {EP160.PTFI_SEC}s → MTFI (spark off {EP160.MTFI_SPARK_OFF_SEC}s, pilot off {EP160.MTFI_PILOT_OFF_SEC}s) → Run → Post purge {EP160.POST_PURGE_SEC}s.</div>
            </div>
          </GridAutoSizer>
          <GridAutoSizer key="controls" id="controls" data-testid="panel-controls" className="card overflow-hidden" onRows={(r) => setItemRows("controls", r)} rowHeight={10}>
            <PanelHeader title="Boiler Control Panel" />
            <CollapsibleSection title="Fuel Selector">
              <select
                data-tour="fuel"
                aria-label="fuel selector"
                className="w-full rounded-md px-2 py-2 mt-1 bg-card text-foreground border border-border dark:bg-slate-800 dark:border-slate-600 transition-colors"
                value={fuelKey}
                onChange={(e) => setFuelKey(e.target.value)}
              >
                {Object.keys(FUELS).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">HHV: {FUELS[fuelKey].HHV.toLocaleString()} Btu/{FUELS[fuelKey].unit}</div>
              <div className="mt-1 text-xs text-slate-500">Targets: O₂ {fuel.targets.O2[0]} to {fuel.targets.O2[1]} percent, COair-free ≤ {fuel.targets.COafMax} ppm</div>
            </CollapsibleSection>
            <div className="label mt-4">Boiler Power</div>
            <div className="flex items-center gap-2 mt-2" data-tour="power">
              <button className={`btn ${boilerOn ? 'btn-primary' : ''}`} onClick={() => setBoilerOn(true)}>On</button>
              <button className="btn" onClick={() => setBoilerOn(false)}>Off</button>
            </div>
            <div className="label mt-4">Firing Rate (rheostat)</div>
            <input
              data-tour="firing-rate"
              aria-label="firing rate"
              type="range"
              min={0}
              max={100}
              step={1}
              value={rheostat}
              onChange={(e) => { if (!canSetFiring) return; setRheostat(parseInt(e.target.value)); }}
              className="w-full"
              disabled={!canSetFiring}
            />
            <div className="value">{rheostat}%</div>
            <CollapsibleSection title="Fuel/Air Flows">
              <div className="mt-2">
                {tuningOn ? (
                  <div className="grid grid-cols-1 gap-4 mb-4" data-testid="tuning-sliders">
                    <div data-flow-row>
                      <div className="label">Fuel Flow ({FUELS[fuelKey].unit}, scaled)</div>
                      <input
                        aria-label="tuning fuel flow"
                        type="range"
                        min={minFuel}
                        max={maxFuel}
                        step={0.1}
                        value={fuelFlow}
                        onChange={(e) => setFuelFlow(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="value">
                        {fuelFlow.toFixed(2)}
                        {fuelFlow <= minFuel + 1e-6 && <span className="text-yellow-500 ml-2">MIN</span>}
                        {fuelFlow >= maxFuel - 1e-6 && <span className="text-yellow-500 ml-2">MAX</span>}
                      </div>
                    </div>
                    <div data-flow-row>
                      <div className="label">Air Flow (cfm, scaled)</div>
                      <input
                        aria-label="tuning air flow"
                        type="range"
                        min={0}
                        max={200}
                        step={1}
                        value={airFlow}
                        onChange={(e) => setAirFlow(parseFloat(e.target.value))}
                        className="w-full"
                      />
                      <div className="value">
                        {Number(airFlow).toFixed(2)}
                        {airFlow <= 0 && <span className="text-yellow-500 ml-2">MIN</span>}
                        {airFlow >= 200 && <span className="text-yellow-500 ml-2">MAX</span>}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mb-4" data-testid="tuning-static-values">
                    <div data-flow-row>
                      <div className="label">Fuel Flow ({FUELS[fuelKey].unit}, scaled)</div>
                      <div className="value">{fuelFlow.toFixed(2)}</div>
                    </div>
                    <div data-flow-row>
                      <div className="label">Air Flow (cfm, scaled)</div>
                      <div className="value">{Number(airFlow).toFixed(2)}</div>
                    </div>
                  </div>
                )}
                {!tuningActive && (
                  <div className="mt-3 text-xs text-slate-500">
                    Enable Tuning Mode to access CAM curve tools (moved to dedicated Tuning Controls panel).
                  </div>
                )}
              </div>
            </CollapsibleSection>
            {/* Programmer moved to visualization section */}
          </GridAutoSizer>
          <GridAutoSizer key="readouts" id="readouts" data-testid="panel-readouts" className="card" onRows={(r) => setItemRows("readouts", r)} rowHeight={10}>
            <PanelHeader title="Readouts" />
            <div className="grid grid-cols-2 gap-3" role="group" aria-label="readouts">
              <div><div className="label">O₂ (dry)</div><div className="value">{dispLocal.O2.toFixed(2)}%</div></div>
              <div><div className="label">CO₂ (dry)</div><div className="value">{dispLocal.CO2.toFixed(2)}%</div></div>
              <div><div className="label">CO</div><div className="value">{Math.round(dispLocal.CO)} ppm</div></div>
              <div><div className="label">CO air-free</div><div className="value">{Math.round(dispLocal.COaf)} ppm</div></div>
              <div><div className="label">NOₓ</div><div className="value">{Math.round(dispLocal.NOx)} ppm</div></div>
              <div><div className="label">Excess Air</div><div className="value">{((steady.excessAir - 1) * 100).toFixed(1)}%</div></div>
              <div><div className="label">Efficiency</div><div className="value">{Number(dispLocal.Eff).toFixed(1)}%</div></div>
              <div><div className="label">Stack</div><div className="value">{Math.round(dispLocal.StackF)} °F</div></div>
              <div className="col-span-2 text-xs text-slate-500 mt-1">
                Targets for {fuelKey}: O₂ {fuel.targets.O2[0]} to {fuel.targets.O2[1]} percent; CO AF ≤ {fuel.targets.COafMax} ppm; stack {fuel.targets.stackF[0]} to {fuel.targets.stackF[1]} °F.
              </div>
              <div className="col-span-2 mt-2">
                <button
                  className="btn"
                  data-testid="btn-save-reading"
                  onClick={() =>
                    saveReading({
                      fuel: fuelKey,
                      setFire: rheostat,
                      airFlow: Number(Number(airFlow).toFixed(2)),
                      fuelFlow: Number(Number(fuelFlow).toFixed(2)),
                      stackF: Math.round(dispLocal.StackF),
                      O2: Number(dispLocal.O2.toFixed(2)),
                      CO2: Number(dispLocal.CO2.toFixed(2)),
                      COppm: Math.round(dispLocal.CO),
                      NOxppm: Math.round(dispLocal.NOx),
                      excessAir: Number(((steady.excessAir - 1) * 100).toFixed(1)),
                      efficiency: Number(Number(dispLocal.Eff).toFixed(1)),
                    })
                  }
                >
                  Save Reading
                </button>
              </div>
            </div>
          </GridAutoSizer>
          <GridAutoSizer key="trend" id="trend" className="card overflow-hidden flex flex-col" onRows={(r) => setItemRows("trend", r)} rowHeight={10}>
            <PanelHeader title="Trend" />
            <div className="flex-1 min-h-0" data-tour="trends">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "rgba(148,163,184,0.25)" : themeVars.border} />
                  <XAxis dataKey="ts" type="number" domain={["dataMin", "dataMax"]} hide stroke={themeVars.muted} tick={{ fill: themeVars.muted }} />
                  <YAxis yAxisId="left" domain={[0, 100]} stroke={themeVars.muted} tick={{ fill: themeVars.muted }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 600]} stroke={themeVars.muted} tick={{ fill: themeVars.muted }} />
                  <Tooltip contentStyle={{ background: themeVars.card, border: `1px solid ${themeVars.border}`, color: themeVars.foreground }} labelStyle={{ color: themeVars.foreground }} />
                  <Legend wrapperStyle={{ color: themeVars.foreground }} />
                  {seriesConfig.map((series) =>
                    seriesVisibility[series.key] && (
                      <Line
                        key={series.key}
                        yAxisId={series.yAxisId}
                        type="monotone"
                        dataKey={series.key}
                        dot={false}
                        name={series.name}
                        strokeWidth={2}
                        isAnimationActive={false}
                      />
                    )
                  )}
                </LineChart>
              </ResponsiveContainer>

            </div>
          </GridAutoSizer>
          <GridAutoSizer key="meter" id="meter" data-testid="panel-meter" className="card overflow-hidden" onRows={(r) => setItemRows("meter", r)} rowHeight={10}>
            <PanelHeader title="Clock the Boiler (Metering)" />
            <div className="flex gap-2 mt-2">
              <button
                className={`btn ${meterTab === "Gas" ? "btn-primary" : ""}`}
                onClick={() => setMeterTab("Gas")}
              >
                Gas Meter
              </button>
              <button
                className={`btn ${meterTab === "Oil" ? "btn-primary" : ""}`}
                onClick={() => setMeterTab("Oil")}
              >
                Oil Meter
              </button>
            </div>
            {meterTab === "Gas" ? (
              <div className="mt-3 space-y-2">
                <label className="text-sm">
                  Dial size (ft³)
                  <input
                    data-testid="meter-input"
                    type="number"
                    list="dialSizes"
                    className="w-full border rounded-md px-2 py-1 mt-1"
                    value={gasDialSize}
                    onChange={(e) =>
                      setGasDialSize(parseFloat(e.target.value || 0))
                    }
                  />
                  <datalist id="dialSizes">
                    <option value="0.25" />
                    <option value="0.5" />
                    <option value="1" />
                    <option value="2" />
                  </datalist>
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={startGasClock}
                    disabled={gasRunning || !isGas}
                  >
                    Start
                  </button>
                  <button
                    className="btn"
                    onClick={lapGasClock}
                    disabled
                    title="Meter laps are generated automatically from current burner flow"
                  >
                    Lap
                  </button>
                  <button
                    className="btn"
                    onClick={stopGasClock}
                    disabled={!gasRunning}
                  >
                    Stop
                  </button>
                  <button className="btn" onClick={resetGasClock}>
                    Reset
                  </button>
                  <button
                    className="btn"
                    onClick={exportGasClock}
                    disabled={!gasLaps.length}
                  >
                    Export
                  </button>
                </div>
                {!isGas && (
                  <div className="text-xs text-slate-500 mt-1">
                    Gas meter is only active for Natural Gas/Propane. Select a
                    gas fuel to clock.
                  </div>
                )}
                <div className="text-sm">
                  Sim sec/rev (from burner):{" "}
                  <span className="font-semibold">
                    {gasMeterRevSec > 0 ? gasMeterRevSec.toFixed(1) : "—"}
                  </span>
                </div>
                <div className="text-sm">
                  Meter CFH (clocked avg):{" "}
                  <span className="font-semibold" data-testid="meter-output">{gasCFH.toFixed(1)}</span>
                </div>
                <div className="text-sm">
                  Burner CFH (model):{" "}
                  <span className="font-semibold">
                    {gasBurnerCFH.toFixed(1)}
                  </span>
                </div>
                <div className="text-sm">
                  Cam/Reg CFH (mapped):{" "}
                  <span className="font-semibold">
                    {gasCamCFH.toFixed(1)}
                  </span>
                </div>
                <div className="text-sm">
                  Input MBH (model):{" "}
                  <span className="font-semibold">
                    {gasMBH_model.toFixed(1)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <div className="text-sm">
                  Burner GPH (model):{" "}
                  <span className="font-semibold">
                    {oilBurnerGPH.toFixed(2)}
                  </span>
                </div>
                <div className="text-sm">
                  Cam/Reg GPH (mapped):{" "}
                  <span className="font-semibold">{oilCamGPH.toFixed(2)}</span>
                </div>
                <div className="text-sm">
                  Sec/gal at current flow:{" "}
                  <span className="font-semibold">
                    {oilBurnerGPH > 0 ? oilSecPerGal.toFixed(0) : "—"}
                  </span>
                </div>
                <div className="text-sm">
                  Volume in 60s:{" "}
                  <span className="font-semibold">
                    {(oilBurnerGPH / 60).toFixed(2)}
                  </span>{" "}
                  gal
                </div>
                <div className="text-xs text-slate-500">
                  Field estimate from nozzle/pressure (optional):
                </div>
                <label className="text-sm">
                  Nozzle GPH @100 psi
                  <input
                    type="number"
                    className="w-full border rounded-md px-2 py-1 mt-1"
                    value={nozzleGPH100}
                    onChange={(e) =>
                      setNozzleGPH100(parseFloat(e.target.value || 0))
                    }
                  />
                </label>
                <label className="text-sm">
                  Pump pressure (psi)
                  <input
                    data-tour="regulator"
                    type="number"
                    className="w-full border rounded-md px-2 py-1 mt-1"
                    value={oilPressure}
                    onChange={(e) =>
                      setOilPressure(parseFloat(e.target.value || 0))
                    }
                  />
                </label>
                <div className="text-sm">
                  Actual GPH:{" "}
                  <span className="font-semibold">{oilGPH.toFixed(2)}</span>
                </div>
                <div className="text-sm">
                  Input MBH:{" "}
                  <span className="font-semibold">{oilMBH.toFixed(1)}</span>
                </div>
                <button className="btn mt-2" onClick={exportOilClock}>
                  Export
                </button>
              </div>
            )}
          </GridAutoSizer>
          {tuningOn && (
            <GridAutoSizer key="tuning" id="tuning" data-testid="panel-tuning" className="card" onRows={(r) => setItemRows("tuning", r)} rowHeight={10}>
              <PanelHeader title="Tuning Controls" />
              <div className="mt-1 text-xs text-slate-500">
                Adjust cam curve points and navigate standardized firing intervals.
              </div>
              <div className="mt-3">
                <div className="label">Camshaft Intervals</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {[0,10,20,30,40,50,60,70,80,90,100].map((p) => (
                    <button
                      key={p}
                      data-tour={`cam-${p}`}
                      className={`btn ${rheostat === p ? 'btn-primary' : ''}`}
                      disabled={!camControlsEnabled}
                      onClick={() => {
                        if (!canSetFiring) return;
                        setRheostat(p);
                        applyCamIfSaved(p);
                      }}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    className="btn btn-primary"
                    disabled={!camControlsEnabled}
                    onClick={setCamAtCurrent}
                    title="Save current fuel and air at this cam position"
                  >
                    Set {currentCam}%
                  </button>
                  <button
                    className="btn"
                    disabled={!camControlsEnabled || !camMap[currentCam]}
                    onClick={clearCamAtCurrent}
                    title="Clear saved point at this cam position"
                  >
                    Clear {currentCam}%
                  </button>
                  <button
                    className="btn"
                    disabled={!camControlsEnabled}
                    onClick={applySafeDefaults}
                    title="Apply safe default curve"
                  >
                    Safe Defaults
                  </button>
                  {camMap[currentCam] && (
                    <span data-testid="cam-saved-pill" className="pill bg-green-100">Saved: F {camMap[currentCam].fuel} / A {camMap[currentCam].air}</span>
                  )}
                  {defaultsLoaded && (
                    <span className="pill bg-blue-100">Safe defaults loaded</span>
                  )}
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  Saved cam points: {Object.keys(camMap).length ? Object.keys(camMap).sort((a,b)=>a-b).join(', ') : 'none'}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    className="btn"
                    disabled={!canSetFiring}
                    onClick={() => {
                      if (!canSetFiring) return;
                      setRheostat((v) => {
                        const next = clamp(Math.round(v / 10) * 10 - 10, 0, 100);
                        applyCamIfSaved(next);
                        return next;
                      });
                    }}
                  >
                    -10%
                  </button>
                  <div className="value">{rheostat}%</div>
                  <button
                    className="btn"
                    disabled={!canSetFiring}
                    onClick={() => {
                      if (!canSetFiring) return;
                      setRheostat((v) => {
                        const next = clamp(Math.round(v / 10) * 10 + 10, 0, 100);
                        applyCamIfSaved(next);
                        return next;
                      });
                    }}
                  >
                    +10%
                  </button>
                </div>
              </div>
            </GridAutoSizer>
          )}
          {mainItems.map((id) => {
            const Panel = panels[id].Component;
            return (
              <GridAutoSizer
                key={id}
                id={id}
                className="card overflow-hidden"
                onRows={(r) => setItemRows(id, r)}
                rowHeight={10}
                data-grid={{ w: 3, h: 10 }}
              >
                <PanelHeader
                  title={panels[id].title}
                  dockAction={
                    <button className="btn" onClick={() => dock(id, "techDrawer")}>
                      Move to Tech
                    </button>
                  }
                />
                <Panel
                  visibility={seriesVisibility}
                  setVisibility={setSeriesVisibility}
                  saved={saved}
                  exportSavedReadings={exportSavedReadings}
                />
              </GridAutoSizer>
            );
          })}

        </ResponsiveGridLayout>
      </main>

      <footer className="max-w-7xl mx-auto p-6 text-xs text-slate-500">Educational model. For classroom intuition only.</footer>
    </div>
  );
}
