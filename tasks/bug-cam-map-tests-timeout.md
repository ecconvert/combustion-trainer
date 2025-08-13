---
name: Bug - Cam Map Persistence tests are timing out
about: The tests for Cam Map Persistence are failing with timeouts, blocking further testing.
labels: type:bug, priority:high
---

## Goal

To fix the failing tests for the "Persist cam maps per fuel in localStorage" feature, which are currently timing out.

## Problem Description

The tests for Cam Map Persistence, located in `src/__tests__/controls.test.tsx`, consistently fail with a `Test timed out` error. This occurs even after increasing the test timeout to 40 seconds. The issue seems to be that the application's state machine does not progress to the `RUN_AUTO` state within the test environment, causing the `advanceToState` test helper to time out.

This bug is blocking the verification of the cam map persistence feature and potentially other features that rely on the state machine in tests.

## Failing Tests

The following tests in `src/__tests__/controls.test.tsx` are failing:
- `Cam Map Persistence > should save and load cam map for a single fuel`
- `Cam Map Persistence > should keep cam maps separate for different fuels`

### Error Output
```
FAIL  src/__tests__/controls.test.tsx > Cam Map Persistence > should save and load cam map for a single fuel
FAIL  src/__tests__/controls.test.tsx > Cam Map Persistence > should keep cam maps separate for different fuels
Error: Test timed out in 40000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
```

## Investigation Summary

An extensive investigation was performed to resolve this issue. The following steps were taken:

1.  **Added Missing Tests**: The "Cam Map Persistence" tests were initially missing from the codebase and were added based on the description in `tasks/debug-failing-tests.md`.
2.  **Fixed Unrelated Test**: A separate failing test in `src/__tests__/csv-export.test.ts` was identified and fixed.
3.  **Refactored `App.jsx` State Machine**: The main `useEffect` hook managing the state machine in `src/App.jsx` was refactored to use `useRef` for its dependencies. This was done to prevent the `setInterval` from being reset on every render, which was a likely cause of the state machine getting stuck.
4.  **Refactored `advanceToState` Test Helper**: The `advanceToState` function in `src/__tests__/controls.test.tsx` was rewritten from a `while` loop to use the more robust `waitFor` utility from `@testing-library/react`.

Despite these changes, the timeout issue persists. The root cause is likely a subtle interaction between Vitest's fake timers and the application's `setInterval`-based logic that has not yet been identified.

## Related Files
- `src/__tests__/controls.test.tsx` (contains the failing tests)
- `src/App.jsx` (contains the state machine logic)
- `tasks/debug-failing-tests.md` (original task description)
