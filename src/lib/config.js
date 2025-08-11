import { clamp } from "./math";

const defaultConfig = {
  general: {
    theme: "light",
    defaultView: "main",
    trendLength: 600,
  },
  analyzer: {
    samplingSec: 1,
    autostart: false,
    showZeroReminder: true,
  },
  units: {
    system: "imperial",
  },
  ambient: {
    live: false,
    defaultZip: "11215",
    baseUrl: "https://api.open-meteo.com/v1/forecast",
    zipGeoBaseUrl: "https://api.zippopotam.us/us",
  },
  data: {},
};

export function getDefaultConfig() {
  // Return a deep clone to avoid mutation of the default object
  return JSON.parse(JSON.stringify(defaultConfig));
}

export function validateConfig(partial = {}) {
  const base = getDefaultConfig();
  const cfg = {
    ...base,
    ...partial,
    general: { ...base.general, ...partial.general },
    analyzer: { ...base.analyzer, ...partial.analyzer },
    units: { ...base.units, ...partial.units },
    ambient: { ...base.ambient, ...partial.ambient },
    data: { ...base.data, ...partial.data },
  };

  // Clamp numeric fields to reasonable ranges
  cfg.general.trendLength = clamp(cfg.general.trendLength, 60, 10000);
  cfg.analyzer.samplingSec = clamp(cfg.analyzer.samplingSec, 0.2, 60);

  return cfg;
}

const STORAGE_KEY = "app_config_v1";

export function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return validateConfig(parsed);
  } catch {
    return null;
  }
}

export function saveConfig(cfg) {
  try {
    const valid = validateConfig(cfg);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(valid));
  } catch {
    // ignore
  }
}
