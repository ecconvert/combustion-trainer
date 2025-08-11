import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type PanelKey =
  | 'flows'
  | 'programmer'
  | 'fuelSelector'
  | 'trendGraph'
  | 'trendTable'
  | 'savedReadings'
  | 'ambient'
  | 'clockBoiler';

interface UIState {
  drawerOpen: boolean;
  panels: Record<PanelKey, boolean>;
  darkTheme: boolean;
}

const initialState: UIState = {
  drawerOpen: false,
  darkTheme: false,
  panels: {
    flows: false,
    programmer: true,
    fuelSelector: false,
    trendGraph: false,
    trendTable: false,
    savedReadings: false,
    ambient: false,
    clockBoiler: false
  }
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    togglePanel(state, action: PayloadAction<PanelKey>) {
      const key = action.payload;
      state.panels[key] = !state.panels[key];
    },
    setPanel(state, action: PayloadAction<{ key: PanelKey; open: boolean }>) {
      state.panels[action.payload.key] = action.payload.open;
    },
    openDrawer(state) {
      state.drawerOpen = true;
    },
    closeDrawer(state) {
      state.drawerOpen = false;
    },
    toggleDarkTheme(state) {
      state.darkTheme = !state.darkTheme;
    }
  }
});

export const {
  togglePanel,
  setPanel,
  openDrawer,
  closeDrawer,
  toggleDarkTheme
} = uiSlice.actions;

export default uiSlice.reducer;
