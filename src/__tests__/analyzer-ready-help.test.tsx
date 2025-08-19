import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App.jsx';

// Analyzer states flow: OFF -> ZERO -> READY -> SAMPLING -> HOLD
// We verify READY help text after finishing zero.

describe('Analyzer READY help text', () => {
  it('shows READY help message after zeroing', () => {
    render(<App />);

    const techBtn = screen.getByRole('button', { name: /Technician/i });
    fireEvent.click(techBtn);

    const startBtn = screen.getByRole('button', { name: /^Start$/ });
    fireEvent.click(startBtn); // ZERO

    const finishBtn = screen.getByRole('button', { name: /Finish Zero/i });
    fireEvent.click(finishBtn); // READY

    const help = screen.getByTestId('analyzer-state-help');
    expect(help.textContent).toMatch(/READY: Baseline captured/i);
  });
});
