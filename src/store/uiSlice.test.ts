import { describe, it, expect } from 'vitest';
import uiReducer, { togglePanel, openDrawer, closeDrawer } from './uiSlice';

describe('uiSlice', () => {
  it('toggles panels', () => {
    const state = uiReducer(undefined, { type: 'init' });
    const next = uiReducer(state, togglePanel('flows'));
    expect(next.panels.flows).toBe(true);
  });

  it('opens and closes drawer', () => {
    let state = uiReducer(undefined, openDrawer());
    expect(state.drawerOpen).toBe(true);
    state = uiReducer(state, closeDrawer());
    expect(state.drawerOpen).toBe(false);
  });
});
