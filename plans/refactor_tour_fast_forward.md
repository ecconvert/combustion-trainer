# Feature Implementation Plan: Refactor Tour Fast-Forward

## 📋 Todo Checklist
- [ ] Refactor `JoyrideHost.tsx` to use an event-driven approach for fast-forward.
- [ ] Update `App.jsx` to dispatch a custom event when the programmer state changes.
- [ ] Update `e2e/tour-fast-forward.spec.ts` to use the new event-driven approach.
- [ ] Update `e2e/utils.ts` to remove the polling logic from `fastForwardToRunAuto`.
- [ ] Update `src/__tests__/tour-fast-forward.test.tsx` to use the new event-driven approach.
- [ ] Final Review and Testing

## 🔍 Analysis & Investigation

### Codebase Structure
- `src/tour/JoyrideHost.tsx`: The main component for the tour logic.
- `src/App.jsx`: The main application component, where the programmer state is managed.
- `e2e/tour-fast-forward.spec.ts`: The end-to-end test for the fast-forward feature.
- `e2e/utils.ts`: Utility functions for the end-to-end tests.
- `src/__tests__/tour-fast-forward.test.tsx`: The unit test for the fast-forward feature.

### Current Architecture
The current implementation uses polling (`requestAnimationFrame` and `setInterval`) to check for the programmer's state, which is inefficient and makes the tests slow and flaky. The logic is also tightly coupled to the global `window` object.

### Dependencies & Integration Points
The fast-forward feature is integrated with the `Joyride` library and the application's global state.

### Considerations & Challenges
- The main challenge will be to correctly implement the event-driven approach and ensure that the tour, the application, and the tests are all in sync.
- We need to be careful to clean up the event listeners to avoid memory leaks.

## 📝 Implementation Plan

### Prerequisites
- A good understanding of custom events in JavaScript.

### Step-by-Step Implementation
1. **Update `App.jsx` to dispatch a custom event**:
   - Files to modify: `src/App.jsx`
   - Changes needed:
     - In the `useEffect` hook that updates the programmer's state, dispatch a custom event named `programmerStateChanged` with the new state as the detail.
     - The event should be dispatched on the `window` object.

2. **Refactor `JoyrideHost.tsx` to use the custom event**:
   - Files to modify: `src/tour/JoyrideHost.tsx`
   - Changes needed:
     - Remove the `useEffect` hook that polls for the programmer's state.
     - Add a new `useEffect` hook that adds an event listener for the `programmerStateChanged` event.
     - When the event is received, check if the new state is `'RUN_AUTO'` and if the fast-forward mode is active. If so, restore the normal simulation speed.
     - Make sure to clean up the event listener in the `useEffect`'s cleanup function.

3. **Update `e2e/utils.ts` to remove polling**:
   - Files to modify: `e2e/utils.ts`
   - Changes needed:
     - In the `fastForwardToRunAuto` function, remove the `for` loop that polls for the programmer's state.
     - Instead, use `page.evaluate` to listen for the `programmerStateChanged` event.
     - The function should return a promise that resolves when the event is received and the state is `'RUN_AUTO'`.

4. **Update `e2e/tour-fast-forward.spec.ts` to use the new `fastForwardToRunAuto`**:
   - Files to modify: `e2e/tour-fast-forward.spec.ts`
   - Changes needed:
     - Update the test to use the new `fastForwardToRunAuto` function.
     - Remove the polling logic from the test.
     - The test should now be much faster and more reliable.

5. **Update `src/__tests__/tour-fast-forward.test.tsx` to use the new event-driven approach**:
    - Files to modify: `src/__tests__/tour-fast-forward.test.tsx`
    - Changes needed:
        - Dispatch the `programmerStateChanged` event manually to test the `JoyrideHost` component's response.
        - Remove any reliance on the polling mechanism.

### Testing Strategy
- Run the end-to-end tests to verify that the fast-forward feature still works as expected.
- Run the unit tests to verify that the `JoyrideHost` component is working correctly.
- Manually test the tour to ensure that the fast-forward feature is working as expected.

## 🎯 Success Criteria
- The fast-forward feature is implemented using an event-driven approach.
- The end-to-end tests are faster and more reliable.
- The code is cleaner and easier to understand.
