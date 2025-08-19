import { vi } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import JoyrideHost from '../tour/JoyrideHost';
import { CallBackProps, STATUS } from 'react-joyride';

let joyrideCallback: (data: CallBackProps) => void = () => {};

vi.mock('react-joyride', () => ({
  __esModule: true,
  default: (props: any) => {
    joyrideCallback = props.callback;
    return <div data-testid="joyride-host-instance" />;
  },
  STATUS: { RUNNING: 'running' },
}));

describe('JoyrideHost - Firing Rate Demo', () => {
  beforeEach(() => {
    // Mock the required window functions
    (window as any).setRheostat = vi.fn();
    (window as any).setSimSpeed = vi.fn();
    (window as any).getSimSpeed = vi.fn(() => 1);
    
    // Clear any existing cleanup function
    delete (window as any).__cleanupFiringRateDemo;
    
    // Mock setTimeout and setInterval for testing
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
    
    // Clean up any remaining firing rate demo
    if ((window as any).__cleanupFiringRateDemo) {
      (window as any).__cleanupFiringRateDemo();
      delete (window as any).__cleanupFiringRateDemo;
    }
  });

  it('starts firing rate ramping demonstration when firing-rate step is shown', () => {
    render(<JoyrideHost runOnFirstVisit={true} />);

    act(() => {
      joyrideCallback({
        status: STATUS.RUNNING,
        type: 'step:after',
        step: { target: "[data-tour='firing-rate']" },
        run: true,
      } as CallBackProps);
    });

    // Should set initial firing rate to 20%
    expect((window as any).setRheostat).toHaveBeenCalledWith(20);
    expect((window as any).__cleanupFiringRateDemo).toBeDefined();
  });

  it('ramps firing rate up and down during demonstration', () => {
    render(<JoyrideHost runOnFirstVisit={true} />);

    act(() => {
      joyrideCallback({
        status: STATUS.RUNNING,
        type: 'step:after',
        step: { target: "[data-tour='firing-rate']" },
        run: true,
      } as CallBackProps);
    });

    // Fast-forward through several intervals to see ramping
    act(() => {
      vi.advanceTimersByTime(800); // First increment: 20% -> 25%
    });
    expect((window as any).setRheostat).toHaveBeenCalledWith(25);

    act(() => {
      vi.advanceTimersByTime(800); // Second increment: 25% -> 30%
    });
    expect((window as any).setRheostat).toHaveBeenCalledWith(30);

    // Continue to see it reach the peak at 60%
    act(() => {
      vi.advanceTimersByTime(800 * 6); // Should reach 60%
    });
    expect((window as any).setRheostat).toHaveBeenCalledWith(60);
  });

  it('settles at 30% after completing ramping cycles', () => {
    render(<JoyrideHost runOnFirstVisit={true} />);

    act(() => {
      joyrideCallback({
        status: STATUS.RUNNING,
        type: 'step:after',
        step: { target: "[data-tour='firing-rate']" },
        run: true,
      } as CallBackProps);
    });

    // Fast-forward through complete demo cycles (2 full ramps)
    act(() => {
      vi.advanceTimersByTime(800 * 32); // Complete both ramp cycles
    });

    // Should settle at 30% after a delay
    act(() => {
      vi.advanceTimersByTime(500);
    });
    
    expect((window as any).setRheostat).toHaveBeenCalledWith(30);
  });

  it('cleans up firing rate demo when tour is finished', () => {
    render(<JoyrideHost runOnFirstVisit={true} />);

    // Start the firing rate demo
    act(() => {
      joyrideCallback({
        status: STATUS.RUNNING,
        type: 'step:after',
        step: { target: "[data-tour='firing-rate']" },
        run: true,
      } as CallBackProps);
    });

    expect((window as any).__cleanupFiringRateDemo).toBeDefined();

    // Finish the tour
    act(() => {
      joyrideCallback({
        status: STATUS.FINISHED,
        type: 'tour:end',
        run: false,
      } as CallBackProps);
    });

    expect((window as any).__cleanupFiringRateDemo).toBeUndefined();
  });

  it('cleans up firing rate demo when tour is closed', () => {
    render(<JoyrideHost runOnFirstVisit={true} />);

    // Start the firing rate demo
    act(() => {
      joyrideCallback({
        status: STATUS.RUNNING,
        type: 'step:after',
        step: { target: "[data-tour='firing-rate']" },
        run: true,
      } as CallBackProps);
    });

    expect((window as any).__cleanupFiringRateDemo).toBeDefined();

    // Close the tour
    act(() => {
      joyrideCallback({
        status: STATUS.RUNNING,
        type: 'close',
        action: 'close',
        run: true,
      } as CallBackProps);
    });

    expect((window as any).__cleanupFiringRateDemo).toBeUndefined();
  });
});