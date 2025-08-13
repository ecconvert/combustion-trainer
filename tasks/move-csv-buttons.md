---
name: Move CSV buttons
about: CSV export and import buttons will move to the Data and privacy section
labels: type:task
---

## Goal

The goal of this task is to move the CSV export and import buttons from the header to the "Data and privacy" section in the settings menu.

## Current State

This feature is not yet implemented. The CSV export buttons are currently in the header in `src/App.jsx`. The "Data and privacy" section in `src/components/settings/DataSection.jsx` contains a placeholder message.

## Subtasks

- [ ] Move the "Export Trend CSV" button from the header to the `DataSection` component.
- [ ] Move the "Export Saved Readings" button from the header to the `DataSection` component.
- [ ] Remove the placeholder message from the `DataSection` component.

## Test plan

- [ ] Write a test to verify that the CSV export buttons are no longer in the header.
- [ ] Write a test to verify that the CSV export buttons are present in the "Data and privacy" section of the settings menu.
- [ ] Write a test to verify that the CSV export buttons still function correctly after being moved.

## Links

- DoD: /docs/DoD.md
- Related:
  - `src/App.jsx`
  - `src/components/SettingsMenu.jsx`
  - `src/components/settings/DataSection.jsx`
