/\*\*

- [FILE PURPOSE]: Phase 2 Implementation Checklist - Step-by-Step Integration Guide
- [DEPENDENCIES]: All created hooks from Phase 1, current App.jsx structure
- [CLEAN CODE NOTES]: Sequential integration following Single Responsibility Principle
- [IMPLEMENTATION NOTES]: Each step builds on previous, maintaining system stability
  \*/

# Phase 2 Implementation Checklist

_Sequential integration of core state management hooks_

## Pre-Integration Setup ✅

### Research and Planning

- [x] **Analyze current App.jsx structure** - Understand state usage patterns
- [x] **Map hook dependencies** - Identify integration order requirements
- [x] **Create integration plan** - Document step-by-step approach
- [x] **Review existing hooks** - Verify hook readiness for integration
- [x] **Plan testing strategy** - Define verification approach for each step

### Development Environment

- [ ] **Create integration branch** - `git checkout -b feat/phase-2-integration`
- [ ] **Verify current build** - Ensure clean starting state
- [ ] **Test existing functionality** - Baseline functionality verification
- [ ] **Document current metrics** - Record App.jsx line count and performance baseline

---

## Step 1: useAppState Integration 🎯

### 1.1 Hook Import and Basic Setup

- [ ] **Import useAppState hook** - Add to imports section
  ```javascript
  import { useAppState } from "./hooks/useAppState";
  ```
- [ ] **Initialize hook in component** - Add basic hook usage
  ```javascript
  const appState = useAppState();
  ```
- [ ] **Test build** - Verify no import errors
- [ ] **Git commit** - "Step 1.1: Add useAppState import and initialization"

### 1.2 Core State Replacement (Batch 1: Simulation State)

- [ ] **Replace boiler and rheostat state**
  - Remove: `const [boilerOn, setBoilerOn] = useState(false);`
  - Remove: `const [rheostat, setRheostat] = useState(0);`
  - Add destructuring from hook
- [ ] **Replace fuel flow state**
  - Remove: `const [minFuel, setMinFuel] = useState(2);`
  - Remove: `const [maxFuel, setMaxFuel] = useState(18);`
  - Remove: `const [fuelFlow, setFuelFlow] = useState(5);`
  - Remove: `const [airFlow, setAirFlow] = useState(60);`
  - Add destructuring from hook
- [ ] **Test functionality** - Verify boiler controls still work
- [ ] **Git commit** - "Step 1.2: Extract core simulation state to useAppState"

### 1.3 Temperature and Burner State (Batch 2)

- [ ] **Replace temperature state**
  - Remove: `const [ambientF, setAmbientF] = useState(70);`
  - Remove: `const [simStackF, setSimStackF] = useState(150);`
  - Remove: `const [setpointF, setSetpointF] = useState(350);`
  - Add destructuring from hook
- [ ] **Replace burner state**
  - Remove: `const [burnerState, setBurnerState] = useState("OFF");`
  - Add destructuring from hook
- [ ] **Test functionality** - Verify temperature controls and burner state
- [ ] **Git commit** - "Step 1.3: Extract temperature and burner state to useAppState"

### 1.4 Analyzer and Fuel State (Batch 3)

- [ ] **Replace analyzer state**
  - Remove: `const [saved, setSaved] = useState(loadSaved);`
  - Add destructuring from hook
- [ ] **Replace fuel selection state**
  - Remove: `const [fuelKey, setFuelKey] = useState("Natural Gas");`
  - Remove: `const [scenarioSel, setScenarioSel] = useState("");`
  - Remove derived: `const fuel = FUELS[fuelKey];`
  - Remove derived: `const isOil = ...` and `const isGas = ...`
  - Add destructuring from hook
- [ ] **Test functionality** - Verify analyzer and fuel selection work
- [ ] **Git commit** - "Step 1.4: Extract analyzer and fuel state to useAppState"

### 1.5 Performance References Cleanup

- [ ] **Remove individual ref declarations**
  - Remove: All `const [name]Ref = useRef([name]);` declarations
  - Remove: All `useEffect(() => { [name]Ref.current = [name]; }, [[name]]);` patterns
- [ ] **Update hook destructuring** - Add refs from hook
  ```javascript
  const {
    // ... existing destructuring
    boilerOnRef,
    burnerStateRef,
    fuelRef,
    flameSignalRef,
    lockoutPendingRef,
    ambientFRef,
    setpointFRef,
    fuelFlowRef,
    airFlowRef,
    // ... more refs
  } = appState;
  ```
- [ ] **Test performance** - Verify simulation performance maintained
- [ ] **Git commit** - "Step 1.5: Replace individual refs with hook-provided refs"

### 1.6 Derived Computations Update

- [ ] **Replace individual computations** - Use hook-provided values
  - Remove `const disp = useMemo(() => computeCombustion(...), [...]);`
  - Remove `const effectiveFuel = useMemo(...);`
  - Remove gas flow calculations
  - Use values directly from hook destructuring
- [ ] **Update component usage** - Ensure all references use hook values
- [ ] **Test calculations** - Verify all derived values work correctly
- [ ] **Git commit** - "Step 1.6: Use hook-provided derived computations"

### 1.7 Step 1 Validation

- [ ] **Build verification** - `npm run build` passes
- [ ] **Functionality testing** - All boiler controls work
- [ ] **Performance testing** - No degradation in simulation speed
- [ ] **Integration testing** - State synchronization works
- [ ] **Error testing** - Error handling preserved
- [ ] **Git commit** - "Step 1 Complete: useAppState fully integrated"

---

## Step 2: useSimulationLoop Integration 🔄

### 2.1 Hook Import and Setup

- [ ] **Import useSimulationLoop hook**
  ```javascript
  import { useSimulationLoop } from "./hooks/useSimulationLoop";
  ```
- [ ] **Test build** - Verify no import errors
- [ ] **Git commit** - "Step 2.1: Add useSimulationLoop import"

### 2.2 Simulation Loop Initialization

- [ ] **Create simulation speed ref** - For fast-forward functionality
  ```javascript
  const simSpeedMultiplierRef = useRef(config.general?.fastForward ? 10 : 1);
  ```
- [ ] **Initialize simulation loop hook**
  ```javascript
  const simulationLoop = useSimulationLoop({
    // State refs for performance
    simSpeedMultiplierRef,
    stateTimeRef, // from appState
    boilerOnRef,
    burnerStateRef,
    fuelRef,
    fuelFlowRef,
    airFlowRef,
    flameSignalRef,
    lockoutPendingRef,
    ambientFRef,
    setpointFRef,

    // State setters from useAppState
    setBurnerState,
    setSimStackF,
    setT5Spark,
    setT6Pilot,
    setT7Main,
    setFlameSignal,
    setStateCountdown,
    setLockoutReason,
    setLockoutPending,

    // Current state values
    flameOutTimerRef, // from appState
  });
  ```
- [ ] **Test build** - Verify hook initialization works
- [ ] **Git commit** - "Step 2.2: Initialize useSimulationLoop hook"

### 2.3 Remove Legacy Simulation Code

- [ ] **Remove main simulation useEffect** - Large 10Hz interval logic
- [ ] **Remove helper functions**
  - Remove `advanceBurnerState` function
  - Remove `updateStackTemperature` function
  - Remove `updateFlameSignal` function
  - Remove `updateStateCountdown` function
- [ ] **Remove simulation constants** - EP160 constants now from hook
- [ ] **Update EP160 usage** - Use from hook destructuring
  ```javascript
  const { EP160 } = simulationLoop;
  ```
- [ ] **Test functionality** - Verify simulation still runs correctly
- [ ] **Git commit** - "Step 2.3: Remove legacy simulation code, use hook"

### 2.4 Fast-Forward Integration

- [ ] **Update speed multiplier handling** - Connect to settings
- [ ] **Test tour fast-forward** - Verify tour speed control works
- [ ] **Test settings fast-forward** - Verify settings speed control works
- [ ] **Performance verification** - Ensure 10Hz timing maintained
- [ ] **Git commit** - "Step 2.4: Integrate fast-forward with simulation loop"

### 2.5 Step 2 Validation

- [ ] **Build verification** - `npm run build` passes
- [ ] **Simulation testing** - All burner states transition correctly
- [ ] **Timing testing** - 10Hz simulation maintains accuracy
- [ ] **Fast-forward testing** - Speed multiplier works correctly
- [ ] **Integration testing** - Hook coordination functions properly
- [ ] **Git commit** - "Step 2 Complete: useSimulationLoop fully integrated"

---

## Step 3: Settings System Integration ⚙️

### 3.1 Settings Hook Import

- [ ] **Import useSettings hook**
  ```javascript
  import { useSettings } from "./hooks/useSettings";
  ```
- [ ] **Test build** - Verify no import errors
- [ ] **Git commit** - "Step 3.1: Add useSettings import"

### 3.2 Settings State Extraction

- [ ] **Initialize settings hook**
  ```javascript
  const settings = useSettings(initialConfig);
  ```
- [ ] **Replace config state**
  - Remove: `const [config, setConfig] = useState(...);`
  - Remove: `const configBeforeSettings = useRef(null);`
  - Remove: `const unitSystem = config.units.system;`
  - Add destructuring from hook
- [ ] **Replace settings modal state**
  - Remove: `const [showSettings, setShowSettings] = useState(false);`
  - Add destructuring from hook
- [ ] **Test functionality** - Verify settings state works
- [ ] **Git commit** - "Step 3.2: Extract settings state to useSettings hook"

### 3.3 Theme Management Extraction

- [ ] **Replace theme state**
  - Remove: `const [theme, setTheme] = useState(() => { ... });`
  - Remove: `const [isDarkMode, setIsDarkMode] = useState(false);`
  - Add destructuring from hook
- [ ] **Remove theme functions**
  - Remove: `const applyTheme = (theme) => { ... };`
  - Remove: Theme-related useEffect patterns
  - Remove: `const themeVars = useMemo(() => { ... });`
  - Add destructuring from hook
- [ ] **Test functionality** - Verify theme switching works
- [ ] **Git commit** - "Step 3.3: Extract theme management to useSettings hook"

### 3.4 Settings Handlers Extraction

- [ ] **Replace settings handlers**
  - Remove: `const handleApply = (next) => { ... };`
  - Remove: `const handleCancel = () => { ... };`
  - Remove: `const handlePreview = (next, meta) => { ... };`
  - Add destructuring from hook
- [ ] **Update SettingsMenu usage** - Use hook-provided handlers
- [ ] **Test functionality** - Verify settings apply/cancel/preview cycle
- [ ] **Git commit** - "Step 3.4: Extract settings handlers to useSettings hook"

### 3.5 Step 3 Validation

- [ ] **Build verification** - `npm run build` passes
- [ ] **Settings testing** - All settings functionality preserved
- [ ] **Theme testing** - Theme switching works correctly
- [ ] **Persistence testing** - Settings save/load correctly
- [ ] **Preview testing** - Live preview functionality works
- [ ] **Git commit** - "Step 3 Complete: useSettings fully integrated"

---

## Step 4: Layout Management Integration 🏗️

### 4.1 Layout Hook Import

- [ ] **Import useLayoutManager hook**
  ```javascript
  import { useLayoutManager } from "./hooks/useLayoutManager";
  ```
- [ ] **Test build** - Verify no import errors
- [ ] **Git commit** - "Step 4.1: Add useLayoutManager import"

### 4.2 Layout State Extraction

- [ ] **Initialize layout hook**
  ```javascript
  const layoutManager = useLayoutManager();
  ```
- [ ] **Replace layout state**
  - Remove: `const [layouts, setLayouts] = useState(loadLayouts());`
  - Remove: `const [autoSizeLock, setAutoSizeLock] = useState(false);`
  - Remove: `const [breakpoint, setBreakpoint] = useState('lg');`
  - Remove: `const lastRowsRef = useRef({});`
  - Add destructuring from hook
- [ ] **Test functionality** - Verify layout state works
- [ ] **Git commit** - "Step 4.2: Extract layout state to useLayoutManager hook"

### 4.3 Layout Functions Extraction

- [ ] **Replace layout handlers**
  - Remove: `const handleLayoutChange = (current, allLayouts) => { ... };`
  - Remove: `const setItemRows = useCallback((key, rows) => { ... });`
  - Remove: `const handleResetLayouts = () => { ... };`
  - Add destructuring from hook
- [ ] **Remove layout utilities**
  - Remove: `loadLayouts`, `saveLayouts`, `normalizeLayouts` functions
  - Remove: Layout-related localStorage logic
  - Remove: Layout constants (now from hook)
- [ ] **Test functionality** - Verify layout management works
- [ ] **Git commit** - "Step 4.3: Extract layout functions to useLayoutManager hook"

### 4.4 ResponsiveGridLayout Integration

- [ ] **Update grid layout props** - Use hook-provided values
  ```javascript
  <ResponsiveGridLayout
    breakpoints={rglBreakpoints} // from hook
    cols={rglCols} // from hook
    layouts={layouts} // from hook
    onBreakpointChange={setBreakpoint} // from hook
    onLayoutChange={handleLayoutChange} // from hook
    // ... other props remain same
  />
  ```
- [ ] **Test functionality** - Verify grid layout works correctly
- [ ] **Git commit** - "Step 4.4: Integrate layout hook with ResponsiveGridLayout"

### 4.5 Step 4 Validation

- [ ] **Build verification** - `npm run build` passes
- [ ] **Layout testing** - Drag and resize functionality works
- [ ] **Persistence testing** - Layout changes save/load correctly
- [ ] **Responsive testing** - Breakpoint handling works
- [ ] **Reset testing** - Layout reset functionality works
- [ ] **Git commit** - "Step 4 Complete: useLayoutManager fully integrated"

---

## Final Integration Cleanup 🧹

### App.jsx Structure Cleanup

- [ ] **Remove unused imports** - Clean up no-longer-needed imports
- [ ] **Remove unused functions** - Clean up helper functions now in hooks
- [ ] **Remove unused constants** - Clean up constants now in hooks
- [ ] **Organize hook usage** - Group hook calls logically
- [ ] **Update component JSX** - Ensure all references use hook values
- [ ] **Add comments** - Document hook integration for maintainability

### Code Quality Verification

- [ ] **ESLint check** - Resolve any linting issues
- [ ] **Type checking** - Verify TypeScript (if applicable)
- [ ] **Performance audit** - Verify no performance regressions
- [ ] **Memory check** - Verify no memory leaks introduced
- [ ] **Bundle size check** - Verify no significant bundle increases

### Final Testing

- [ ] **Complete functionality test** - All features work correctly
- [ ] **Cross-browser test** - Verify compatibility maintained
- [ ] **Performance benchmark** - Compare to baseline metrics
- [ ] **Error handling test** - Verify error handling preserved
- [ ] **Edge case testing** - Test boundary conditions and edge cases

### Documentation Update

- [ ] **Update MODULARIZATION_SUMMARY.md** - Reflect Phase 2 completion
- [ ] **Update hook documentation** - Document integration patterns
- [ ] **Update README if needed** - Reflect architectural changes
- [ ] **Create Phase 3 plan** - Prepare next phase documentation

### Final Commit and Metrics

- [ ] **Git commit** - "Phase 2 Complete: Core state hooks fully integrated"
- [ ] **Record final metrics** - App.jsx line count, bundle size, performance
- [ ] **Create git tag** - `git tag phase-2-complete`
- [ ] **Merge to main** - After final validation

---

## Success Criteria Verification ✅

### Functional Requirements

- [ ] All existing functionality preserved
- [ ] Tour system continues to work correctly
- [ ] Panel management remains functional
- [ ] Simulation timing maintains accuracy
- [ ] Settings persistence works correctly
- [ ] Analyzer functionality preserved
- [ ] All user interactions work correctly

### Technical Requirements

- [ ] Build passes after integration
- [ ] No performance degradation in simulation
- [ ] Memory usage remains stable
- [ ] Error handling preserved throughout
- [ ] Bundle size impact acceptable
- [ ] Code quality standards maintained

### Architecture Requirements

- [ ] Clean separation of concerns achieved
- [ ] State coordination patterns established
- [ ] Hook dependencies properly managed
- [ ] App.jsx reduced to ~800-1000 lines
- [ ] 6 of 14 hooks integrated successfully
- [ ] Foundation ready for Phase 3

### Phase 2 Completion Metrics

- **Target App.jsx Size**: ~800-1000 lines (from 2,261)
- **Hooks Integrated**: 6 of 14 total hooks
- **System Stability**: All functionality preserved
- **Performance**: No degradation in simulation timing
- **Architecture**: Clean modular structure established

**Phase 2 Status**: ✅ **Complete** | Ready for Phase 3 Integration 🚀
