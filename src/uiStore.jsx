import React, { createContext, useContext, useEffect, useState } from "react";

export const defaultConfig = {
  theme: "system",
  units: "imperial",
  sampleRate: 1,
  trendLength: 600,
};

const defaultState = {
  collapseMap: {},
  drawerOpen: false,
  layout: {},
  seriesVisibility: {
    O2: true,
    CO2: true,
    CO: true,
    NOx: true,
    StackTemp: true,
    Efficiency: true,
  },
  config: defaultConfig,
};

const UIContext = createContext({ state: defaultState, setState: () => {} });

export function UIProvider({ children }) {
  const [state, setState] = useState(defaultState);

  // Hydrate from localStorage on first load
  useEffect(() => {
    const layout = JSON.parse(localStorage.getItem("uiLayout_v1") || "{}");
    const config = JSON.parse(localStorage.getItem("app_config_v1") || "{}");
    const ui = JSON.parse(localStorage.getItem("ui_state_v1") || "{}");
    setState((s) => ({
      ...s,
      ...ui,
      layout,
      config: { ...defaultConfig, ...config },
    }));
  }, []);

  // Persist layout
  useEffect(() => {
    localStorage.setItem("uiLayout_v1", JSON.stringify(state.layout));
  }, [state.layout]);

  // Persist config
  useEffect(() => {
    localStorage.setItem("app_config_v1", JSON.stringify(state.config));
  }, [state.config]);

  // Persist other UI state
  useEffect(() => {
    const { collapseMap, drawerOpen, seriesVisibility } = state;
    localStorage.setItem(
      "ui_state_v1",
      JSON.stringify({ collapseMap, drawerOpen, seriesVisibility }),
    );
  }, [state.collapseMap, state.drawerOpen, state.seriesVisibility]);

  const resetLayout = () => {
    localStorage.removeItem("uiLayout_v1");
    setState((s) => ({ ...s, layout: {} }));
  };

  return (
    <UIContext.Provider value={{ state, setState, resetLayout }}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
