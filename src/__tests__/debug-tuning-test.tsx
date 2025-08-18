// Debug script for tuning mode test
import { test, expect } from 'vitest';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { vi } from 'vitest';
import App from '../App.jsx';

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
  return render(<App initialConfig={undefined} />);
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

test('debug tuning mode test', async () => {
  console.log('Starting debug test...');
  
  renderApp();
  console.log('App rendered');
  
  await advanceToState('RUN_AUTO');
  console.log('Advanced to RUN_AUTO state');
  
  // Debug: Check if tuning mode panel exists
  try {
    const tuningModePanel = screen.getByText('Tuning Mode');
    console.log('Found tuning mode text:', tuningModePanel);
    
    const card = tuningModePanel.closest('.card');
    console.log('Found card:', card);
    
    if (!card) throw new Error('Card not found');
    
    // Debug: Check if buttons exist
    const buttons = within(card as HTMLElement).getAllByRole('button');
    console.log('Found buttons:', buttons.map(b => b.textContent));
    
    // Try to find the On button
    const onButton = within(card as HTMLElement).getByRole('button', { name: 'On' });
    console.log('Found On button:', onButton);
    
    // Click the On button
    await act(async () => {
      fireEvent.click(onButton);
    });
    console.log('Clicked On button');
    
    // Wait a moment for state update
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    
    // Debug: Check if sliders appear
    const fuelFlowSlider = screen.queryByLabelText('tuning fuel flow');
    const airFlowSlider = screen.queryByLabelText('tuning air flow');
    
    console.log('Fuel flow slider:', fuelFlowSlider);
    console.log('Air flow slider:', airFlowSlider);
    
    if (fuelFlowSlider && airFlowSlider) {
      console.log('SUCCESS: Both sliders found!');
    } else {
      console.log('FAILURE: Sliders not found');
      // Let's see what's on the screen
      screen.debug();
    }
    
  } catch (error) {
    console.error('Error in debug test:', error);
    console.log('Screen content:');
    screen.debug();
    throw error;
  }
}, 10000);
