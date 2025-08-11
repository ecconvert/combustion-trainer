import { describe, it, expect, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import analyzerReducer, {
  pushReading,
  startAnalyzer,
  stopAnalyzer
} from './analyzerSlice';

describe('analyzerSlice', () => {
  it('pushes reading', () => {
    const state = analyzerReducer(undefined, { type: 'init' });
    const reading = {
      timestamp: 0,
      o2: 1,
      co2: 2,
      co: 3,
      nox: 4,
      stackTemp: 5
    };
    const next = analyzerReducer(state, pushReading(reading));
    expect(next.trend.length).toBe(1);
  });

  it('handles start and stop', () => {
    vi.useFakeTimers();
    const store = configureStore({ reducer: { analyzer: analyzerReducer } });
    store.dispatch<any>(startAnalyzer());
    vi.advanceTimersByTime(1100);
    store.dispatch<any>(stopAnalyzer());
    const { running, trend } = store.getState().analyzer;
    expect(running).toBe(false);
    expect(trend.length).toBeGreaterThan(0);
  });
});
