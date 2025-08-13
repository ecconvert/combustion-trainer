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

describe('Power and Firing Rate Controls', () => {
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

        let currentState = '';
        let attempts = 0;
        const maxAttempts = 15;

        act(() => { vi.advanceTimersByTime(200); });

        while (currentState !== targetState && attempts < maxAttempts) {
            currentState = getProgrammerState();
            if (currentState === targetState) break;

            if (currentState === 'PTFI') {
                act(() => { vi.advanceTimersByTime(2000); });
            }

            act(() => {
              fireEvent.click(advanceButton);
            });

            await act(async () => {
                await vi.advanceTimersByTimeAsync(200);
            });

            attempts++;
        }

        if (attempts >= maxAttempts) {
            throw new Error(`Failed to reach state ${targetState}. Current state: ${getProgrammerState()}`);
        }
    };

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
