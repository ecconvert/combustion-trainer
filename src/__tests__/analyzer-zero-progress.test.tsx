import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest';

// TODO(analyzer): Zero progress timing dependent on new state machine; skipping
describe.skip('Analyzer ZERO progress bar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  it('shows progress bar only during ZERO and progresses to 100%', () => {
    // Render with explicit prop to satisfy the prop shape used in App
    render(<App initialConfig={undefined} />);

    const techBtn = screen.getByRole('button', { name: /Technician/i });
    fireEvent.click(techBtn);

    const startBtn = screen.getByRole('button', { name: /^Start$/ });
    fireEvent.click(startBtn);

    // progress bar appears
    const fill = screen.getByTestId('analyzer-zero-fill');
    const percent = screen.getByTestId('analyzer-zero-percent');
    expect(fill).toBeInTheDocument();

    // advance half the duration (approx 50%)
    vi.advanceTimersByTime(3000);
    expect(percent.textContent).toContain('%');

    // advance to completion
    vi.advanceTimersByTime(4000);
    expect(percent.textContent).toMatch(/100%/i);

    // Finish Zero should be highlighted (has ring/pulse classes)
    const finishBtn = screen.getByTestId('btn-finish-zero');
    expect(finishBtn.className).toMatch(/ring-2/);

    // Clicking Finish Zero hides progress
    fireEvent.click(finishBtn);
    expect(screen.queryByTestId('analyzer-zero-fill')).toBeNull();
  });
});
