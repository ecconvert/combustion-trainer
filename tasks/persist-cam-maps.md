---
name: Persist cam maps per fuel
about: Persist cam maps per fuel in localStorage
labels: type:task
---

## Goal

The goal of this task is to persist the cam maps for each fuel type in the browser's localStorage. This will allow users to save their tuning configurations and have them persist across sessions.

## Current State

The feature has been implemented in `src/App.jsx`. The `camMap` is now stored in `localStorage` in a single object under the key `ct_cam_maps_v1`, with nested objects for each fuel type.

## Subtasks

- [x] Modify `src/App.jsx` to save the `camMap` to localStorage whenever it changes.
- [x] Modify `src/App.jsx` to load the `camMap` from localStorage when the component mounts.
- [x] The `camMap` should be stored per fuel type. This means the key in localStorage should be something like `camMap_Natural_Gas`.

## Test plan

- [ ] Write a unit test to verify that the `camMap` is saved to localStorage when it changes.
- [ ] Write a unit test to verify that the `camMap` is loaded from localStorage when the component mounts.
- [ ] Write an end-to-end test to verify that the cam map persists across page reloads.

**Note:** The unit tests for this feature are currently failing with timeouts. A new task has been created to track the debugging of these tests: [Debug failing tests for Cam Map Persistence](./debug-failing-tests.md).

## Links

- DoD: /docs/DoD.md
- Related:
  - `src/App.jsx`
  - `src/lib/cam.js`
  - `tasks/debug-failing-tests.md`
