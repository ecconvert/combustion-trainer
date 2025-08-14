import React from 'react';
import { render, fireEvent, act, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CombustionTrainer from '../App.jsx';
import { UIStateProvider } from '../components/UIStateContext';
import { expect, describe, test, vi, beforeEach, afterEach } from 'vitest';
import { FUELS } from '../lib/fuels.js';

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

const renderApp = () => {
    return render(
        <UIStateProvider>
            <CombustionTrainer />
        </UIStateProvider>
    );
};

const getProgrammerState = () => {
    const programmerPanel = screen.getByText('Programmer (EP160)').closest('.digital-panel');
    if (!programmerPanel) throw new Error('Programmer panel not found');
    const stateDisplay = within(programmerPanel as HTMLElement).getByText(/State:/);
    const stateValueSpan = stateDisplay.querySelector('.digital-readout');
    if (!stateValueSpan) throw new Error("Could not find state value span");
    return stateValueSpan.textContent;
};

const advanceToState = async (targetState) => {
    const advanceButton = screen.getByText('Advance');
    await act(async () => { await vi.advanceTimersByTimeAsync(250); });
    for (let i = 0; i < 20 && getProgrammerState() !== targetState; i++) {
        fireEvent.click(advanceButton);
        // eslint-disable-next-line no-await-in-loop
        await act(async () => Promise.resolve());
    }
    const finalState = getProgrammerState();
    if (finalState !== targetState) {
        throw new Error(`advanceToState failed: expected ${targetState} got ${finalState}`);
    }
};

describe('Fuel Selector', () => {
    test('should update fuel-specific data when a new fuel is selected', async () => {
        renderApp();
        await advanceToState('RUN_AUTO');

        const fuelSelector = screen.getByLabelText('fuel selector');
        const controlsPanel = screen.getByTestId('panel-controls');
        const readoutsPanel = screen.getByTestId('panel-readouts');

        // 1. Check initial state (Natural Gas)
        const initialHhvText = `HHV: ${FUELS['Natural Gas'].HHV.toLocaleString()} Btu/${FUELS['Natural Gas'].unit}`;
        expect(within(controlsPanel).getByText(initialHhvText)).toBeInTheDocument();

        // Get initial readout for comparison
        const initialExcessAir = within(readoutsPanel).getByText(/Excess Air/).nextElementSibling.textContent;

        // 2. Change fuel to Fuel Oil #2
        await act(async () => {
            fireEvent.change(fuelSelector, { target: { value: 'Fuel Oil #2' } });
        });

        // Let effects run
        await act(async () => { await vi.advanceTimersByTimeAsync(500); });

        // 3. Verify UI updates for the new fuel
        const newHhvText = `HHV: ${FUELS['Fuel Oil #2'].HHV.toLocaleString()} Btu/${FUELS['Fuel Oil #2'].unit}`;
        expect(within(controlsPanel).getByText(newHhvText)).toBeInTheDocument();

        // 4. Verify chemistry calculation has changed
        const newExcessAir = within(readoutsPanel).getByText(/Excess Air/).nextElementSibling.textContent;
        expect(newExcessAir).not.toEqual(initialExcessAir);
    }, 20000);
});
