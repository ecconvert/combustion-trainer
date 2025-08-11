import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './store';

export interface Reading {
  timestamp: number;
  o2: number;
  co2: number;
  co: number;
  nox: number;
  stackTemp: number;
}

interface AnalyzerState {
  running: boolean;
  interval: number;
  last?: Reading;
  trend: Reading[];
  seriesVisibility: {
    o2: boolean;
    co2: boolean;
    co: boolean;
    nox: boolean;
    stackTemp: boolean;
  };
  clockFuelFlow?: number;
}

const initialState: AnalyzerState = {
  running: false,
  interval: 1000,
  trend: [],
  seriesVisibility: {
    o2: true,
    co2: true,
    co: true,
    nox: true,
    stackTemp: true
  },
  clockFuelFlow: undefined
};

const analyzerSlice = createSlice({
  name: 'analyzer',
  initialState,
  reducers: {
    setRunning(state, action: PayloadAction<boolean>) {
      state.running = action.payload;
    },
    setIntervalMs(state, action: PayloadAction<number>) {
      state.interval = action.payload;
    },
    pushReading(state, action: PayloadAction<Reading>) {
      state.last = action.payload;
      state.trend.push(action.payload);
      if (state.trend.length > 300) state.trend.shift();
    },
    clearTrend(state) {
      state.trend = [];
    },
    toggleSeries(state, action: PayloadAction<keyof AnalyzerState['seriesVisibility']>) {
      const key = action.payload;
      state.seriesVisibility[key] = !state.seriesVisibility[key];
    },
    setClockFuelFlow(state, action: PayloadAction<number | undefined>) {
      state.clockFuelFlow = action.payload;
    }
  }
});

export const {
  setRunning,
  setIntervalMs,
  pushReading,
  clearTrend,
  toggleSeries,
  setClockFuelFlow
} = analyzerSlice.actions;

export default analyzerSlice.reducer;

let timer: ReturnType<typeof setInterval> | null = null;

export const startAnalyzer = () => (dispatch: AppDispatch, getState: () => RootState) => {
  const { interval } = getState().analyzer;
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    const reading: Reading = {
      timestamp: Date.now(),
      o2: 3 + Math.random() * 2,
      co2: 10 + Math.random() * 2,
      co: 5 + Math.random() * 5,
      nox: 20 + Math.random() * 5,
      stackTemp: 300 + Math.random() * 10
    };
    dispatch(pushReading(reading));
  }, interval);
  dispatch(setRunning(true));
};

export const stopAnalyzer = () => (dispatch: AppDispatch) => {
  if (timer) clearInterval(timer);
  timer = null;
  dispatch(setRunning(false));
};
