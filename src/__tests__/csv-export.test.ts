import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { downloadCSV } from '../lib/csv.js';

// JSDOM doesn't implement some URL and anchor behavior by default
beforeEach(() => {
  vi.stubGlobal('URL', {
    createObjectURL: vi.fn(() => 'blob:mock'),
    revokeObjectURL: vi.fn(),
  } as any);
});

describe('downloadCSV', () => {
  let click: vi.Mock;
  let createEl: vi.SpyInstance;

  beforeEach(() => {
    click = vi.fn();
    createEl = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = document.createElementNS('http://www.w3.org/1999/xhtml', tag);
      (el as any).click = click;
      return el as any;
    });
  });

  afterEach(() => {
    createEl.mockRestore();
  });

  test('creates a CSV blob, asserts content, and triggers anchor click', async () => {
    const rows = [
      { a: 1, b: 2 },
      { a: 3, b: 4 },
    ];

    downloadCSV('t.csv', rows);

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();

    // Assert the blob's content to ensure correct CSV formatting
    const blob = (URL.createObjectURL as vi.Mock).mock.calls[0][0] as Blob;
    const csvContent = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsText(blob);
    });
    expect(csvContent).toBe('a,b\n1,2\n3,4');
  });

  test('no-op on empty rows', () => {
    downloadCSV('t.csv', []);
    expect(click).not.toHaveBeenCalled();
  });
});
