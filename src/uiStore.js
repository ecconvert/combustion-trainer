import React, { createContext, useContext, useEffect, useState } from 'react';

const defaultConfig = {
  theme: 'system',
  units: 'imperial',
  samplingRate: 1,
  trendLength: 600,
};

const defaultSeries = {
  O2: true,
  CO2: true,
  CO: true,
  NOx: true,
  StackTemp: true,
  Efficiency: true,
};

const UIContext = createContext();

export function UIProvider({ children }) {
  const [collapseMap, setCollapseMap] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [layout, setLayout] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('uiLayout_v1')) || {};
    } catch {
      return {};
    }
  });
  const [seriesVisibility, setSeriesVisibility] = useState(defaultSeries);
  const [config, setConfig] = useState(() => {
    try {
      return { ...defaultConfig, ...JSON.parse(localStorage.getItem('app_config_v1') || '{}') };
    } catch {
      return defaultConfig;
    }
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('uiLayout_v1', JSON.stringify(layout));
    } catch {
      /* ignore */
    }
  }, [layout]);

  useEffect(() => {
    try {
      localStorage.setItem('app_config_v1', JSON.stringify(config));
    } catch {
      /* ignore */
    }
  }, [config]);

  const value = {
    collapseMap,
    setCollapse: (id, v) => setCollapseMap((m) => ({ ...m, [id]: v })),
    drawerOpen,
    setDrawerOpen,
    layout,
    setLayout,
    resetLayout: () => {
      setLayout({});
      try {
        localStorage.removeItem('uiLayout_v1');
      } catch {
        /* ignore */
      }
    },
    seriesVisibility,
    setSeriesVisibility,
    config,
    setConfig,
    settingsOpen,
    setSettingsOpen,
  };
  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export const useUIStore = () => useContext(UIContext);
export const defaultAppConfig = defaultConfig;
export const defaultSeriesVisibility = defaultSeries;
