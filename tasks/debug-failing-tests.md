---
name: Debug failing tests for Cam Map Persistence
about: The tests for the Cam Map Persistence feature are failing with timeouts.
labels: type:task, bug
---

## Goal

The goal of this task is to debug and fix the failing tests for the "Persist cam maps per fuel in localStorage" feature.

## Problem

The tests for this feature, located in `src/__tests__/controls.test.tsx`, are consistently failing with timeouts, even after increasing the timeout to 40 seconds. This indicates a potential infinite loop or a fundamental issue with the test logic or the component's state machine.

The `advanceToState` helper function, which is used to navigate the boiler's state machine, appears to be the source of the problem. It seems to get stuck and is unable to reach the `RUN_AUTO` state within the test environment.

## Failing Tests

Here is the code for the two failing tests:

```javascript
// In src/__tests__/controls.test.tsx

describe('Cam Map Persistence', () => {
    // ... helper functions ...

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
```

## Links

- DoD: /docs/DoD.md
- Related:
  - `src/__tests__/controls.test.tsx`
  - `src/App.jsx`
