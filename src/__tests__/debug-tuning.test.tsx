// Debug script for tuning mode test
import { test, expect } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App.jsx';
import { UIStateProvider } from '../components/UIStateContext';

// Mock implementations
vi.mock('../lib/config.js', () => ({
  getDefaultConfig: () => ({
    general: { trendLength: 300 },
    analyzer: { samplingSec: 1.0, autostart: false },
    units: { temperature: 'F', pressure: 'inWC' },
    ambient: { temperature: 70, pressure: 14.7 },
    gauge: {},
    data: {}
  }),
}));

const renderApp = () => {
  vi.useFakeTimers();
  return render(
    <UIStateProvider>
      <App initialConfig={undefined} />
    </UIStateProvider>
  );
};

const getProgrammerState = () => {
  const stateDisplay = screen.getByText(/programmer/i).parentElement;
  if (!stateDisplay) throw new Error("Could not find programmer display");
  const stateValueSpan = stateDisplay.querySelector('.digital-readout');
  if (!stateValueSpan) throw new Error("Could not find state value span");
  return stateValueSpan.textContent;
};

const advanceToState = async (targetState) => {
  const advanceButton = screen.getByText('Advance');
  await act(async () => { await vi.advanceTimersByTimeAsync(250); });
  for (let i = 0; i < 20 && getProgrammerState() !== targetState; i++) {
    fireEvent.click(advanceButton);
    await act(async () => Promise.resolve());
  }
  const finalState = getProgrammerState();
  if (finalState !== targetState) {
    throw new Error(`advanceToState failed: expected ${targetState} got ${finalState}`);
  }
};

test('debug tuning mode MIN/MAX test', async () => {
  console.log('Starting MIN/MAX debug test...');
  
  renderApp();
  await advanceToState('RUN_AUTO');
  
  // Click tuning mode On
  const tuningModePanel = screen.getByText('Tuning Mode').closest('.card');
  if (!tuningModePanel) throw new Error('Tuning mode panel not found');
  const onButton = within(tuningModePanel as HTMLElement).getByRole('button', { name: 'On' });
  fireEvent.click(onButton);
  
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  
  const fuelFlowSlider = screen.getByLabelText('tuning fuel flow');
  console.log('Found fuel flow slider');
  
  // Check the slider's min and max attributes
  console.log('Slider min:', fuelFlowSlider.getAttribute('min'));
  console.log('Slider max:', fuelFlowSlider.getAttribute('max'));
  console.log('Current value:', fuelFlowSlider.getAttribute('value'));
  
  // Try to set to minimum value (which should be 2, not 0)
  console.log('Setting to minimum value...');
  fireEvent.input(fuelFlowSlider, { target: { value: '2' } });
  
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  
  let minWarning = screen.queryByText('MIN');
  console.log('MIN warning found after setting to 2:', !!minWarning);
  
  // Try to set to below minimum
  console.log('Setting to below minimum (0)...');
  fireEvent.input(fuelFlowSlider, { target: { value: '0' } });
  
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  
  minWarning = screen.queryByText('MIN');
  console.log('MIN warning found after setting to 0:', !!minWarning);
  console.log('Current slider value after setting to 0:', fuelFlowSlider.getAttribute('value'));
  
  // Try to set to maximum value
  console.log('Setting to maximum value (18)...');
  fireEvent.input(fuelFlowSlider, { target: { value: '18' } });
  
  await act(async () => {
    await vi.advanceTimersByTimeAsync(100);
  });
  
  let maxWarning = screen.queryByText('MAX');
  console.log('MAX warning found after setting to 18:', !!maxWarning);
  console.log('Current slider value after setting to 18:', fuelFlowSlider.getAttribute('value'));
  
}, 10000);
