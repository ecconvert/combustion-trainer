import { beforeEach, describe, expect, test, vi } from 'vitest';

// Keys used by the layout store
const KEY_MAIN_WIDE = 'uiLayout_v2_mainWide';
const KEY_MAIN_NARROW = 'uiLayout_v2_mainNarrow';
const KEY_TECH = 'uiLayout_v2_tech';
const KEY_ZONES = 'uiLayout_v2_zones';

// Helper to import fresh module state each test
async function loadStore() {
  vi.resetModules();
  return await import('../layout/store.js');
}

beforeEach(() => {
  localStorage.clear();
});

describe('layout store persistence', () => {
  test('resetAllLayouts repopulates defaults in localStorage', async () => {
    // Seed some fake values
    localStorage.setItem(KEY_MAIN_WIDE, JSON.stringify({ lg: [{ i: 'x', x: 0, y: 0, w: 1, h: 1 }] }));
    localStorage.setItem(KEY_ZONES, JSON.stringify({ analyzer: 'techDrawer' }));

    const { resetAllLayouts } = await loadStore();
    resetAllLayouts();

  const mainWide = JSON.parse(localStorage.getItem(KEY_MAIN_WIDE) || '{}');
  const mainNarrow = JSON.parse(localStorage.getItem(KEY_MAIN_NARROW) || '{}');
  const tech = JSON.parse(localStorage.getItem(KEY_TECH) || '{}');
  const zones = JSON.parse(localStorage.getItem(KEY_ZONES) || '{}');

  // Expect default-like shapes
  expect(mainWide.lg?.length).toBeGreaterThan(0);
  expect(mainNarrow.lg?.length).toBeGreaterThan(0);
  expect(tech.lg?.length).toBeGreaterThan(0);
  expect(Object.keys(zones).length).toBeGreaterThan(0);
  });

  test('moveAcrossZones writes updated layouts and zones to localStorage', async () => {
    const { moveAcrossZones } = await loadStore();

    // Move analyzer into mainWide and ensure it persists
    moveAcrossZones('analyzer', undefined, 'mainWide', { x: 0, y: 0, w: 2, h: 2 });

    const zones = JSON.parse(localStorage.getItem(KEY_ZONES) || '{}');
    expect(zones.analyzer).toBe('mainWide');

    const mainWide = JSON.parse(localStorage.getItem(KEY_MAIN_WIDE) || '{}');
    const hasAnalyzer = Object.values(mainWide as any)
      .flat()
      .some((it: any) => it.i === 'analyzer');
    expect(hasAnalyzer).toBe(true);
  });
});
