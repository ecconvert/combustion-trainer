---
name: Add draft input
about: Add draft input and effect on stack losses
labels: type:task
---

## Goal

The goal of this task is to add a new input for "draft" and model its effect on stack losses.

## Current State

This feature is not yet implemented. There is no input for draft, and the stack loss calculation in `src/lib/chemistry.js` is simplified and does not account for draft.

## Subtasks

- [ ] Add a new input field for "draft" in the UI.
- [ ] Modify the `computeCombustion` function in `src/lib/chemistry.js` to take "draft" as a parameter.
- [ ] Update the stack loss calculation in `computeCombustion` to account for the effect of draft.

## Test plan

- [ ] Write a unit test to verify that the draft input affects the stack loss calculation.
- [ ] Write an end-to-end test to verify that the draft input can be changed in the UI and that it affects the displayed efficiency.

## Links

- DoD: /docs/DoD.md
- Related:
  - `src/App.jsx`
  - `src/lib/chemistry.js`
