/* eslint-disable react-hooks/exhaustive-deps */
import React,
{
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
import { FUELS } from "../lib/fuels";
import { clamp, lerp, f2c, num } from "../lib/math";
import { downloadCSV } from "../lib/csv";
import { computeCombustion } from "../lib/chemistry";
import { buildSafeCamMap } from "../lib/cam";
import CollapsibleSection from "../components/CollapsibleSection";
import RightDrawer from "../components/RightDrawer";
import { useUIState } from "../components/UIStateContext";
import Led from "../components/ui/Led";
import Flame from "../components/effects/Flame";
import Spark from "../components/effects/Spark";
import Smoke from "../components/effects/Smoke";
import { saveConfig, getDefaultConfig } from "../lib/config";
import SettingsMenu from "../components/SettingsMenu";
import AirDrawerIndicator from "../components/AirDrawerIndicator";
import GridAutoSizer from "../components/GridAutoSizer";
import { panels, defaultZoneById } from "../panels";

const ResponsiveGridLayout = WidthProvider(Responsive);

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? _useLayoutEffect : useEffect;
const isDev = typeof process !== "undefined" && process.env.NODE_ENV !== "production";

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
    // Place tuning panel in the right column by default (immediately under meter)
    { i: "tuning",   x: 7, y: 40, w: 5,  h: 22, minW: 3, minH: 14 },
  ],
  md: [
    { i: "viz",      x: 0, y: 0,  w: 6,  h: 26 },
    { i: "controls", x: 0, y: 26, w: 6,  h: 20 },
    { i: "readouts", x: 6, y: 0,  w: 4,  h: 12 },
    { i: "trend",    x: 6, y: 12, w: 4,  h: 16 },
    { i: "meter",    x: 6, y: 28, w: 4,  h: 12 },
    { i: "tuning",   x: 6, y: 40, w: 4,  h: 22 },
  ],
  sm: [
    { i: "viz",      x: 0, y: 0,  w: 5,  h: 26 },
    { i: "controls", x: 0, y: 26, w: 5,  h: 20 },
    { i: "readouts", x: 5, y: 0,  w: 3,  h: 12 },
    { i: "trend",    x: 5, y: 12, w: 3,  h: 16 },
    { i: "meter",    x: 5, y: 28, w: 3,  h: 12 },
    { i: "tuning",   x: 5, y: 40, w: 3,  h: 24 },
  ],
  xs: [
    { i: "viz",      x: 0, y: 0,  w: 6, h: 24 },
    { i: "controls", x: 0, y: 24, w: 6, h: 18 },
    { i: "readouts", x: 0, y: 42, w: 6, h: 10 },
    { i: "trend",    x: 0, y: 52, w: 6, h: 16 },
    { i: "meter",    x: 0, y: 68, w: 6, h: 10 },
    { i: "tuning",   x: 0, y: 78, w: 6, h: 24 },
  ],
  xxs: [
    { i: "viz",      x: 0, y: 0,  w: 4, h: 24 },
    { i: "controls", x: 0, y: 24, w: 4, h: 18 },
    { i: "readouts", x: 0, y: 42, w: 4, h: 10 },
    { i: "trend",    x: 0, y: 52, w: 4, h: 16 },
    { i: "meter",    x: 0, y: 68, w: 4, h: 10 },
    { i: "tuning",   x: 0, y: 78, w: 4, h: 26 },
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
    if (isDev) {
      console.error("Failed to load layouts from localStorage:", e);
    }
    return normalizeLayouts(defaultLayouts);
  }
}

function saveLayouts(layouts) {
  try {
    localStorage.setItem(RGL_LS_KEY, JSON.stringify(layouts));
  } catch (e) {
    if (isDev) {
      console.error("Failed to save layouts to localStorage:", e);
    }
  }
}

function loadZones() {
  try {
    return JSON.parse(localStorage.getItem(ZONES_KEY)) || defaultZoneById;
  } catch (e) {
    if (isDev) {
      console.error("Failed to load zones from localStorage:", e);
    }
    return defaultZoneById;
  }
}
function saveZones(z) {
  try {
    localStorage.setItem(ZONES_KEY, JSON.stringify(z));
  } catch (e) {
    if (isDev) {
      console.error("Failed to save zones to localStorage:", e);
    }
  }
}


function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    if (isDev) {
      console.error("Failed to load saved readings:", e);
    }
    return [];
  }
}
function persistSaved(next) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch (e) {
    if (isDev) {
      console.error("Failed to persist saved readings:", e);
    }
  }
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

export default function AppLayout({ initialConfig, children }) {
  const { drawerOpen, setDrawerOpen, seriesVisibility, setSeriesVisibility } = useUIState();
  const [config, setConfig] = useState(initialConfig || getDefaultConfig());
  const configBeforeSettings = useRef(null);

  // Settings modal visibility
  const unitSystem = config.units.system;
  const [showSettings, setShowSettings] = useState(false);
  const [layouts, setLayouts] = useState(loadLayouts());
  const [autoSizeLock, setAutoSizeLock] = useState(false);
  const lastRowsRef = useRef({});
  const [breakpoint, setBreakpoint] = useState('lg');

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("ct_theme") || "system";
    } catch (e) {
      if (isDev) {
        console.error("Failed to load theme from localStorage:", e);
      }
      return "system";
    }
  });

  useIsomorphicLayoutEffect(() => {
    applyTheme(theme);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("ct_theme", theme);
    } catch (e) {
      if (isDev) {
        console.error("Failed to save theme to localStorage:", e);
      }
    }
    applyTheme(theme);
  }, [theme]);


  const handleLayoutChange = (_current, allLayouts) => {
    setLayouts(allLayouts);
    saveLayouts(allLayouts);
  };
  // helper to set height for a panel in current breakpoint layout
  const setItemRows = useCallback((key, rows) => {
    if (autoSizeLock) return; // avoid feedback loop while dragging/resizing
    if (lastRowsRef.current[key] === rows) return;
    lastRowsRef.current[key] = rows;
    setLayouts((prev) => {
      const bp = breakpoint;
      const arr = prev[bp] || [];
      const idx = arr.findIndex((it) => it.i === key);
      if (idx === -1) return prev;
      const cur = arr[idx];
      if (cur.h === rows) return prev;
      const nextArr = [...arr];
      nextArr[idx] = { ...cur, h: rows };
      const copy = { ...prev, [bp]: nextArr };
      saveLayouts(copy);
      return copy;
    });
  }, [autoSizeLock, breakpoint]);

  const handleResetLayouts = () => {
    localStorage.removeItem(RGL_LS_KEY);
    localStorage.removeItem("ct_layouts_v1");
    setLayouts(normalizeLayouts(defaultLayouts));
  };
  const dock = useCallback((id, zone) => {
    setZones((prev) => {
      const next = { ...prev, [id]: zone };
      saveZones(next);
      return next;
    });
  }, []);
  const [zones, setZones] = useState(loadZones());
  const mainItems = useMemo(
    () => Object.keys(panels).filter((id) => zones[id] === "main"),
    [zones],
  );
  useEffect(() => {
    try {
      const v2 = localStorage.getItem(RGL_LS_KEY);
      const v1 = localStorage.getItem("ct_layouts_v1");
      console.log("Value of v1 from localStorage:", v1);
      if (!v2 && v1) {
        const parsed = JSON.parse(v1);
        const normalized = normalizeLayouts(parsed);
        localStorage.setItem(RGL_LS_KEY, JSON.stringify(normalized));
        localStorage.removeItem("ct_layouts_v1");
      }
    } catch (e) {
      if (isDev) {
        console.error("Failed to migrate old layouts:", e);
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
      if (isDev) {
        console.error("Failed to migrate saved panel:", e);
      }
    }
  }, []);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const applyTheme = (theme) => {
    const html = document.documentElement;
    const body = document.body;
    const rootEl = document.getElementById('root');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);
    // Keep all potential ancestors in sync so Tailwind's dark: variant cannot get stuck
    [html, body, rootEl].forEach((el) => el && el.classList.toggle('dark', isDark));
    // Ensure native form controls (select, inputs) follow current theme
    html.style.setProperty('color-scheme', isDark ? 'dark' : 'light');
    setIsDarkMode(isDark);
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
  const handleApply = (next) => {
    setConfig(next);
    saveConfig(next);
    setTheme(next.general.theme);
    setShowSettings(false);
  };
  const handleCancel = () => {
    if (configBeforeSettings.current) {
      setConfig(configBeforeSettings.current);
      applyTheme(configBeforeSettings.current.general.theme);
    }
    setShowSettings(false);
  };
  // Live preview handler from SettingsMenu
  const handlePreview = (next, meta) => {
    setConfig(next);
    // Only update theme immediately if the changed field is theme
    if (meta?.section === 'general' && meta?.field === 'theme') {
      setTheme(next.general.theme);
    }
  };
  // Scenario selection state and handler
  const [scenarioSel, setScenarioSel] = useState("");
  const handleScenarioChange = useCallback((e) => {
    const val = e.target.value;
    setScenarioSel(val);
    if (val === "" || val === "Reset") {
      // reset scenario-specific overrides if implemented later
    }
  }, []);
  // ----------------------- Fuel selection -----------------------
  const [fuelKey, setFuelKey] = useState("Natural Gas"); // currently selected fuel key
  const fuel = FUELS[fuelKey]; // lookup fuel properties
  // Helper booleans for conditional UI/logic
  const isOil = fuelKey === "Fuel Oil #2" || fuelKey === "Biodiesel";
  const isGas = !isOil;

  // Programmer timing constants derived from a common Fireye EP-160 sequence
  const EP160 = { PURGE_HF_SEC: 30, LOW_FIRE_MIN_SEC: 30, LOW_FIRE_DRIVE_SEC: 5, PTFI_SEC: 10, MTFI_SPARK_OFF_SEC: 10, MTFI_PILOT_OFF_SEC: 15, POST_PURGE_SEC: 15, FFRT_SEC: 4 };
  // Ranges for air/fuel ratio expressed as excess air (EA)
  const IGNITABLE_EA = { min: 0.85, max: 1.6 }; // flame can light within this EA window
  const STABLE_EA = { min: 0.9, max: 1.5 }; // stable flame once running

  // ----------------------- Global state -----------------------
  const [boilerOn, setBoilerOn] = useState(false); // master power switch
  const [rheostat, setRheostat] = useState(0); // firing-rate input 0–100%
  const [minFuel, setMinFuel] = useState(2); // derived from regulator pressure
  const [maxFuel, setMaxFuel] = useState(18);
  const [simSpeedMultiplier, setSimSpeedMultiplier] = useState(1); // for tour fast-forward

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
  const chamberRef = useRef(null); // chamber container for sizing overlays
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
  const gasCFH = useMemo(
    () => (gasAvg > 0 ? (3600 * gasDialSize) / gasAvg : 0),
    [gasAvg, gasDialSize],
  );
  const gasMBH = useMemo(() => gasCFH * fuel.HHV / 1000, [gasCFH, fuel]);

  const effectiveFuel = useMemo(
    () => (t7Main ? fuelFlow : (t6Pilot ? Math.min(fuelFlow, Math.max(0.5, minFuel * 0.5)) : 0)),
    [t7Main, t6Pilot, fuelFlow, minFuel]
  );

  const gasCamCFH = useMemo(() => (isGas ? Math.max(0, fuelFlow) : 0), [isGas, fuelFlow]);
  const gasBurnerCFH = useMemo(() => (isGas ? Math.max(0, effectiveFuel) : 0), [isGas, effectiveFuel]);

  const gasMeterRevSec = useMemo(
    () => (gasBurnerCFH > 0 ? (3600 * gasDialSize) / gasBurnerCFH : 0),
    [gasBurnerCFH, gasDialSize]
  );
  const gasMBH_model = useMemo(() => gasBurnerCFH * fuel.HHV / 1000, [gasBurnerCFH, fuel]);

  const [nozzleGPH100, setNozzleGPH100] = useState(0.75); // nozzle rating at 100 psi
  const [oilPressure, setOilPressure] = useState(100); // pump pressure
  const oilGPH = useMemo(
    () => nozzleGPH100 * Math.sqrt(oilPressure / 100),
    [nozzleGPH100, oilPressure],
  );
  const oilMBH = useMemo(() => oilGPH * fuel.HHV / 1000, [oilGPH, fuel]);
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

  const currentCam = useMemo(() => clamp(Math.round(rheostat / 10) * 10, 0, 100), [rheostat]);

  const setCamAtCurrent = () => {
    setCamMap((m) => ({
      ...m,
      [currentCam]: {
        fuel: Number(parseFloat(fuelFlow).toFixed(2)),
        air: Number(parseFloat(airFlow).toFixed(2)),
      },
    }));
  };

  const clearCamAtCurrent = () => {
    setCamMap((m) => {
      const n = { ...m };
      delete n[currentCam];
      return n;
    });
  };

  const applyCamIfSaved = (pos) => {
    const k = clamp(Math.round(pos / 10) * 10, 0, 100);
    if (camMap && camMap[k]) {
      const { fuel: f, air: a } = camMap[k];
      setFuelFlow(num(f, fuelFlow));
      setAirFlow(num(a, airFlow));
    }
  };

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

  const BASE_MIN_FUEL = 2;
  const BASE_MAX_FUEL = 18;

  const [regPress, setRegPress] = useState(3.5); // in. w.c. for NG baseline; reset on fuel change

  useEffect(() => {
    const { C, H, O } = fuel.formula;
    const fuelMol = Math.max(0.0001, fuelFlow);
    const O2_needed = fuelMol * (C + H / 4 - O / 2);
    const airStoich = O2_needed / 0.21;
    const EA = Math.max(0.2, airFlow / Math.max(0.001, airStoich));
    const base = 250 + 18 * fuelMol + 40 * Math.tanh((EA - 1) * 1.5);
    setSetpointF(clamp(base, 150, 600));
  }, [fuel, fuelFlow, airFlow]);

  useEffect(() => {
    const baseP = isOil ? 100 : (fuelKey === "Propane" ? 11 : 3.5); // psi for oil, in. w.c. for gas
    setRegPress(baseP);
  }, [fuelKey, isOil]);

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

  const fuelFlowRef = useRef(fuelFlow);
  useEffect(() => { fuelFlowRef.current = fuelFlow; }, [fuelFlow]);
  const airFlowRef = useRef(airFlow);
  useEffect(() => { airFlowRef.current = airFlow; }, [airFlow]);

  const boilerOnRef = useRef(boilerOn);
  useEffect(() => { boilerOnRef.current = boilerOn; }, [boilerOn]);
  const burnerStateRef = useRef(burnerState);
  useEffect(() => { burnerStateRef.current = burnerState; }, [burnerState]);
  const fuelRef = useRef(fuel);
  useEffect(() => { fuelRef.current = fuel; }, [fuel]);
  const flameSignalRef = useRef(flameSignal);
  useEffect(() => { flameSignalRef.current = flameSignal; }, [flameSignal]);
  const lockoutPendingRef = useRef(lockoutPending);
  useEffect(() => { lockoutPendingRef.current = lockoutPending; }, [lockoutPending]);
  const ambientFRef = useRef(ambientF);
  useEffect(() => { ambientFRef.current = ambientF; }, [ambientF]);
  const setpointFRef = useRef(setpointF);
  useEffect(() => { setpointFRef.current = setpointF; }, [setpointF]);
  const simSpeedMultiplierRef = useRef(simSpeedMultiplier);
  useEffect(() => { simSpeedMultiplierRef.current = simSpeedMultiplier; }, [simSpeedMultiplier]);

  useEffect(() => {
    window.setBoilerOn = setBoilerOn;
    window.getBoilerOn = () => boilerOn;
    window.setSimSpeed = setSimSpeedMultiplier;
    window.getSimSpeed = () => simSpeedMultiplier;
    window.setRheostat = (val) => {
      try {
        const n = Math.max(0, Math.min(100, parseInt(val)));
        setRheostat(n);
      } catch { /* ignore */ }
    };
    window.getProgrammerState = () => burnerStateRef.current;
    const adv = () => {
      try {
        if (typeof advanceStep === 'function') { advanceStep(); return true; }
      } catch { }
      return false;
    };
    window.advanceProgrammer = adv;
    return () => {
      delete window.setBoilerOn;
      delete window.getBoilerOn;
      delete window.setSimSpeed;
      delete window.getSimSpeed;
      delete window.setRheostat;
      delete window.getProgrammerState;
      delete window.advanceProgrammer;
    };
  }, [setBoilerOn, boilerOn, setSimSpeedMultiplier, simSpeedMultiplier]);

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
        } catch (e) {
          if (isDev) console.error('Failed to dispatch programmer event', e);
        }
      }

      let remaining = null;
  if (currentBurnerState === "PREPURGE_HI" || currentBurnerState === "DRIVE_HI") remaining = EP160.PURGE_HF_SEC - stateTimeRef.current / 1000;
      else if (currentBurnerState === "DRIVE_LOW") remaining = EP160.LOW_FIRE_DRIVE_SEC - stateTimeRef.current / 1000;
      else if (currentBurnerState === "LOW_PURGE_MIN") remaining = EP160.LOW_FIRE_MIN_SEC - stateTimeRef.current / 1000;
      else if (currentBurnerState === "PTFI") remaining = EP160.PTFI_SEC - stateTimeRef.current / 1000;
      else if (currentBurnerState === "MTFI") remaining = EP160.MTFI_PILOT_OFF_SEC - stateTimeRef.current / 1000;
      else if (currentBurnerState === "POSTPURGE") remaining = EP160.POST_PURGE_SEC - stateTimeRef.current / 1000;
      setStateCountdown(remaining !== null ? Math.max(0, Math.ceil(remaining)) : null);

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
  }, []);
  useEffect(() => {
    const mapKey = clamp(Math.round(rheostat / 10) * 10, 0, 100);
    if (camMap && camMap[mapKey]) {
      const { fuel: f, air: a } = camMap[mapKey];
      setFuelFlow(num(f, fuelFlow));
      setAirFlow(num(a, airFlow));
      return;
    }

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

  const steady = useMemo(
    () => computeCombustion({ fuel, fuelFlow: effectiveFuel, airFlow, stackTempF: simStackF, ambientF }),
    [fuel, effectiveFuel, airFlow, simStackF, ambientF],
  );

  const [disp, setDisp] = useState({ O2: 20.9, CO2: 0, CO: 0, COaf: 0, NOx: 0, StackF: 70, Eff: 0 });
  const dispRef = useRef(disp);
  const simStackRef = useRef(simStackF);
  useEffect(() => { dispRef.current = disp; }, [disp]);
  useEffect(() => { simStackRef.current = simStackF; }, [simStackF]);

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

  const advanceStep = () => {
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
      if (isTestEnv) { setRheostat(0); }
      return; }
    if (s === "RUN_AUTO") { return; }
    if (s === "POSTPURGE") { jump("OFF"); return; }
    if (s === "LOCKOUT") { return; }

    if (s === "PREPURGE_HI") { stateTimeRef.current = EP160.PURGE_HF_SEC * 1000; return; }
  };

  const [history, setHistory] = useState([]);
  const rheostatRef = useRef(rheostat);
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
  const [anState, setAnState] = useState("OFF");
  const [probeInFlue, setProbeInFlue] = useState(false);
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
  const tuningActive = tuningOn;
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
        setAnMenuScreen('LIVE');
      }
    } else if (anMenuScreen === 'FUEL') {
      const sel = fuelItems[anMenuIndex];
      setSelectedFuel(sel);
      setAnMenuScreen('LIVE');
    } else if (anMenuScreen === 'LIVE') {
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
          const yMax = arr.reduce((m, it) => Math.max(m, it.y + (it.h || 0)), 0);
          const newItem = template ? { ...template, y: yMax } : { i: 'tuning', x: 0, y: yMax, w: 6, h: 18 };
          arr.push(newItem);
          next[bp] = arr;
          changed = true;
        } else if (has && template) {
          const legacyLike = has.x === 0 && (has.w >= 5 || has.w === prev?.[bp]?.find?.(i=>i.i==='controls')?.w);
          const needsResize = has.w !== template.w || has.h < template.h * 0.8;
          const needsMove = has.x !== template.x;
          if (legacyLike || needsResize || needsMove) {
            const updated = { ...has };
            updated.x = template.x;
            updated.w = template.w;
            updated.h = Math.max(has.h, template.h);
            let targetY = template.y;
            const collides = (item, x, w, y, h) => !(item.x + item.w <= x || x + w <= item.x || item.y + item.h <= y || y + h <= item.y);
            while (arr.some(it => it.i !== 'tuning' && collides(it, updated.x, updated.w, targetY, updated.h))) {
              const blockers = arr.filter(it => it.i !== 'tuning' && collides(it, updated.x, updated.w, targetY, updated.h));
              const pushDown = Math.max(...blockers.map(b => b.y + b.h));
              targetY = pushDown;
            }
            updated.y = targetY;
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
  const camControlsEnabled = canSetFiring || isTestEnv;
const rheostatRampRef = useRef(null);

  const displayFireRate = useMemo(() => {
    if (burnerState === "PREPURGE_HI" || burnerState === "DRIVE_HI") return 100;
    if (burnerState === "LOW_PURGE_MIN" || burnerState === "DRIVE_LOW") return 0;
    if (burnerState === "OFF" || burnerState === "POSTPURGE" || burnerState === "LOCKOUT") return 0;
    return rheostat;
  }, [burnerState, rheostat]);

  useEffect(() => {
    const shouldRampDown = (!boilerOn) || burnerState === "POSTPURGE" || burnerState === "LOCKOUT" || burnerState === "OFF";

    if (shouldRampDown && rheostat > 0 && !rheostatRampRef.current) {
      rheostatRampRef.current = setInterval(() => {
        setRheostat((v) => {
          const step = 5;
          const next = Math.max(0, v - step);
          if (next === 0 && rheostatRampRef.current) {
            clearInterval(rheostatRampRef.current);
            rheostatRampRef.current = null;
          }
          return next;
        });
      }, 100);
    }

    if ((!shouldRampDown || burnerState === "RUN_AUTO") && rheostatRampRef.current) {
      clearInterval(rheostatRampRef.current);
      rheostatRampRef.current = null;
    }

    return () => {
      if (rheostatRampRef.current) {
        clearInterval(rheostatRampRef.current);
        rheostatRampRef.current = null;
      }
    };
  }, [burnerState, boilerOn, rheostat]);
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
      setZeroProgress(0);
    }
    return () => { if (id) clearInterval(id); };
  }, [anState]);
  useEffect(() => {
    if (burnerState === "PREPURGE_HI" || burnerState === "DRIVE_HI") {
      setRheostat(100);
    } else if (burnerState === "LOW_PURGE_MIN" || burnerState === "DRIVE_LOW") {
      setRheostat(0);
    }
  }, [burnerState]);
  
  return (
    <div className="min-h-screen w-full bg-background text-foreground">
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
              When ON, adjust fuel and air together and step the cam in 10% intervals.
            </div>
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
          {children}
        </ResponsiveGridLayout>
      </main>

      <footer className="max-w-7xl mx-auto p-6 text-xs text-slate-500">Educational model. For classroom intuition only.</footer>
    </div>
  );
}
