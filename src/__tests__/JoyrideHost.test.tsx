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

describe('JoyrideHost', () => {
  it('restores sim speed when programmerStateChanged event is received', () => {
    (window as any).setSimSpeed = vi.fn();
    (window as any).getSimSpeed = vi.fn(() => 8);

    render(<JoyrideHost runOnFirstVisit={true} />);

    act(() => {
      joyrideCallback({
        status: STATUS.RUNNING,
        type: 'step:after',
        step: { target: "[data-tour='programmer']" },
        run: true,
      } as CallBackProps);
    });

    act(() => {
      const event = new CustomEvent('programmerStateChanged', { detail: { state: 'RUN_AUTO' } });
      window.dispatchEvent(event);
    });

    expect((window as any).setSimSpeed).toHaveBeenCalledWith(1);
  });
});