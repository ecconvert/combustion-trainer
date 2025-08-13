import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import CombustionTrainer from '../App';
import { UIStateProvider } from '../components/UIStateContext';

function openSettings(utils: ReturnType<typeof render>) {
  const btn = utils.getByLabelText('Settings');
  act(() => {
    fireEvent.click(btn);
  });
}

describe('Settings menu interactions', () => {
  it('keeps focus while typing numbers in inputs', () => {
    const initialConfig = {
      general: { theme: 'system', defaultView: 'main', trendLength: 300 },
      analyzer: {}, units: {}, ambient: {}, data: {}, gauge: {},
    } as any;

    const utils = render(
      <UIStateProvider>
        <CombustionTrainer initialConfig={initialConfig} />
      </UIStateProvider>
    );

    openSettings(utils);

    const input = utils.getByLabelText('Trend length (samples)') as HTMLInputElement;
    input.focus();

    // Type sequence; focus should remain and value updates
    act(() => {
      fireEvent.change(input, { target: { value: '3' } });
      fireEvent.change(input, { target: { value: '30' } });
      fireEvent.change(input, { target: { value: '300' } });
    });

    expect(document.activeElement).toBe(input);
    expect(input.value).toBe('300');
  });

  it('renders a scrollable container for settings body', () => {
    const initialConfig2 = {
      general: { theme: 'system', defaultView: 'main', trendLength: 300 },
      analyzer: {}, units: {}, ambient: {}, data: {}, gauge: {},
    } as any;

    const utils = render(
      <UIStateProvider>
        <CombustionTrainer initialConfig={initialConfig2} />
      </UIStateProvider>
    );

    openSettings(utils);

    const dialog = utils.getByTestId('settings-dialog');
    const scroller = utils.getByTestId('settings-scroll');

    expect(dialog).toBeInTheDocument();
    expect(scroller).toBeInTheDocument();
    expect(scroller.className).toContain('overflow-y-auto');
  });
});
