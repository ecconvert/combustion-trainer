# Bug Report: Export Buttons Move - Fixed Infinite Re-render, New Failing Tests & Timing Issues

## Summary

This report documents the work done to move the "Export Trend CSV" and "Export Saved Readings" buttons into a new "Export" section within the settings menu. The main infinite re-render bug has been **FIXED**. Additional test failures (timeouts and an assertion ambiguity) have emerged during continued stabilization.

## Changes Made - COMPLETED ✅

The following changes were successfully implemented:

1.  **`src/components/settings/ExportSection.jsx`**: Created a new component to house the export buttons. It receives `history`, `saved`, and `onExportSaved` as props.

2.  **`src/components/SettingsMenu.jsx`**:
    *   Imported the new `ExportSection` component.
    *   Added an "Export" section to the `sections` object.
    *   **FIXED**: Refactored `handleField` and `handleReset` to use `useEffect` with `previewPayload` state to schedule `onPreview` calls asynchronously, eliminating the "setState during render" issue.

3.  **`src/App.jsx`**:
    *   Removed the "Export Trend CSV" and "Export Saved Readings" buttons from the main header.
    *   Passed the `history`, `saved`, and `exportSavedReadings` props to the `SettingsMenu` component.

4.  **`src/components/settings/DataSection.jsx`**: Updated the placeholder text to reflect that the export buttons have been moved.

5.  **`src/__tests__/settings-interactions.test.tsx`**:
    *   Updated tests for the export buttons to look for them in the new "Export" section.
    *   Export button location tests are now **PASSING** ✅

## Bug Fix Applied - RESOLVED ✅

### Root Cause Identified and Fixed
The infinite re-render was caused by `SettingsMenu` calling `onPreview` synchronously during a `setLocal` state update:

```jsx
// BEFORE (causing infinite re-render):
const handleField = (sec, field, value) => {
  setLocal((p) => {
    const next = { ...p, [sec]: { ...p[sec], [field]: value } };
    onPreview && onPreview(next, { section: sec, field }); // ❌ setState during render
    return next;
  });
};
```

```jsx
// AFTER (fixed with async scheduling):
const [previewPayload, setPreviewPayload] = useState(null);

useEffect(() => {
  if (previewPayload && onPreview) {
    onPreview(previewPayload.config, previewPayload.meta);
    setPreviewPayload(null);
  }
}, [previewPayload, onPreview]);

const handleField = (sec, field, value) => {
  setLocal((p) => {
    const next = { ...p, [sec]: { ...p[sec], [field]: value } };
    // Schedule preview asynchronously
    setPreviewPayload({ config: next, meta: { section: sec, field } });
    return next;
  });
};
```

### Results of Fix
- ✅ **No more React warnings**: "Cannot update a component..." error eliminated
- ✅ **Export functionality working**: CSV export buttons successfully moved to settings
- ✅ **Settings interactions working**: Focus management and export tests pass
- ✅ **Tuning mode off path** works (sliders hidden test passes)
- ⚠️ **New timing / selection issues** surfaced in unrelated suites after refactor

## Remaining Issues - SECONDARY & TERTIARY BUGS ⚠️

### Current Problems (Snapshot from latest run)
Failing / Problem Areas:
1. **Tuning Mode / Fuel & Air Flow Controls**
  - `src/__tests__/controls.test.tsx`: `should display sliders and min/max warnings when tuning mode is on` (timeout 60s)
  - `src/__tests__/debug-original.test.tsx`: duplicate focused debug test for same scenario (timeout 10s)
2. **Firing Rate Control Test Ambiguity**
  - `src/__tests__/controls.test.tsx`: `should enable firing rate slider in RUN_AUTO state and update flows` fails due to multiple matches for text `/50%/` (now appears in several elements: display value + multiple buttons). This is a test selector brittleness introduced by UI changes.
3. **Troubleshooting Scenario Tests (Settings Interaction Suite)**
  - Three scenario tests timeout (each ~5s) after selecting scenario from dropdown. Indicates scenario side-effects (gas readings updates) not observed or state updates not flushed.
4. **Chemistry Draft Test**
  - Known intentional failure (`computeCombustion` draft effect not implemented yet): assertion 96.4 < 96.4.
5. **Empty Test Files**
  - `cam-map-fixed.test.tsx` & `debug-cam.test.tsx` fail with "No test suite found" (likely temporary scaffolding; either add tests or remove/rename).

Passing but relevant: export relocation tests, layout persistence, theme, tuning mode OFF case.

### Detailed Analysis: Tuning Mode Timeout
The primary tuning test hangs specifically at this point:
```
✓ Clicked On button
✓ Found both sliders  
Testing fuel flow min...
✓ Set fuel flow to 0
[HANGS HERE] → await screen.findByText('MIN');
```

The test successfully:
1. Renders the app
2. Advances to RUN_AUTO state
3. Finds and clicks the tuning mode "On" button
4. Finds both fuel flow and air flow sliders
5. Sets the fuel flow to 0

But then hangs waiting for the "MIN" warning text to appear.

### Root Cause Hypotheses (Ranked)
1. **Conditional Render Path Not Entered**: Sliders or MIN/MAX badge conditions depend on a state flag (e.g. `tuningOn`, min/max boundaries) that isn't updating under fake timers due to deferred preview scheduling.
2. **State Update Debounce / Ordering**: Asynchronous `onPreview` scheduling (via `useEffect`) may batch with other updates; under fake timers the effect ordering could delay/clobber the min/max evaluation.
3. **Test Not Triggering Required Transition**: RUN_AUTO or a prerequisite side effect (e.g. analyzer state) not fully ready before slider interaction; missing `await` on an intermediate UI signal.
4. **Warning Render Logic Regression**: The comparison may now use raw input value vs clamped internal value, preventing equality condition for displaying MIN/MAX.
5. **Style / Element Change**: Badge text may have changed casing / moved inside a different element causing `findByText('MIN')` to miss (needs case-insensitive or role-based query).

### Technical Details (Environment & Signals)
**Test Environment**: 
- Vitest with jsdom environment
- React Testing Library
- Fake timers enabled

**Failing Test Pattern (same for debug variant)**:
```tsx
// This works fine:
fireEvent.input(fuelFlowSlider, { target: { value: '0' } });

// This hangs indefinitely:
let minWarning = await screen.findByText('MIN');
```

**Expected Behavior**: Input < min clamps to `minFuel`; equality triggers MIN badge.

**Actual Behavior**: Slider value change accepted; badge never appears (timeout).

**Data Needed**: Actual internal fuelFlow after input, minFuel value, flag controlling badge render. Add temporary console or data-testid instrumentation.

---

### Firing Rate Test Ambiguity
Issue: Multiple `/50%/` matches now; test expects unique.
Resolution Options:
1. Narrow query: use `getByRole('button', { name: /^50 %$/ })` or `getAllByText(/50%/)` and select context.
2. Add data-testid to primary 50% display element.
3. Adjust UI to reduce duplicated literal text (least preferred).

---

### Scenario Test Timeouts
Likely the scenario selection triggers async state (maybe via `onPreview`) and expectations run before analyzer values settle.
Mitigations:
1. Wrap selection in `act` and advance timers if timers drive updates.
2. Poll/waitFor specific analyzer metric change rather than immediate asserts.
3. Add explicit event flush helper (e.g. `await flushPromises()` utility).

Instrumentation: log when scenario effect starts/ends; capture analyzer O2 / stack temp before & after.

---

### Empty Test Files
Decide: implement minimal smoke tests or remove to restore green.

## Next Steps - PRIORITIZED ACTION PLAN

Order of operations to stabilize suite:

1. Instrument Tuning Badge Logic
  - Add temporary console or `data-testid="fuel-min-badge"` where MIN renders; log fuelFlow, minFuel, tuningOn.
  - Re-run only tuning tests (`npx vitest run controls.test.tsx -t "tuning mode"`).
2. Fix Firing Rate Test Selector
  - Update test to use less ambiguous query OR add testid to primary display.
3. Add wait/act to Scenario Tests
  - Wrap selection, use `await waitFor(() => expect(...changed))`.
4. Decide on Empty Test Files
  - Remove or populate; removal fastest for green build.
5. (Optional) Introduce a `flushAsync()` helper
  ```ts
  export const flushAsync = () => new Promise(r => setTimeout(r, 0));
  ```
  Use after events instead of manual timer advances if microtasks matter.
6. After stabilization, remove instrumentation.

Stretch: Implement draft effect (chemistry) or mark test with explicit TODO skip.

Risk Notes:
- Overuse of fake timers can stall `useEffect` chains if real timeouts not advanced.
- Race between preview scheduling and direct state used for warnings.

Decision Needed: Keep separate debug test (`debug-original.test.tsx`) or merge its coverage back—currently duplicates failing path and doubles runtime.

### Test Files to Check / Modify
- `src/__tests__/controls.test.tsx` (tuning badge & firing rate test)
- `src/__tests__/debug-original.test.tsx` (possible removal)
- `src/__tests__/settings-interactions.test.tsx` (scenario waits)
- `src/__tests__/chemistry.test.ts` (decide: keep intentional fail or skip)
- `src/__tests__/cam-map-fixed.test.tsx`, `src/__tests__/debug-cam.test.tsx` (empty suites)
- `src/App.jsx` (MIN/MAX badge logic lines ~1575-1580; confirm conditions)

### Current PR Status
- ✅ Feature change complete (export buttons relocated)
- ✅ Infinite re-render fixed
- ⚠️ Multiple secondary test issues pending (timing, selectors, empty suites)
- 🚧 Not yet fully green; needs stabilization commit(s) before merge unless partial acceptance allowed.
