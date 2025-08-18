import React from 'react';
import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AirDrawerIndicator from '../components/AirDrawerIndicator';

// Mock ResizeObserver, as it's not available in JSDOM
const mockResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', mockResizeObserver);

describe('AirDrawerIndicator', () => {
  let chamberRef;

  beforeEach(() => {
    // Use fake timers to control animations
    vi.useFakeTimers();
    chamberRef = { current: document.createElement('div') };
    vi.spyOn(chamberRef.current, 'getBoundingClientRect').mockReturnValue({
      width: 200,
      height: 200,
      top: 0,
      left: 0,
      right: 200,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({ width: 200, height: 200, top: 0, left: 0, right: 200, bottom: 200, x: 0, y: 0 }),
    });
  });

  afterEach(() => {
    // Restore real timers and mocks
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders null if chamberRef is not valid', () => {
    const { container } = render(<AirDrawerIndicator value={50} chamberRef={{ current: null }} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders an SVG when provided with a valid chamberRef', () => {
    render(<AirDrawerIndicator value={50} chamberRef={chamberRef} />);
    act(() => {
      // Advance timers to allow the animation to complete
      vi.advanceTimersByTime(700);
    });
    const svgElement = document.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('updates needle position when value prop changes', () => {
    const { rerender } = render(<AirDrawerIndicator value={0} chamberRef={chamberRef} />);
    act(() => {
      vi.advanceTimersByTime(700);
    });
    const polygon = document.querySelector('polygon');
    const initialPoints = polygon.getAttribute('points');

    rerender(<AirDrawerIndicator value={100} chamberRef={chamberRef} />);
    act(() => {
      vi.advanceTimersByTime(700);
    });
    const finalPoints = polygon.getAttribute('points');

    expect(initialPoints).not.toBe(finalPoints);
    expect(finalPoints).toBeDefined();
  });

  it('respects the flipDirection prop', () => {
    const { rerender } = render(<AirDrawerIndicator value={25} chamberRef={chamberRef} />);
    act(() => {
      vi.advanceTimersByTime(700);
    });
    const polygon = document.querySelector('polygon');
    const defaultPoints = polygon.getAttribute('points');

    rerender(<AirDrawerIndicator value={25} chamberRef={chamberRef} flipDirection={true} />);
    act(() => {
      vi.advanceTimersByTime(700);
    });
    const flippedPoints = polygon.getAttribute('points');

    expect(defaultPoints).not.toBe(flippedPoints);
  });

  it('respects custom angle props', () => {
    const { rerender } = render(<AirDrawerIndicator value={50} chamberRef={chamberRef} angleLow={180} angleHigh={300} />);
    act(() => {
      vi.advanceTimersByTime(700);
    });
    const polygon = document.querySelector('polygon');
    const defaultAnglePoints = polygon.getAttribute('points');

    rerender(<AirDrawerIndicator value={50} chamberRef={chamberRef} angleLow={90} angleHigh={270} />);
    act(() => {
      vi.advanceTimersByTime(700);
    });
    const customAnglePoints = polygon.getAttribute('points');

    expect(defaultAnglePoints).not.toBe(customAnglePoints);
  });
});
