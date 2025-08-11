import { createContext, useContext, useEffect, useState } from 'react';

// Global GUI state for collapsible panels, drawer and layout
const GuiContext = createContext();

export function GuiProvider({ children }) {
  // map of panel id -> collapsed boolean
  const [collapseMap, setCollapseMap] = useState({});
  // right side drawer open state
  const [drawerOpen, setDrawerOpen] = useState(false);
  // series visibility for trend displays
  const [seriesVisibility, setSeriesVisibility] = useState({
    O2: true,
    CO2: true,
    CO: true,
    NOx: true,
    StackF: true,
    Eff: true,
  });
  // responsive layout positions keyed by breakpoint
  const [layout, setLayout] = useState(() => {
    try {
      const saved = localStorage.getItem('uiLayout_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // persist layout to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('uiLayout_v1', JSON.stringify(layout));
    } catch {
      /* ignore */
    }
  }, [layout]);

  const resetLayout = () => {
    setLayout({});
    try {
      localStorage.removeItem('uiLayout_v1');
    } catch {
      /* ignore */
    }
  };

  return (
    <GuiContext.Provider
      value={{
        collapseMap,
        setCollapseMap,
        drawerOpen,
        setDrawerOpen,
        layout,
        setLayout,
        resetLayout,
        seriesVisibility,
        setSeriesVisibility,
      }}
    >
      {children}
    </GuiContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useGui() {
  return useContext(GuiContext);
}

