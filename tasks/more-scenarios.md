---
name: More scenarios
about: More scenarios (draft faults, fouled HX, sensor failures)
labels: type:task
---

## Goal

The goal of this task is to implement more troubleshooting scenarios, such as draft faults, fouled heat exchangers, and sensor failures.

## Current State

This feature is not yet implemented. The "Troubleshooting Scenarios" dropdown in `src/App.jsx` is present, but it does not have any effect.

## Subtasks

- [ ] Implement the "Low air, hot stack" scenario.
- [ ] Implement the "High draft, cold stack" scenario.
- [ ] Implement the "Dirty nozzles (incomplete)" scenario.
- [ ] Implement the "Biodiesel blend, medium stack" scenario.

## Test plan

- [ ] For each scenario, write a test to verify that selecting the scenario has the intended effect on the simulation.

## Links

- DoD: /docs/DoD.md
- Related:
  - `src/App.jsx`
