import React from 'react';
import { render, fireEvent, act, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import CombustionTrainer from '../App.jsx';
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
            <CombustionTrainer initialConfig={undefined} />
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
        await act(async () => Promise.resolve());
    }
    const finalState = getProgrammerState();
    if (finalState !== targetState) {
        throw new Error(`advanceToState failed: expected ${targetState} got ${finalState}`);
    }
};

// TODO(debug-original): Duplicates tuning slider coverage; skip during layout transition
describe.skip('Debug Tuning Mode Test', () => {
    test('should display sliders and min/max warnings when tuning mode is on', async () => {
        console.log('=== STARTING TEST ===');
        
        renderApp();
        console.log('✓ App rendered');
        
        await advanceToState('RUN_AUTO');
        console.log('✓ Advanced to RUN_AUTO state');

        const tuningModePanel = screen.getByText('Tuning Mode').closest('.card');
        if (!tuningModePanel) throw new Error('Tuning mode panel not found');
        console.log('✓ Found tuning mode panel');
        
        await act(async () => {
            const tuningOnButton = within(tuningModePanel as HTMLElement).getByRole('button', { name: 'On' });
            console.log('✓ Found On button, clicking...');
            fireEvent.click(tuningOnButton);
        });
        console.log('✓ Clicked On button');

        const fuelFlowSlider = screen.getByLabelText('tuning fuel flow');
        const airFlowSlider = screen.getByLabelText('tuning air flow');
        console.log('✓ Found both sliders');

        expect(fuelFlowSlider).toBeInTheDocument();
        expect(airFlowSlider).toBeInTheDocument();

        // Test fuel flow min
        console.log('Testing fuel flow min...');
        fireEvent.input(fuelFlowSlider, { target: { value: '0' } });
        console.log('✓ Set fuel flow to 0');
        
        let minWarning = await screen.findByText('MIN');
        console.log('✓ Found MIN warning');
        expect(minWarning).toBeInTheDocument();

        // Test fuel flow max
        console.log('Testing fuel flow max...');
        fireEvent.input(fuelFlowSlider, { target: { value: '18' } });
        console.log('✓ Set fuel flow to 18');
        
        let maxWarning = await screen.findByText('MAX');
        console.log('✓ Found MAX warning');
        expect(maxWarning).toBeInTheDocument();

        // Test air flow min
        console.log('Testing air flow min...');
        fireEvent.input(airFlowSlider, { target: { value: '0' } });
        console.log('✓ Set air flow to 0');
        
        let minWarnings = await screen.findAllByText('MIN');
        console.log('✓ Found MIN warnings:', minWarnings.length);
        expect(minWarnings.length).toBeGreaterThan(0);

        // Test air flow max
        console.log('Testing air flow max...');
        fireEvent.input(airFlowSlider, { target: { value: '200' } });
        console.log('✓ Set air flow to 200');
        
        let maxWarnings = await screen.findAllByText('MAX');
        console.log('✓ Found MAX warnings:', maxWarnings.length);
        expect(maxWarnings.length).toBeGreaterThan(0);
        
        console.log('=== TEST COMPLETED SUCCESSFULLY ===');
    }, 10000);
});
