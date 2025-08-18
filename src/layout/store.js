/* global process */
import { useSyncExternalStore } from "react";
import { defaultLayouts, defaultZoneById } from "./panels";

const KEY_MAIN_WIDE = "uiLayout_v2_mainWide";
const KEY_MAIN_NARROW = "uiLayout_v2_mainNarrow";
const KEY_TECH = "uiLayout_v2_tech";
const KEY_ZONES = "uiLayout_v2_zones";

function loadState() {
  if (typeof window === "undefined") {
    return { layouts: defaultLayouts, zoneById: defaultZoneById };
  }
  const parse = (key, fallback) => {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch (e) {
      if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
        console.error(`Failed to load ${key} from localStorage:`, e);
      }
      return fallback;
    }
  };
  return {
    layouts: {
      mainWide: parse(KEY_MAIN_WIDE, defaultLayouts.mainWide),
      mainNarrow: parse(KEY_MAIN_NARROW, defaultLayouts.mainNarrow),
      techDrawer: parse(KEY_TECH, defaultLayouts.techDrawer),
    },
    zoneById: parse(KEY_ZONES, defaultZoneById),
  };
}

const state = loadState();
const listeners = new Set();

function save() {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY_MAIN_WIDE, JSON.stringify(state.layouts.mainWide));
    localStorage.setItem(KEY_MAIN_NARROW, JSON.stringify(state.layouts.mainNarrow));
    localStorage.setItem(KEY_TECH, JSON.stringify(state.layouts.techDrawer));
    localStorage.setItem(KEY_ZONES, JSON.stringify(state.zoneById));
  } catch (e) {
    if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
      console.error("Failed to save layouts to localStorage:", e);
    }
  }
}

function setState(partial) {
  Object.assign(state, partial);
  save();
  listeners.forEach((l) => l());
}

export function useLayoutStore(sel) {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => sel(state)
  );
}

export function moveWithinZone(zone, layouts) {
  setState({ layouts: { ...state.layouts, [zone]: layouts } });
}

export function moveAcrossZones(id, from, to, target) {
  const layouts = { ...state.layouts };
  if (from) {
    Object.keys(layouts[from]).forEach((bp) => {
      layouts[from][bp] = layouts[from][bp].filter((i) => i.i !== id);
    });
  }
  const item = target || { x: 0, y: Infinity, w: 1, h: 1 };
  Object.keys(layouts[to]).forEach((bp) => {
    layouts[to][bp] = [
      ...layouts[to][bp],
      { i: id, x: item.x, y: item.y, w: item.w, h: item.h },
    ];
  });
  const zoneById = { ...state.zoneById, [id]: to };
  setState({ layouts, zoneById });
}

export function resetAllLayouts() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(KEY_MAIN_WIDE);
    localStorage.removeItem(KEY_MAIN_NARROW);
    localStorage.removeItem(KEY_TECH);
    localStorage.removeItem(KEY_ZONES);
  }
  setState({ layouts: defaultLayouts, zoneById: defaultZoneById });
}

export const zoneRefs = {
  mainWide: null,
  mainNarrow: null,
  techDrawer: null,
};
