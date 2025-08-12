/**
 * Main simulator UI for the Combustion Trainer.
 *
 * This single file contains React components and state management for
 * the entire educational boiler simulator. It depends on several helper
 * modules located in `src/lib` for math, chemistry calculations, cam
 * map generation and CSV export. Recharts is used for trend plotting.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { computeCombustion } from "./lib/chemistry";
import { buildSafeCamMap } from "./lib/cam";
import CollapsibleSection from "./components/CollapsibleSection";
import RightDrawer from "./components/RightDrawer";
import { useUIState } from "./components/UIStateContext";
import { loadConfig, saveConfig, getDefaultConfig } from "./lib/config";
import SettingsMenu from "./components/SettingsMenu";
import { panels, defaultZoneById, defaultLayouts as techDefaults } from "./panels";
const ResponsiveGridLayout = WidthProvider(Responsive);

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

const RGL_LS_KEY = "ct_layouts_v2";
const ZONES_KEY = "ct_zones_v1";
const SAVED_KEY = "ct_saved_v1";

const rglBreakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const rglCols        = { lg:   12,  md:  10,  sm:   8,  xs:   6,  xxs:  4 };

const defaultLayouts = {
  lg: [
    { i: "viz",      x: 0, y: 0,  w: 7,  h: 26, minW: 4, minH: 12 },
    { i: "controls", x: 0, y: 26, w: 7,  h: 20, minW: 4, minH: 10 },
    { i: "readouts", x: 7, y: 0,  w: 5,  h: 12, minW: 3, minH:  6 },
    { i: "trend",    x: 7, y: 12, w: 5,  h: 16, minW: 3, minH: 10 },
    { i: "meter",    x: 7, y: 28, w: 5,  h: 12, minW: 3, minH:  8 },
  ],
  md: [
    { i: "viz",      x: 0, y: 0,  w: 6,  h: 26 },
    { i: "controls", x: 0, y: 26, w: 6,  h: 20 },
    { i: "readouts", x: 6, y: 0,  w: 4,  h: 12 },
    { i: "trend",    x: 6, y: 12, w: 4,  h: 16 },
    { i: "meter",    x: 6, y: 28, w: 4,  h: 12 },
  ],
  sm: [
    { i: "viz",      x: 0, y: 0,  w: 5,  h: 26 },
    { i: "controls", x: 0, y: 26, w: 5,  h: 20 },
    { i: "readouts", x: 5, y: 0,  w: 3,  h: 12 },
    { i: "trend",    x: 5, y: 12, w: 3,  h: 16 },
    { i: "meter",    x: 5, y: 28, w: 3,  h: 12 },
  ],
  xs: [
    { i: "viz",      x: 0, y: 0,  w: 6, h: 24 },
    { i: "controls", x: 0, y: 24, w: 6, h: 18 },
    { i: "readouts", x: 0, y: 42, w: 6, h: 10 },
    { i: "trend",    x: 0, y: 52, w: 6, h: 16 },
    { i: "meter",    x: 0, y: 68, w: 6, h: 10 },
  ],
  xxs: [
    { i: "viz",      x: 0, y: 0,  w: 4, h: 24 },
    { i: "controls", x: 0, y: 24, w: 4, h: 18 },
    { i: "readouts", x: 0, y: 42, w: 4, h: 10 },
    { i: "trend",    x: 0, y: 52, w: 4, h: 16 },
    { i: "meter",    x: 0, y: 68, w: 4, h: 10 },
  ],
};

function fitToCols(items, cols) {
  return items.map((it) => {
    const w = Math.min(it.w ?? 1, cols);
    const x = Math.min(it.x ?? 0, Math.max(0, cols - w));
    return { ...it, w, x };
  });
}
function normalizeLayouts(layouts) {
  const out = {};
  Object.entries(rglCols).forEach(([bp, cols]) => {
    const arr = layouts?.[bp] ?? [];
    out[bp] = fitToCols(arr, cols);
  });
  return out;
}
function loadLayouts() {
  try {
    const raw = localStorage.getItem(RGL_LS_KEY);
    const parsed = raw ? JSON.parse(raw) : defaultLayouts;
    return normalizeLayouts(parsed);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to load layouts from localStorage:", e);
    }
    return normalizeLayouts(defaultLayouts);
  }
}

function saveLayouts(layouts) {
  try {
    localStorage.setItem(RGL_LS_KEY, JSON.stringify(layouts));
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to save layouts to localStorage:", e);
    }
  }
}

function loadZones() {
  try {
    return JSON.parse(localStorage.getItem(ZONES_KEY)) || defaultZoneById;
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to load zones from localStorage:", e);
    }
    return defaultZoneById;
  }
}
function saveZones(z) {
  try {
    localStorage.setItem(ZONES_KEY, JSON.stringify(z));
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to save zones to localStorage:", e);
    }
  }
}

const TECH_LS_KEY = "ct_tech_layouts_v1";
function loadTechLayouts() {
  try {
    const raw = localStorage.getItem(TECH_LS_KEY);
    const parsed = raw ? JSON.parse(raw) : techDefaults.techDrawer;
    return normalizeLayouts(parsed);
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to load tech layouts from localStorage:", e);
    }
    return normalizeLayouts(techDefaults.techDrawer);
  }
}
function saveTechLayouts(ls) {
  try {
    localStorage.setItem(TECH_LS_KEY, JSON.stringify(ls));
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to save tech layouts to localStorage:", e);
    }
  }
}

function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to load saved readings:", e);
    }
    return [];
  }
}
function persistSaved(next) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch (e) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Failed to persist saved readings:", e);
    }
  }
}

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

export default function CombustionTrainer() {
  const { drawerOpen, setDrawerOpen, seriesVisibility, setSeriesVisibility } = useUIState();
  const [config, setConfig] = useState(loadConfig() || getDefaultConfig());
  const unitSystem = config.units.system;
  const [showSettings, setShowSettings] = useState(false);
  const [layouts, setLayouts] = useState(loadLayouts());

  const [theme, setTheme] = useState(() => localStorage.getItem("ct_theme") || "system");

  useLayoutEffect(() => {
    applyTheme(theme);
  }, []);

  useEffect(() => {
    localStorage.setItem("ct_theme", theme);
    applyTheme(theme);
  }, [theme]);


  const handleLayoutChange = (_current, allLayouts) => {
    setLayouts(allLayouts);
    saveLayouts(allLayouts);
  };

  const handleResetLayouts = () => {
    localStorage.removeItem(RGL_LS_KEY);
    setLayouts(normalizeLayouts(defaultLayouts));
  };
  const dock = useCallback((id, zone) => {
    setZones((prev) => {
      const next = { ...prev, [id]: zone };
      saveZones(next);
      return next;
    });
  }, []);
  const onTechChange = (_cur, all) => {
    setTechLayouts(all);
    saveTechLayouts(all);
  };
  const mainItems = useMemo(
    () => Object.keys(panels).filter((id) => zones[id] === "main"),
    [zones],
  );
  const techItems = useMemo(
    () => Object.keys(panels).filter((id) => zones[id] === "techDrawer"),
    [zones],
  );
  useEffect(() => {
    const v2 = localStorage.getItem(RGL_LS_KEY);
    const v1 = localStorage.getItem("ct_layouts_v1");
    if (!v2 && v1) {
      try {
        const parsed = JSON.parse(v1);
        const normalized = normalizeLayouts(parsed);
        localStorage.setItem(RGL_LS_KEY, JSON.stringify(normalized));
        localStorage.removeItem("ct_layouts_v1");
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to migrate old layouts:", e);
        }
      }
    }
  }, []);
  useEffect(() => {
    try {
      const zonesRaw = localStorage.getItem(ZONES_KEY);
      const zonesObj = zonesRaw ? JSON.parse(zonesRaw) : null;
      if (!zonesObj || zonesObj.saved == null) {
        const next = { ...(zonesObj || {}), saved: "techDrawer" };
        localStorage.setItem(ZONES_KEY, JSON.stringify(next));
      }
      const layoutsRaw = localStorage.getItem(RGL_LS_KEY);
      if (layoutsRaw) {
        const parsed = JSON.parse(layoutsRaw);
        let changed = false;
        Object.keys(parsed).forEach((bp) => {
          const arr = parsed[bp];
          const filtered = arr.filter((it) => it.i !== "saved");
          if (filtered.length !== arr.length) {
            parsed[bp] = filtered;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(RGL_LS_KEY, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Failed to migrate saved panel:", e);
      }
    }
  }, []);
  const applyTheme = (theme) => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    root.classList.toggle('dark', isDark);
  };
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(theme);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [theme]);
  const handleApply = (next) => {
    setConfig(next);
    saveConfig(next);
    setTheme(next.general.theme);
    setShowSettings(false);
  };
  // ----------------------- Fuel selection -----------------------
  const [fuelKey, setFuelKey] = useState("Natural Gas"); // currently selected fuel key
  const fuel = FUELS[fuelKey]; // lookup fuel properties
  // Helper booleans for conditional UI/logic
  const isOil = fuelKey === "Fuel Oil #2" || fuelKey === "Biodiesel";
  const isGas = !isOil;

  // Programmer timing constants derived from a common Fireye EP-160 sequence
  const EP160 = { PURGE_HF_SEC: 30, LOW_FIRE_MIN_SEC: 30, PTFI_SEC: 10, MTFI_SPARK_OFF_SEC: 10, MTFI_PILOT_OFF_SEC: 15, POST_PURGE_SEC: 15, FFRT_SEC: 4 };
  // Ranges for air/fuel ratio expressed as excess air (EA)
  const IGNITABLE_EA = { min: 0.85, max: 1.6 }; // flame can light within this EA window
  const STABLE_EA = { min: 0.9, max: 1.5 }; // stable flame once running

  // ----------------------- Global state -----------------------
  const [boilerOn, setBoilerOn] = useState(true); // master power switch
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

  // Mapped vs actual burner gas flow
  const effectiveFuel = useMemo(
    () => (t7Main ? fuelFlow : (t6Pilot ? Math.min(fuelFlow, Math.max(0.5, minFuel * 0.5)) : 0)),
    [t7Main, t6Pilot, fuelFlow, minFuel]
  );

  // Always track cam/reg mapping regardless of flame state
  const gasCamCFH = useMemo(() => (isGas ? Math.max(0, fuelFlow) : 0), [isGas, fuelFlow]);
  // Actual burner flow (zero when valves closed or flame out)
  const gasBurnerCFH = useMemo(() => (isGas ? Math.max(0, effectiveFuel) : 0), [isGas, effectiveFuel]);

  // Derived gas meter statistics for the running burner
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
  const [tuningOn] = useState(false);
  const [camMap, setCamMap] = useState({}); // { percent: { fuel, air } }
  const [defaultsLoaded, setDefaultsLoaded] = useState(false);

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

  // Main 10 Hz loop that advances the burner state machine and simulated sensors
  useEffect(() => {
    const id = setInterval(() => {
      const dtms = 100; // loop interval in milliseconds
      stateTimeRef.current += dtms; // track elapsed time in current state

      // Compute current excess air (EA) for control logic
      const { C: _C, H: _H, O: _O } = fuel.formula;
      const _O2_needed = Math.max(0.0001, fuelFlow) * (_C + _H / 4 - _O / 2);
      const _airStoich = _O2_needed / 0.21;
      const EA_now = Math.max(0.1, airFlow / Math.max(0.001, _airStoich));

      // ---- Programmer state machine ----
      // Each branch represents a step in the ignition sequence.
      if (!boilerOn) {
        // If power is cut, jump to postpurge to clear the chamber
        if (burnerState !== "OFF" && burnerState !== "POSTPURGE") {
          setT5Spark(false); setT6Pilot(false); setT7Main(false);
          setBurnerState("POSTPURGE");
          stateTimeRef.current = 0;
        }
      } else if (burnerState === "OFF") {
        setBurnerState("DRIVE_HI");
        stateTimeRef.current = 0;
      } else if (burnerState === "DRIVE_HI") {
        // brief high-fire drive to open air damper
        if (stateTimeRef.current >= 1000) { setBurnerState("PREPURGE_HI"); stateTimeRef.current = 0; }
      } else if (burnerState === "PREPURGE_HI") {
        // high-fire purge clears the chamber
        if (stateTimeRef.current >= EP160.PURGE_HF_SEC * 1000) { setBurnerState("DRIVE_LOW"); stateTimeRef.current = 0; }
      } else if (burnerState === "DRIVE_LOW") {
        // move to low-fire for minimum purge
        if (stateTimeRef.current >= 1000) { setBurnerState("LOW_PURGE_MIN"); stateTimeRef.current = 0; }
      } else if (burnerState === "LOW_PURGE_MIN") {
        if (stateTimeRef.current >= EP160.LOW_FIRE_MIN_SEC * 1000) {
          // begin pilot trial for ignition (PTFI)
          setBurnerState("PTFI");
          setT5Spark(true); setT6Pilot(true); setT7Main(false);
          stateTimeRef.current = 0;
        }
      } else if (burnerState === "PTFI") {
        // pilot trial: wait for flame or lockout
        if (stateTimeRef.current >= EP160.PTFI_SEC * 1000) {
          if (flameSignal >= 10) {
            setT7Main(true); // main flame on
            setBurnerState("MTFI");
            stateTimeRef.current = 0;
          } else {
            // flame not proven → lockout
            setT5Spark(false); setT6Pilot(false); setT7Main(false);
            setBurnerState("LOCKOUT");
            setLockoutReason("PTFI FLAME FAIL");
            stateTimeRef.current = 0;
          }
        }
      } else if (burnerState === "MTFI") {
        // main-trial-for-ignition: drop spark then pilot
        if (stateTimeRef.current >= EP160.MTFI_SPARK_OFF_SEC * 1000) setT5Spark(false);
        if (stateTimeRef.current >= EP160.MTFI_PILOT_OFF_SEC * 1000) {
          setT6Pilot(false);
          setBurnerState("RUN_AUTO");
          stateTimeRef.current = 0;
        }
      } else if (burnerState === "RUN_AUTO") {
        // running state: monitor EA and flame signal
        if (EA_now < IGNITABLE_EA.min || EA_now > IGNITABLE_EA.max) {
          // EA out of range causes immediate flame blowout
          setT7Main(false);
          setBurnerState("POSTPURGE");
          setLockoutReason("FLAME BLOWOUT (EA out of range)");
          setLockoutPending(true);
          stateTimeRef.current = 0;
        } else if (flameSignal < 10) {
          // delay timer for flame failure
          flameOutTimerRef.current += dtms;
          if (flameOutTimerRef.current >= EP160.FFRT_SEC * 1000) {
            setT7Main(false);
            setBurnerState("LOCKOUT");
            setLockoutReason("FLAME FAIL");
            stateTimeRef.current = 0;
          }
        } else {
          flameOutTimerRef.current = 0;
        }
      } else if (burnerState === "POSTPURGE") {
        // continue fan to clear gases, then either lockout or off
        if (stateTimeRef.current >= EP160.POST_PURGE_SEC * 1000) {
          if (lockoutPending) {
            setBurnerState("LOCKOUT");
          } else {
            setBurnerState("OFF");
          }
          setLockoutPending(false);
          setStateCountdown(null);
          stateTimeRef.current = 0;
        }
      }

      // Display remaining time for states that have a fixed duration
      let remaining = null;
      if (burnerState === "PREPURGE_HI") remaining = EP160.PURGE_HF_SEC - stateTimeRef.current / 1000;
      else if (burnerState === "LOW_PURGE_MIN") remaining = EP160.LOW_FIRE_MIN_SEC - stateTimeRef.current / 1000;
      else if (burnerState === "PTFI") remaining = EP160.PTFI_SEC - stateTimeRef.current / 1000;
      else if (burnerState === "MTFI") remaining = EP160.MTFI_PILOT_OFF_SEC - stateTimeRef.current / 1000;
      else if (burnerState === "POSTPURGE") remaining = EP160.POST_PURGE_SEC - stateTimeRef.current / 1000;
      setStateCountdown(remaining !== null ? Math.max(0, Math.ceil(remaining)) : null);

      // Simulate flame-sensor response with a bit of noise for realism
      setFlameSignal((prev) => {
        if (!(burnerState === "PTFI" || burnerState === "MTFI" || burnerState === "RUN_AUTO")) {
          return 0;
        }
        let target = 0;
        const { C, H, O } = fuel.formula;
        const O2_needed = Math.max(0.0001, fuelFlow) * (C + H / 4 - O / 2);
        const airStoich = O2_needed / 0.21;
        const EA = Math.max(0.1, airFlow / Math.max(0.001, airStoich));
        const k = Math.exp(-Math.pow((EA - 1.05) / 0.35, 2));
        if (burnerState === "PTFI") {
          const ignitable = EA > IGNITABLE_EA.min && EA < IGNITABLE_EA.max && fuelFlow > 0.5;
          target = ignitable ? 22 + 6 * k : 5;
        } else if (burnerState === "MTFI" || burnerState === "RUN_AUTO") {
          target = 25 + 55 * k * Math.tanh(fuelFlow / 10);
        }
        const noise = (Math.random() - 0.5) * 2;
        return clamp(prev + (target - prev) * 0.25 + noise, 0, 80);
      });

      // First-order lag to approximate stack temperature rise and fall
      setSimStackF((prev) => {
        const dt = 0.1; // integration step seconds
        let tau = 1.5; // time constant
        let target = ambientF;
        if (burnerState === "OFF" || burnerState === "DRIVE_HI" || burnerState === "PREPURGE_HI" || burnerState === "DRIVE_LOW" || burnerState === "LOW_PURGE_MIN" || burnerState === "POSTPURGE" || burnerState === "LOCKOUT") {
          tau = 3; target = ambientF; // cool to ambient
        } else if (burnerState === "PTFI") {
          tau = 2.5; target = Math.max(ambientF + 40, setpointF - 80);
        } else if (burnerState === "MTFI") {
          tau = 4; target = Math.max(ambientF + 80, setpointF - 40);
        } else if (burnerState === "RUN_AUTO") {
          tau = 6; target = setpointF;
        }
        return prev + (target - prev) * (dt / tau);
      });
    }, 100);
    return () => clearInterval(id);
  }, [boilerOn, burnerState, setpointF, ambientF, fuel.formula, fuelFlow, airFlow, flameSignal, lockoutPending]);
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
  const steady = useMemo(
    () => computeCombustion({ fuel, fuelFlow: effectiveFuel, airFlow, stackTempF: simStackF, ambientF }),
    [fuel, effectiveFuel, airFlow, simStackF, ambientF],
  );

  // Analyzer displayed values with sensor lag and states
  const [disp, setDisp] = useState({ O2: 20.9, CO2: 0, CO: 0, COaf: 0, NOx: 0, StackF: 70, Eff: 0 });
  // Keep latest steady-state and stack temperature in refs for a stable analyzer smoother
  const steadyRef = useRef(steady);
  useEffect(() => { steadyRef.current = steady; }, [steady]);
  const simStackRef = useRef(simStackF);
  useEffect(() => { simStackRef.current = simStackF; }, [simStackF]);

  // Analyzer smoothing loop (runs continuously; does not reset on every render)
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
    // If the boiler is OFF, kick the sequence off
    if (burnerState === "OFF") { setBurnerState("DRIVE_HI"); stateTimeRef.current = 0; return; }

    // Drive states are short; just jump to the next state
    if (burnerState === "DRIVE_HI") { setBurnerState("PREPURGE_HI"); stateTimeRef.current = 0; return; }
    if (burnerState === "DRIVE_LOW") { setBurnerState("LOW_PURGE_MIN"); stateTimeRef.current = 0; return; }

    // For timed states, push the internal timer to the cutoff so the main loop advances on the next tick
    if (burnerState === "PREPURGE_HI") { stateTimeRef.current = EP160.PURGE_HF_SEC * 1000; return; }
    if (burnerState === "LOW_PURGE_MIN") { stateTimeRef.current = EP160.LOW_FIRE_MIN_SEC * 1000; return; }
    if (burnerState === "PTFI") { stateTimeRef.current = EP160.PTFI_SEC * 1000; return; }
    if (burnerState === "MTFI") { stateTimeRef.current = EP160.MTFI_PILOT_OFF_SEC * 1000; return; }
    if (burnerState === "POSTPURGE") { stateTimeRef.current = EP160.POST_PURGE_SEC * 1000; return; }

    // No-op for RUN_AUTO and LOCKOUT
  };

  // Log history for trend chart
  const [history, setHistory] = useState([]);
  const dispRef = useRef(disp);
  const fuelFlowRef = useRef(fuelFlow);
  const airFlowRef = useRef(airFlow);
  const rheostatRef = useRef(rheostat);
  useEffect(() => { dispRef.current = disp; }, [disp]);
  useEffect(() => { fuelFlowRef.current = fuelFlow; }, [fuelFlow]);
  useEffect(() => { airFlowRef.current = airFlow; }, [airFlow]);
  useEffect(() => { rheostatRef.current = rheostat; }, [rheostat]);
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

  const saveReading = useCallback((snapshot) => {
    const row = { id: crypto.randomUUID(), t: Date.now(), ...snapshot };
    setSaved((prev) => {
      const next = [row, ...prev];
      persistSaved(next);
      return next;
    });
  }, []);

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
  // Tuning assistant
  const tuningActive = tuningOn;

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
const rheostatRampRef = useRef(null);

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
  
  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900">
      <style>{`
        @keyframes flicker { from { transform: scale(1) translateY(0px); opacity: 0.9; } to { transform: scale(1.04) translateY(-2px); opacity: 1; } }
        @keyframes spark { from { transform: translateY(2px) scale(0.9); opacity: .7; } to { transform: translateY(-2px) scale(1.1); opacity: 1; } }
        @keyframes smoke { from { transform: translateY(0) scale(0.8); opacity: .6; } to { transform: translateY(-30px) scale(1.4); opacity: 0; } }
        .card { background: white; border-radius: 1rem; box-shadow: 0 6px 16px rgba(15,23,42,0.08); padding: 1rem; }
        .label { font-size: .75rem; text-transform: uppercase; letter-spacing: .06em; color: #64748b; }
        .value { font-size: 1.1rem; font-weight: 600; }
        .btn { padding: .5rem .75rem; border-radius: .75rem; border: 1px solid #cbd5e1; background: white; }
        .btn-primary { background: #0f172a; color: white; border-color: #0f172a; }
        .pill { padding: .25rem .5rem; border-radius: 9999px; font-size: .7rem; }
      `}</style>
        <RightDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>

          <div className="space-y-4">
            <button className="btn" onClick={() => setShowSettings(true)}>
              Settings
            </button>
            <div className="card">
              <div className="label">Start Troubleshooting Scenarios</div>
              <select
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
              <div className="flex gap-2 mt-2">
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
            </div>
            <CollapsibleSection title="Analyzer">
              <div className="card">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm">
                      State: {anState}{" "}
                      {probeInFlue && (
                        <span className="pill bg-slate-100 ml-2">
                          Probe in flue
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Led on={anState !== "OFF"} label="Power" />
                    <Led on={anState === "ZERO"} label="Zero" color="#06b6d4" />
                    <Led
                      on={anState === "SAMPLING"}
                      label="Sampling"
                      color="#84cc16"
                    />
                    <Led
                      on={anState === "HOLD"}
                      label="Hold"
                      color="#f59e0b"
                    />
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="btn" onClick={startAnalyzer}>
                    Start
                  </button>
                  <button
                    className="btn"
                    onClick={finishZero}
                    disabled={anState !== "ZERO"}
                  >
                    Finish Zero
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
                <div className="mt-2 text-xs text-slate-500">
                  Zero in room air to capture combustion air temperature. Then
                  insert probe to sample.
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </RightDrawer>

        <SettingsMenu
          open={showSettings}
          config={config}
          onApply={handleApply}
          onCancel={() => setShowSettings(false)}
        />


      <header className="px-6 py-4 border-b bg-white sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <h1 className="text-2xl font-semibold">Combustion Trainer</h1>
          <div className="ml-auto flex items-center gap-3">
            <button className="btn" onClick={() => downloadCSV("session.csv", history)}>Export Trend CSV</button>
            <button className="btn" onClick={() => setDrawerOpen(true)}>Technician</button>
            <button className="btn" onClick={exportSavedReadings}>Export Saved Readings</button>
            <button className="btn" onClick={handleResetLayouts}>Reset Layout</button>

            <button
              className="btn"
              aria-label="Settings"
              onClick={() => setShowSettings(true)}
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

      <main className="max-w-7xl mx-auto p-6">
        <ResponsiveGridLayout
          data-testid="grid-main"
          className="layout"
          breakpoints={rglBreakpoints}
          cols={rglCols}
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          rowHeight={10}
          margin={[16, 16]}
          draggableHandle=".drag-handle"
          compactType="vertical"
        >
          <div key="viz" data-testid="panel-viz" className="card overflow-hidden">
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
                <div aria-label="combustion chamber" className="relative h-72 rounded-3xl border bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
                  <div className="absolute inset-6 rounded-full border-2 border-slate-300" />
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-24 h-8 bg-slate-400 rounded-t-2xl" />
                  <div className="absolute inset-0">
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
                    {flameActive && steady.warnings.soot ? <Smoke /> : null}
                    {showSpark ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Spark />
                      </div>
                    ) : null}
                  </div>
                  <div className="absolute bottom-3 right-3 space-y-1 text-xs">
                    {steady.warnings.soot && (<div className="px-2 py-1 rounded bg-yellow-100 text-yellow-900">Soot risk</div>)}
                    {steady.warnings.overTemp && (<div className="px-2 py-1 rounded bg-red-100 text-red-800">Over-temp</div>)}
                    {steady.warnings.underTemp && (<div className="px-2 py-1 rounded bg-blue-100 text-blue-900">Condensate risk</div>)}
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
                <div className="label mt-6">Ambient Temperature (°F)</div>
                <input aria-label="ambient temperature" type="number" className="w-full border rounded-md px-2 py-1" value={ambientF} onChange={(e) => setAmbientF(parseFloat(e.target.value || 0))} />
              </div>
            </div>
          </div>
          <div key="controls" data-testid="panel-controls" className="card overflow-hidden">
            <PanelHeader title="Boiler Control Panel" />
            <CollapsibleSection title="Fuel Selector">
              <select aria-label="fuel selector" className="w-full border rounded-md px-2 py-2 mt-1" value={fuelKey} onChange={(e) => setFuelKey(e.target.value)}>
                {Object.keys(FUELS).map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <div className="mt-2 text-sm text-slate-600">HHV: {FUELS[fuelKey].HHV.toLocaleString()} Btu/{FUELS[fuelKey].unit}</div>
              <div className="mt-1 text-xs text-slate-500">Targets: O₂ {fuel.targets.O2[0]} to {fuel.targets.O2[1]} percent, COair-free ≤ {fuel.targets.COafMax} ppm</div>
            </CollapsibleSection>
            <div className="label mt-4">Boiler Power</div>
            <div className="flex items-center gap-2 mt-2">
              <button className={`btn ${boilerOn ? 'btn-primary' : ''}`} onClick={() => setBoilerOn(true)}>On</button>
              <button className="btn" onClick={() => setBoilerOn(false)}>Off</button>
            </div>
            <div className="label mt-4">Firing Rate (rheostat)</div>
            <input
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
              {tuningActive ? (
                <div>
                  <div className="mt-2 grid grid-cols-1 gap-4">
                    <div>
                      <div className="label">Fuel Flow ({FUELS[fuelKey].unit}, scaled)</div>
                      <input aria-label="tuning fuel flow" type="range" min={minFuel} max={maxFuel} step={0.1} value={fuelFlow} onChange={(e) => setFuelFlow(parseFloat(e.target.value))} className="w-full" />
                      <div className="value">{fuelFlow.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="label">Air Flow (cfm, scaled)</div>
                      <input aria-label="tuning air flow" type="range" min={0} max={200} step={1} value={airFlow} onChange={(e) => setAirFlow(parseFloat(e.target.value))} className="w-full" />
                      <div className="value">{Number(airFlow).toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="label">Camshaft Intervals</div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[0,10,20,30,40,50,60,70,80,90,100].map((p) => (
                        <button
                          key={p}
                          className={`btn ${rheostat === p ? 'btn-primary' : ''}`}
                          disabled={!canSetFiring}
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
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        className="btn btn-primary"
                        disabled={!canSetFiring}
                        onClick={setCamAtCurrent}
                        title="Save current fuel and air at this cam position"
                      >
                        Set {currentCam}%
                      </button>
                      <button
                        className="btn"
                        disabled={!camMap[currentCam]}
                        onClick={clearCamAtCurrent}
                        title="Clear saved point at this cam position"
                      >
                        Clear {currentCam}%
                      </button>
                      <button
                        className="btn"
                        onClick={applySafeDefaults}
                        title="Load safe default cam map (available anytime)"
                      >
                        Set tuning to safe defaults
                      </button>
                      {camMap[currentCam] && (
                        <span className="pill bg-green-100">Saved: F {camMap[currentCam].fuel} / A {camMap[currentCam].air}</span>
                      )}
                      {defaultsLoaded && (
                        <span className="pill bg-blue-100">Safe defaults loaded</span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Saved cam points: {Object.keys(camMap).length ? Object.keys(camMap).sort((a,b)=>a-b).join(', ') : 'none'}
                    </div>
                    <details className="mt-4">
                      <summary className="label cursor-pointer">Advanced inputs</summary>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <label className="text-sm col-span-2">
                          Air Flow
                          <input
                            type="number"
                            className="w-full border rounded-md px-2 py-1 mt-1"
                            value={airFlow}
                            onChange={(e) => setAirFlow(parseFloat(e.target.value || 0))}
                          />
                        </label>
                        <label className="text-sm col-span-2">
                          Fuel Flow
                          <input
                            type="number"
                            className="w-full border rounded-md px-2 py-1 mt-1"
                            value={fuelFlow}
                            onChange={(e) => setFuelFlow(parseFloat(e.target.value || 0))}
                          />
                        </label>
                      </div>
                    </details>
                    <details className="mt-3">
                      <summary className="label cursor-pointer">Regulators</summary>
                      {!isOil ? (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <label className="text-sm col-span-2">
                            Manifold pressure (in. w.c.)
                            <input
                              type="number"
                              className="w-full border rounded-md px-2 py-1 mt-1"
                              value={regPress}
                              onChange={(e) => setRegPress(parseFloat(e.target.value || 0))}
                            />
                          </label>
                          <div className="text-xs text-slate-500 col-span-2 mt-1">
                            Typical appliance manifold: NG ~3.5 in. w.c., LP ~10–11 in. w.c. Adjusting pressure raises input roughly with the square root of pressure.
                          </div>
                          <div className="text-xs text-slate-500 col-span-2">
                            Derived Min/Max fuel: {minFuel.toFixed(2)} / {maxFuel.toFixed(2)} (scaled)
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <label className="text-sm col-span-2">
                            Pump pressure (psi)
                            <input
                              type="number"
                              className="w-full border rounded-md px-2 py-1 mt-1"
                              value={regPress}
                              onChange={(e) => setRegPress(parseFloat(e.target.value || 0))}
                            />
                          </label>
                          <div className="text-xs text-slate-500 col-span-2 mt-1">
                            Oil nozzles are rated at 100 psi and flow scales ~√pressure. Higher pressure also improves atomization but watch for overfire.
                          </div>
                          <div className="text-xs text-slate-500 col-span-2">
                            Derived Min/Max fuel: {minFuel.toFixed(2)} / {maxFuel.toFixed(2)} (scaled)
                          </div>
                        </div>
                      )}
                    </details>
                    <div className="flex items-center gap-2 mt-2">
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
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div>
                    <div className="label">Fuel Flow ({FUELS[fuelKey].unit}, scaled)</div>
                    <div className="value">{fuelFlow.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="label">Air Flow (cfm, scaled)</div>
                    <div className="value">{Number(airFlow).toFixed(2)}</div>
                  </div>
                </div>
              )}
            </CollapsibleSection>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="label">Programmer (EP160)</div>
                  <div className="text-sm">State: {burnerState} {stateCountdown !== null && (<span className="pill bg-slate-100 ml-2">{stateCountdown}s left</span>)} {burnerState === "LOCKOUT" && (<span className="pill bg-red-100 ml-2">Lockout: {lockoutReason}</span>)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Led on={t5Spark} label="T5 Spark" color="#06b6d4" />
                  <Led on={t6Pilot} label="T6 Pilot" color="#f59e0b" />
                  <Led on={t7Main} label="T7 Main" color="#84cc16" />
                </div>
              </div>
              <div className="mt-2 flex items-center gap-4">
                <div className="text-sm">Flame Signal: <span className="font-semibold">{Math.round(flameSignal)}</span> (10 min, 20–80 normal)</div>
                <button className="btn" onClick={advanceStep}>Advance simulation</button>
                {burnerState === "LOCKOUT" && (<button className="btn btn-primary" onClick={resetProgrammer}>Reset Programmer</button>)}
              </div>
              <div className="mt-2 text-xs text-slate-500">Prepurge {EP160.PURGE_HF_SEC}s → Low fire {EP160.LOW_FIRE_MIN_SEC}s → PTFI {EP160.PTFI_SEC}s → MTFI (spark off {EP160.MTFI_SPARK_OFF_SEC}s, pilot off {EP160.MTFI_PILOT_OFF_SEC}s) → Run → Post purge {EP160.POST_PURGE_SEC}s.</div>
            </div>
          </div>
          <div key="readouts" data-testid="panel-readouts" className="card">
            <PanelHeader title="Readouts" />
            <div className="grid grid-cols-2 gap-3" role="group" aria-label="readouts">
              <div><div className="label">O₂ (dry)</div><div className="value">{disp.O2.toFixed(2)}%</div></div>
              <div><div className="label">CO₂ (dry)</div><div className="value">{disp.CO2.toFixed(2)}%</div></div>
              <div><div className="label">CO</div><div className="value">{Math.round(disp.CO)} ppm</div></div>
              <div><div className="label">CO air-free</div><div className="value">{Math.round(disp.COaf)} ppm</div></div>
              <div><div className="label">NOₓ</div><div className="value">{Math.round(disp.NOx)} ppm</div></div>
              <div><div className="label">Excess Air</div><div className="value">{((steady.excessAir - 1) * 100).toFixed(1)}%</div></div>
              <div><div className="label">Efficiency</div><div className="value">{Number(disp.Eff).toFixed(1)}%</div></div>
              <div><div className="label">Stack</div><div className="value">{Math.round(disp.StackF)} °F</div></div>
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
                      stackF: Math.round(disp.StackF),
                      O2: Number(disp.O2.toFixed(2)),
                      CO2: Number(disp.CO2.toFixed(2)),
                      COppm: Math.round(disp.CO),
                      NOxppm: Math.round(disp.NOx),
                      excessAir: Number(((steady.excessAir - 1) * 100).toFixed(1)),
                      efficiency: Number(Number(disp.Eff).toFixed(1)),
                    })
                  }
                >
                  Save Reading
                </button>
              </div>
            </div>
          </div>
          <div key="trend" className="card overflow-hidden flex flex-col">
            <PanelHeader title="Trend" />
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ts" type="number" domain={["dataMin", "dataMax"]} hide />
                  <YAxis yAxisId="left" domain={[0, 100]} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 600]} />
                  <Tooltip />
                  <Legend />
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
          </div>
          <div key="meter" data-testid="panel-meter" className="card overflow-hidden">
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
                    {oilSecPerGal > 0 ? oilSecPerGal.toFixed(0) : "—"}
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
          </div>
          {mainItems.map((id) => {
              const Panel = panels[id].Component;
              return (
                <div key={id} className="card overflow-hidden" data-grid={{ w: 3, h: 10 }}>
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
                </div>
              );
            })}

        </ResponsiveGridLayout>
      </main>

      <footer className="max-w-7xl mx-auto p-6 text-xs text-slate-500">Educational model. For classroom intuition only.</footer>
    </div>
  );
}
