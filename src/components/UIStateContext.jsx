/* eslint react-refresh/only-export-components: "off" */
import React, { createContext, useContext, useEffect, useState } from "react";

const UIStateContext = createContext(null);

export function UIStateProvider({ children }) {
  const [collapse, setCollapse] = useState({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [seriesVisibility, setSeriesVisibility] = useState({
    O2: true,
    CO2: true,
    CO: true,
    NOx: true,
    StackF: true,
    Eff: true,
  });
  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem("uiLayout_v1");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("uiLayout_v1", JSON.stringify(layout));
    } catch {
      // ignore
    }
  }, [layout]);

  return (
    <UIStateContext.Provider
      value={{
        collapse,
        setCollapse,
        drawerOpen,
        setDrawerOpen,
        seriesVisibility,
        setSeriesVisibility,
        layout,
        setLayout,
      }}
    >
      {children}
    </UIStateContext.Provider>
  );
}

export function useUIState() {
  const ctx = useContext(UIStateContext);
  if (!ctx) throw new Error("useUIState must be used within UIStateProvider");
  return ctx;
}
