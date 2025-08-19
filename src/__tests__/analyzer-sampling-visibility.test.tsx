import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App.jsx';
import { describe, it, expect } from 'vitest';

// Ensures the full SAMPLING help text is present and readable after inserting probe.

describe('Analyzer SAMPLING help visibility', () => {
  it('shows complete sampling help text after inserting probe', () => {
    render(<App initialConfig={undefined} />);

    const techBtn = screen.getByRole('button', { name: /Technician/i });
    fireEvent.click(techBtn);

    fireEvent.click(screen.getByRole('button', { name: /^Start$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Finish Zero/i }));

    const insertBtn = screen.getByRole('button', { name: /Insert Probe/i });
    fireEvent.click(insertBtn);

    const help = screen.getByTestId('analyzer-state-help');
    expect(help).toBeInTheDocument();
    expect(help.textContent).toMatch(/SAMPLING: Probe in flue; readings updating in real time/i);
  });
});
