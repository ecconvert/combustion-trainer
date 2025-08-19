import { useState, useCallback, useEffect, useRef } from 'react';

// ----------------------- Constants -----------------------
const RGL_LS_KEY = "ct_layouts_v2";
const ZONES_KEY = "ct_zones_v1";

const rglBreakpoints = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const rglCols = { lg: 12, md: 10, sm: 8, xs: 6, xxs: 4 };

const defaultLayouts = {
  lg: [
    { i: "viz", x: 0, y: 0, w: 7, h: 26, minW: 4, minH: 12 },
    { i: "controls", x: 0, y: 26, w: 7, h: 20, minW: 4, minH: 10 },
    { i: "readouts", x: 7, y: 0, w: 5, h: 12, minW: 3, minH: 6 },
    { i: "trend", x: 7, y: 12, w: 5, h: 16, minW: 3, minH: 10 },
    { i: "meter", x: 7, y: 28, w: 5, h: 12, minW: 3, minH: 8 },
    { i: "tuning", x: 7, y: 40, w: 5, h: 22, minW: 3, minH: 14 },
  ],
  md: [
    { i: "viz", x: 0, y: 0, w: 6, h: 26 },
    { i: "controls", x: 0, y: 26, w: 6, h: 20 },
    { i: "readouts", x: 6, y: 0, w: 4, h: 12 },
    { i: "trend", x: 6, y: 12, w: 4, h: 16 },
    { i: "meter", x: 6, y: 28, w: 4, h: 12 },
    { i: "tuning", x: 6, y: 40, w: 4, h: 22 },
  ],
  sm: [
    { i: "viz", x: 0, y: 0, w: 5, h: 26 },
    { i: "controls", x: 0, y: 26, w: 5, h: 20 },
    { i: "readouts", x: 5, y: 0, w: 3, h: 12 },
    { i: "trend", x: 5, y: 12, w: 3, h: 16 },
    { i: "meter", x: 5, y: 28, w: 3, h: 12 },
    { i: "tuning", x: 5, y: 40, w: 3, h: 24 },
  ],
  xs: [
    { i: "viz", x: 0, y: 0, w: 6, h: 24 },
    { i: "controls", x: 0, y: 24, w: 6, h: 18 },
    { i: "readouts", x: 0, y: 42, w: 6, h: 10 },
    { i: "trend", x: 0, y: 52, w: 6, h: 16 },
    { i: "meter", x: 0, y: 68, w: 6, h: 10 },
    { i: "tuning", x: 0, y: 78, w: 6, h: 24 },
  ],
  xxs: [
    { i: "viz", x: 0, y: 0, w: 4, h: 24 },
    { i: "controls", x: 0, y: 24, w: 4, h: 18 },
    { i: "readouts", x: 0, y: 42, w: 4, h: 10 },
    { i: "trend", x: 0, y: 52, w: 4, h: 16 },
    { i: "meter", x: 0, y: 68, w: 4, h: 10 },
    { i: "tuning", x: 0, y: 78, w: 4, h: 26 },
  ],
};

// ----------------------- Helper functions -----------------------
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
    console.error("Failed to load layouts from localStorage:", e);
    return normalizeLayouts(defaultLayouts);
  }
}

function saveLayouts(layouts) {
  try {
    localStorage.setItem(RGL_LS_KEY, JSON.stringify(layouts));
  } catch (e) {
    console.error("Failed to save layouts to localStorage:", e);
  }
}

function loadZones() {
  try {
    const raw = localStorage.getItem(ZONES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.error("Failed to load zones from localStorage:", e);
    return {};
  }
}

function saveZones(zones) {
  try {
    localStorage.setItem(ZONES_KEY, JSON.stringify(zones));
  } catch (e) {
    console.error("Failed to save zones to localStorage:", e);
  }
}

/**
 * Hook for managing responsive grid layout state and operations
 * Handles layout persistence, breakpoints, auto-sizing, and panel management
 */
export default function useLayoutManager() {
  // ----------------------- State -----------------------
  const [layouts, setLayouts] = useState(loadLayouts());
  const [autoSizeLock, setAutoSizeLock] = useState(false);
  const [breakpoint, setBreakpoint] = useState('lg');
  const [zones, setZones] = useState(loadZones());
  const lastRowsRef = useRef({});

  // ----------------------- Layout management functions -----------------------
  const handleLayoutChange = useCallback((_current, allLayouts) => {
    setLayouts(allLayouts);
    saveLayouts(allLayouts);
  }, []);

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

  const handleResetLayouts = useCallback(() => {
    localStorage.removeItem(RGL_LS_KEY);
    localStorage.removeItem("ct_layouts_v1");
    const normalized = normalizeLayouts(defaultLayouts);
    setLayouts(normalized);
    saveLayouts(normalized);
  }, []);

  const dock = useCallback((id, zone) => {
    setZones((prev) => {
      const next = { ...prev, [id]: zone };
      saveZones(next);
      return next;
    });
  }, []);

  // ----------------------- Drag/resize handlers -----------------------
  const handleDragStart = useCallback(() => {
    setAutoSizeLock(true);
  }, []);

  const handleDragStop = useCallback(() => {
    setAutoSizeLock(false);
  }, []);

  const handleResizeStart = useCallback(() => {
    setAutoSizeLock(true);
  }, []);

  const handleResizeStop = useCallback(() => {
    setAutoSizeLock(false);
  }, []);

  // ----------------------- Initialization effects -----------------------
  useEffect(() => {
    // Migration effect for v1 layouts
    try {
      const v2 = localStorage.getItem(RGL_LS_KEY);
      const v1 = localStorage.getItem("ct_layouts_v1");
      if (!v2 && v1) {
        const parsed = JSON.parse(v1);
        const normalized = normalizeLayouts(parsed);
        localStorage.setItem(RGL_LS_KEY, JSON.stringify(normalized));
        localStorage.removeItem("ct_layouts_v1");
        setLayouts(normalized);
      }
    } catch (e) {
      console.error("Failed to migrate old layouts:", e);
    }
  }, []);

  useEffect(() => {
    // Initialize saved readings zone if not set
    try {
      const zonesRaw = localStorage.getItem(ZONES_KEY);
      const zonesObj = zonesRaw ? JSON.parse(zonesRaw) : null;
      if (!zonesObj || zonesObj.saved == null) {
        const next = { ...(zonesObj || {}), saved: "techDrawer" };
        setZones(next);
        saveZones(next);
      }
    } catch (e) {
      console.error("Failed to initialize zones:", e);
    }
  }, []);

  return {
    // Constants
    rglBreakpoints,
    rglCols,
    defaultLayouts,
    
    // State
    layouts,
    setLayouts,
    autoSizeLock,
    setAutoSizeLock,
    breakpoint,
    setBreakpoint,
    zones,
    setZones,
    
    // Layout management
    handleLayoutChange,
    setItemRows,
    handleResetLayouts,
    dock,
    
    // Drag/resize handlers
    handleDragStart,
    handleDragStop,
    handleResizeStart,
    handleResizeStop,
    
    // Helper functions
    normalizeLayouts,
    loadLayouts,
    saveLayouts,
    loadZones,
    saveZones,
  };
}