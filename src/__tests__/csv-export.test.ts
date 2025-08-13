import { describe, expect, test, vi, beforeEach } from 'vitest';
import { downloadCSV } from '../lib/csv.js';

// JSDOM doesn't implement some URL and anchor behavior by default
beforeEach(() => {
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  } as any);
});

describe('downloadCSV', () => {
  test('creates a CSV blob and triggers anchor click', () => {
    const rows = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];

    const click = vi.fn();
    const createEl = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = document.createElementNS('http://www.w3.org/1999/xhtml', tag);
      (el as any).click = click;
      return el as any;
    });

    downloadCSV('t.csv', rows);

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();

    // Cleanup spy
    createEl.mockRestore();
  });

  test('no-op on empty rows', () => {
    const click = vi.fn();
    const createEl = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = document.createElementNS('http://www.w3.org/1999/xhtml', tag);
      (el as any).click = click;
      return el as any;
    });

    downloadCSV('t.csv', []);

    expect(click).not.toHaveBeenCalled();
    createEl.mockRestore();
  });
});
