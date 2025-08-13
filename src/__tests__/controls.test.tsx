import React from 'react';
import { render, fireEvent, act, screen, within, waitFor } from '@testing-library/react';
import CombustionTrainer from '../App';
import { UIStateProvider } from '../components/UIStateContext';
import { expect, describe, test, vi, beforeEach, afterEach } from 'vitest';

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
    const stateDisplay = within(programmerPanel).getByText(/State:/);
    const stateValueSpan = stateDisplay.querySelector('.digital-readout');
    if (!stateValueSpan) throw new Error("Could not find state value span");
    return stateValueSpan.textContent;
};

const advanceToState = async (targetState) => {
    const advanceButton = screen.getByText('Advance');

    // Initial advance to kick things off
    await act(async () => {
        await vi.advanceTimersByTimeAsync(200);
    });

    await waitFor(async () => {
        const currentState = getProgrammerState();
        if (currentState !== targetState) {
            fireEvent.click(advanceButton);
            // Give React time to process state update and re-render
            await vi.advanceTimersByTimeAsync(500);
        }
        // The expectation will be retried by waitFor until it passes or times out.
        expect(getProgrammerState()).toBe(targetState);
    }, {
        timeout: 10000, // Increased timeout for the whole process
        onTimeout: (err) => {
            err.message = `advanceToState timed out waiting for state '${targetState}'. Current state: '${getProgrammerState()}'`;
            return err;
        }
    });
};

describe('Power and Firing Rate Controls', () => {
    test('should turn the boiler off and trigger post-purge from RUN_AUTO state', async () => {
        renderApp();
        await advanceToState('RUN_AUTO');
        expect(getProgrammerState()).toBe('RUN_AUTO');

        const boilerPowerPanel = screen.getByText('Boiler Power').parentElement;
        const offButton = within(boilerPowerPanel).getByRole('button', { name: 'Off' });
        fireEvent.click(offButton);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(200);
        });

        expect(getProgrammerState()).toBe('POSTPURGE');

    }, 20000);

    test('should have firing rate slider disabled when not in RUN_AUTO state', async () => {
        renderApp();
        await act(async () => {
            await vi.advanceTimersByTimeAsync(200);
        });
        expect(getProgrammerState()).toBe('DRIVE_HI');
        const firingRateSlider = screen.getByLabelText('firing rate');
        expect(firingRateSlider).toBeDisabled();
    });

    test('should enable firing rate slider in RUN_AUTO state and update flows', async () => {
        renderApp();
        await advanceToState('RUN_AUTO');

        // Switch to real timers for user interaction + effects/RAF
        vi.useRealTimers();

        const firingRateSlider = screen.getByLabelText('firing rate');
        expect(firingRateSlider).toBeEnabled();

        const controlsPanel = screen.getByTestId('panel-controls');
        const fuelFlowValue = () => {
            const label = within(controlsPanel).getByText(/Fuel Flow/i);
            const container = label.closest('[data-flow-row]') ?? label.parentElement;
            if (!container) {
                throw new Error('Fuel flow value container not found');
            }
            const el = container.querySelector('.value') ?? container.querySelector('.digital-readout');
            if (!el) {
                throw new Error('Fuel flow value element not found');
            }
            return parseFloat(el.textContent ?? '');
        };

        const initialFuelFlow = fuelFlowValue();

        await act(async () => {
            fireEvent.input(firingRateSlider, { target: { value: '50' } });
        });

        await screen.findByText(/50%/);

        await waitFor(() => {
            const newFuelFlow = fuelFlowValue();
            expect(newFuelFlow).not.toBeNaN();
            expect(newFuelFlow).not.toEqual(initialFuelFlow);
            // Generous tolerance; adjust if mapping changes
            expect(newFuelFlow).toBeCloseTo(10, 1);
        }, { timeout: 5000 });
    }, 20000);
});

describe('Cam Map Persistence', () => {
    test('should save and load cam map for a single fuel', async () => {
        const { unmount } = renderApp();
        await advanceToState('RUN_AUTO');

        const tuningModePanel = screen.getByText('Tuning Mode').closest('.card');
        await act(async () => {
            const tuningOnButton = within(tuningModePanel).getByRole('button', { name: 'On' });
            fireEvent.click(tuningOnButton);
        });

        await act(async () => {
            const setCamButton = screen.getByRole('button', { name: /Set 0%/i });
            fireEvent.click(setCamButton);
        });

        const camMapKey = 'ct_cam_maps_v1';
        const storedCamMap = JSON.parse(localStorage.getItem(camMapKey));
        expect(storedCamMap.Natural_Gas['0']).toBeDefined();

        unmount();
        renderApp();

        await advanceToState('RUN_AUTO');

        const tuningModePanel2 = screen.getByText('Tuning Mode').closest('.card');
        await act(async () => {
            const tuningOnButton2 = within(tuningModePanel2).getByRole('button', { name: 'On' });
            fireEvent.click(tuningOnButton2);
        });

        const savedPill = await screen.findByText(/Saved: F/);
        expect(savedPill).toBeInTheDocument();
    }, 40000);

    test('should keep cam maps separate for different fuels', async () => {
        renderApp();
        await advanceToState('RUN_AUTO');

        // Set a cam point for Natural Gas
        const tuningModePanel = screen.getByText('Tuning Mode').closest('.card');
        await act(async () => {
            const tuningOnButton = within(tuningModePanel).getByRole('button', { name: 'On' });
            fireEvent.click(tuningOnButton);
        });
        await act(async () => {
            const setCamButtonNG = screen.getByRole('button', { name: /Set 0%/i });
            fireEvent.click(setCamButtonNG);
        });

        // Switch to Propane
        const fuelSelector = screen.getByLabelText('fuel selector');
        await act(async () => {
            fireEvent.change(fuelSelector, { target: { value: 'Propane' } });
        });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(200);
        });

        // Check that there is no saved pill
        const savedPill = screen.queryByText(/Saved: F/);
        expect(savedPill).not.toBeInTheDocument();

        // Set a cam point for Propane at 10%
        const rheostat = screen.getByLabelText('firing rate');
        await act(async () => {
            fireEvent.input(rheostat, { target: { value: '10' } });
        });

        await act(async () => {
            const setCamButtonPropane = screen.getByRole('button', { name: /Set 10%/i });
            fireEvent.click(setCamButtonPropane);
        });

        const savedPillPropane = await screen.findByText(/Saved: F/);
        expect(savedPillPropane).toBeInTheDocument();

        // Switch back to Natural Gas
        await act(async () => {
            fireEvent.change(fuelSelector, { target: { value: 'Natural Gas' } });
        });

        await act(async () => {
            await vi.advanceTimersByTimeAsync(200);
        });

        // set rheostat back to 0
        await act(async () => {
            fireEvent.input(rheostat, { target: { value: '0' } });
        });

        const savedPillNG = await screen.findByText(/Saved: F/);
        expect(savedPillNG).toBeInTheDocument();
    }, 40000);
});
