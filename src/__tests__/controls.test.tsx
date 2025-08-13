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

        const firingRateSlider = screen.getByLabelText('firing rate');
        expect(firingRateSlider).toBeEnabled();

        const controlsPanel = screen.getByTestId('panel-controls');
        const fuelFlowLabel = within(controlsPanel).getByText(/Fuel Flow/);
        const fuelFlowValueElement = fuelFlowLabel.nextElementSibling;
        const initialFuelFlow = parseFloat(fuelFlowValueElement.textContent);

        fireEvent.change(firingRateSlider, { target: { value: '50' } });

        await screen.findByText('50%');

        await waitFor(() => {
            const newFuelFlow = parseFloat(fuelFlowValueElement.textContent);
            expect(newFuelFlow).not.toEqual(initialFuelFlow);
            expect(newFuelFlow).toBeCloseTo(10, 1);
        });
    }, 20000);
});
