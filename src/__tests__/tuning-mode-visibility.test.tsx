import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App.jsx';
import { describe, it, expect } from 'vitest';

// Ensures tuning sliders appear only when tuning mode is ON

describe('Tuning Mode visibility', () => {
  function setup() {
    render(<App initialConfig={undefined} />);
    // Open technician drawer (contains tuning section)
    const techBtn = screen.getByRole('button', { name: /Technician/i });
    fireEvent.click(techBtn);
  }

  it('shows static values when OFF and sliders when ON', () => {
    setup();

    // Initially OFF -> static values visible, sliders absent
    expect(screen.getByTestId('tuning-static-values')).toBeInTheDocument();
    expect(screen.queryByTestId('tuning-sliders')).toBeNull();

    // Enable tuning mode
    const onBtn = screen.getByRole('button', { name: /^On$/i });
    fireEvent.click(onBtn);

    expect(screen.getByTestId('tuning-sliders')).toBeInTheDocument();
    expect(screen.queryByTestId('tuning-static-values')).toBeNull();

    // Turn it back Off
    const offBtn = screen.getByRole('button', { name: /^Off$/i });
    fireEvent.click(offBtn);

    expect(screen.getByTestId('tuning-static-values')).toBeInTheDocument();
    expect(screen.queryByTestId('tuning-sliders')).toBeNull();
  });
});
