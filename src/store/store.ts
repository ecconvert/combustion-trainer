import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './uiSlice';
import analyzerReducer from './analyzerSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    analyzer: analyzerReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
