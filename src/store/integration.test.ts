import { describe, it, expect, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import uiReducer, { togglePanel } from './uiSlice';
import analyzerReducer, { startAnalyzer, stopAnalyzer } from './analyzerSlice';

describe('integration', () => {
  it('updates while collapsed', () => {
    vi.useFakeTimers();
    const store = configureStore({ reducer: { ui: uiReducer, analyzer: analyzerReducer } });
    store.dispatch<any>(startAnalyzer());
    store.dispatch(togglePanel('trendGraph'));
    vi.advanceTimersByTime(1500);
    store.dispatch<any>(stopAnalyzer());
    expect(store.getState().analyzer.trend.length).toBeGreaterThan(0);
  });
});
