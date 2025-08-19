/\*\*

- [FILE PURPOSE]: Phase 2 Integration Comments - App.jsx State Extraction Plan
- [DEPENDENCIES]: useAppState, useSimulationLoop, useSettings, useLayoutManager hooks
- [CLEAN CODE NOTES]: Following Single Responsibility Principle to extract state management
- [IMPLEMENTATION NOTES]: Sequential integration to maintain system stability
  \*/

// =============================================================================
// PHASE 2 INTEGRATION PLAN - COMMENT-FIRST STRUCTURE
// =============================================================================

/\*\*

- [INTEGRATION PHASE 1]: useAppState Hook Integration
- [CLEAN CODE]: Single Responsibility - Centralize all core simulation state
- [CURRENT STATE]: Scattered useState declarations throughout App.jsx
- [TARGET STATE]: Centralized state management through useAppState hook
- [IMPLEMENTATION HINTS]: Replace individual useState with hook destructuring
  \*/

// TODO: STEP 1.1 - Import useAppState hook
// [CLEAN CODE BLOCK]: Hook Import Declaration
// [PRINCIPLE]: Dependency Inversion - Depend on abstractions (hooks) not details
// [STRUCTURE]: Add to existing hook imports section
// import { useAppState } from './hooks/useAppState';

// TODO: STEP 1.2 - Replace Core Simulation State
// [CLEAN CODE BLOCK]: Core State Extraction
// [PRINCIPLE]: DRY - Replace duplicated state declarations with centralized management
// [STRUCTURE]: Replace these useState declarations with useAppState destructuring
/\*\*

- [CURRENT PROBLEMATIC STATE]: Individual useState scattered throughout component
- Replace the following individual state declarations:
- - const [boilerOn, setBoilerOn] = useState(false);
- - const [rheostat, setRheostat] = useState(0);
- - const [minFuel, setMinFuel] = useState(2);
- - const [maxFuel, setMaxFuel] = useState(18);
- - const [fuelFlow, setFuelFlow] = useState(5);
- - const [airFlow, setAirFlow] = useState(60);
- - const [ambientF, setAmbientF] = useState(70);
- - const [simStackF, setSimStackF] = useState(150);
- - const [setpointF, setSetpointF] = useState(350);
- - const [burnerState, setBurnerState] = useState("OFF");
- - const [saved, setSaved] = useState(loadSaved);
- - const [fuelKey, setFuelKey] = useState("Natural Gas");
- - const [scenarioSel, setScenarioSel] = useState("");
-
- [NEW CENTRALIZED APPROACH]:
- const appState = useAppState();
- const {
- // Core state
- boilerOn, setBoilerOn,
- rheostat, setRheostat,
- minFuel, setMinFuel,
- maxFuel, setMaxFuel,
- fuelFlow, setFuelFlow,
- airFlow, setAirFlow,
- ambientF, setAmbientF,
- // Burner state
- burnerState, setBurnerState,
- simStackF, setSimStackF,
- setpointF, setSetpointF,
- // Analyzer state
- saved, setSaved,
- // Fuel and scenarios
- fuelKey, setFuelKey,
- fuel, isGas,
- scenarioSel, setScenarioSel,
- // Performance refs
- boilerOnRef, burnerStateRef, fuelRef,
- flameSignalRef, lockoutPendingRef,
- ambientFRef, setpointFRef,
- fuelFlowRef, airFlowRef,
- // Derived computations
- disp, effectiveFuel,
- gasCamCFH, gasBurnerCFH,
- // Coordination actions
- resetBurner, applyScenario, saveReading
- } = appState;
  \*/

// TODO: STEP 1.3 - Remove Individual useRef Declarations
// [CLEAN CODE BLOCK]: Reference Management Cleanup
// [PRINCIPLE]: DRY - Remove duplicated ref creation now handled by hook
// [STRUCTURE]: Remove these individual ref declarations and useEffect sync patterns
/\*\*

- [REFS TO REMOVE]: These are now provided by useAppState
- - const boilerOnRef = useRef(boilerOn);
- - const burnerStateRef = useRef(burnerState);
- - const fuelRef = useRef(fuel);
- - const flameSignalRef = useRef(flameSignal);
- - const lockoutPendingRef = useRef(lockoutPending);
- - const ambientFRef = useRef(ambientF);
- - const setpointFRef = useRef(setpointF);
- - const fuelFlowRef = useRef(fuelFlow);
- - const airFlowRef = useRef(airFlow);
-
- [SYNC EFFECTS TO REMOVE]: These useEffect patterns are now handled internally
- - useEffect(() => { boilerOnRef.current = boilerOn; }, [boilerOn]);
- - useEffect(() => { burnerStateRef.current = burnerState; }, [burnerState]);
- - useEffect(() => { fuelRef.current = fuel; }, [fuel]);
- - etc. (all ref sync useEffects can be removed)
    \*/

// TODO: STEP 1.4 - Update Derived Computations
// [CLEAN CODE BLOCK]: Computation Dependencies Update  
// [PRINCIPLE]: Single Source of Truth - Update computations to use hook values
// [STRUCTURE]: Update useMemo dependencies to use hook-provided values
/\*\*

- [COMPUTATION UPDATES]: Update these derived values to use hook state
-
- Example transformations:
- FROM: const effectiveFuel = useMemo(() => { ... }, [t7Main, t6Pilot, fuelFlow, minFuel]);
- TO: Use effectiveFuel directly from hook (already computed)
-
- FROM: const disp = useMemo(() => computeCombustion(...), [fuelFlow, airFlow, fuel, simStackF, ambientF]);
- TO: Use disp directly from hook (already computed)
  \*/

// =============================================================================

/\*\*

- [INTEGRATION PHASE 2]: useSimulationLoop Hook Integration
- [CLEAN CODE]: Single Responsibility - Extract simulation timing coordination
- [CURRENT STATE]: Large useEffect with 10Hz interval scattered throughout
- [TARGET STATE]: Centralized simulation coordination through useSimulationLoop hook
- [IMPLEMENTATION HINTS]: Replace simulation useEffect with hook initialization
  \*/

// TODO: STEP 2.1 - Import useSimulationLoop hook
// [CLEAN CODE BLOCK]: Simulation Hook Import
// [PRINCIPLE]: Separation of Concerns - Isolate simulation logic from UI logic
// [STRUCTURE]: Add to hook imports section
// import { useSimulationLoop } from './hooks/useSimulationLoop';

// TODO: STEP 2.2 - Initialize Simulation Loop
// [CLEAN CODE BLOCK]: Simulation Coordination Setup
// [PRINCIPLE]: Single Responsibility - Hook handles all simulation timing
// [STRUCTURE]: Replace simulation useEffect with hook initialization
/\*\*

- [CURRENT SIMULATION LOGIC TO REPLACE]:
- - Large useEffect with setInterval for 10Hz updates
- - Burner state machine advancement logic
- - Temperature simulation calculations
- - Flame signal simulation
- - Safety system coordination
- - State countdown management
-
- [NEW APPROACH]:
- const simulationLoop = useSimulationLoop({
- // State refs for performance
- simSpeedMultiplierRef: config.general?.fastForward ? fastForwardRef : normalSpeedRef,
- stateTimeRef,
- boilerOnRef,
- burnerStateRef,
- fuelRef,
- fuelFlowRef,
- airFlowRef,
- flameSignalRef,
- lockoutPendingRef,
- ambientFRef,
- setpointFRef,
-
- // State setters from useAppState
- setBurnerState,
- setSimStackF,
- setT5Spark,
- setT6Pilot,
- setT7Main,
- setFlameSignal,
- setStateCountdown,
- setLockoutReason,
- setLockoutPending,
-
- // Current state values
- flameOutTimerRef
- });
-
- const { EP160 } = simulationLoop;
  \*/

// TODO: STEP 2.3 - Remove Existing Simulation useEffect
// [CLEAN CODE BLOCK]: Legacy Simulation Cleanup
// [PRINCIPLE]: DRY - Remove duplicated simulation logic now handled by hook
// [STRUCTURE]: Remove large simulation useEffect and related helper functions
/\*\*

- [SIMULATION CODE TO REMOVE]:
- - Main 10Hz setInterval useEffect
- - advanceBurnerState function
- - updateStackTemperature function
- - updateFlameSignal function
- - updateStateCountdown function
- - All related simulation timing logic
-
- These are now handled internally by useSimulationLoop hook
  \*/

// =============================================================================

/\*\*

- [INTEGRATION PHASE 3]: Settings System Integration
- [CLEAN CODE]: Single Responsibility - Extract settings and theme management
- [CURRENT STATE]: Settings logic scattered throughout component
- [TARGET STATE]: Centralized settings management through useSettings hook
- [IMPLEMENTATION HINTS]: Replace settings state with hook coordination
  \*/

// TODO: STEP 3.1 - Extract Settings Management
// [CLEAN CODE BLOCK]: Settings State Extraction
// [PRINCIPLE]: Cohesion - Group related settings functionality together
// [STRUCTURE]: Replace scattered settings logic with hook
/\*\*

- [SETTINGS STATE TO EXTRACT]:
- - const [config, setConfig] = useState(initialConfig || getDefaultConfig());
- - const [showSettings, setShowSettings] = useState(false);
- - const [theme, setTheme] = useState(() => { ... });
- - const configBeforeSettings = useRef(null);
- - const unitSystem = config.units.system;
-
- [SETTINGS FUNCTIONS TO EXTRACT]:
- - handleApply function
- - handleCancel function
- - handlePreview function
- - applyTheme function
- - Theme-related useEffect patterns
-
- [NEW APPROACH]:
- const settings = useSettings(initialConfig);
- const {
- config,
- unitSystem,
- theme,
- showSettings,
- setShowSettings,
- handleApply,
- handleCancel,
- handlePreview,
- themeVars,
- isDarkMode,
- simSpeedMultiplier,
- fastForward
- } = settings;
  \*/

// =============================================================================

/\*\*

- [INTEGRATION PHASE 4]: Layout Management Integration
- [CLEAN CODE]: Single Responsibility - Extract layout and grid management
- [CURRENT STATE]: Layout logic mixed with component logic
- [TARGET STATE]: Centralized layout management through useLayoutManager hook
- [IMPLEMENTATION HINTS]: Replace layout state with hook coordination
  \*/

// TODO: STEP 4.1 - Extract Layout Management
// [CLEAN CODE BLOCK]: Layout State Extraction
// [PRINCIPLE]: Separation of Concerns - Isolate layout logic from business logic
// [STRUCTURE]: Replace layout management with hook
/\*\*

- [LAYOUT STATE TO EXTRACT]:
- - const [layouts, setLayouts] = useState(loadLayouts());
- - const [autoSizeLock, setAutoSizeLock] = useState(false);
- - const [breakpoint, setBreakpoint] = useState('lg');
- - const lastRowsRef = useRef({});
-
- [LAYOUT FUNCTIONS TO EXTRACT]:
- - handleLayoutChange function
- - setItemRows function
- - handleResetLayouts function
- - loadLayouts function
- - saveLayouts function
- - normalizeLayouts function
- - All layout-related localStorage logic
-
- [NEW APPROACH]:
- const layoutManager = useLayoutManager();
- const {
- layouts,
- setLayouts,
- autoSizeLock,
- setAutoSizeLock,
- breakpoint,
- setBreakpoint,
- handleLayoutChange,
- setItemRows,
- handleResetLayouts,
- rglBreakpoints,
- rglCols,
- defaultLayouts
- } = layoutManager;
  \*/

// =============================================================================

/\*\*

- [POST-INTEGRATION CLEANUP]: Final App.jsx Structure
- [CLEAN CODE]: Clean Architecture - App.jsx becomes pure orchestration
- [TARGET STRUCTURE]: Clear separation between hooks and presentation
- [FINAL RESPONSIBILITIES]: Layout orchestration and component coordination only
  \*/

// TODO: FINAL STEP - App.jsx Cleanup
// [CLEAN CODE BLOCK]: Pure Component Architecture
// [PRINCIPLE]: Single Responsibility - App.jsx only handles layout and rendering
// [STRUCTURE]: Clean component with clear hook dependencies
/\*\*

- [FINAL APP.JSX STRUCTURE]:
-
- function CombustionTrainer({ initialConfig }) {
- // UI State (already extracted)
- const { drawerOpen, setDrawerOpen, seriesVisibility, setSeriesVisibility } = useUIState();
-
- // Core State Management (Phase 2)
- const appState = useAppState();
- const { ... } = appState;
-
- // Simulation Coordination (Phase 2)
- const simulationLoop = useSimulationLoop({ ... });
-
- // Settings Management (Phase 2)
- const settings = useSettings(initialConfig);
- const { ... } = settings;
-
- // Layout Management (Phase 2)
- const layoutManager = useLayoutManager();
- const { ... } = layoutManager;
-
- // Tour System (already integrated)
- const tour = useTour();
-
- // Panel Management (already integrated)
- const panelManagement = usePanelManagement();
-
- // Pure rendering and layout orchestration
- return (
-     <div className="min-h-screen w-full bg-background text-foreground">
-       // Component structure remains the same
-       // Just uses values from hooks instead of local state
-     </div>
- );
- }
-
- [ESTIMATED FINAL SIZE]: ~800-1000 lines (down from 2,261)
- [RESPONSIBILITIES]: Layout, rendering, component coordination only
- [BENEFITS]: Clean separation, testable hooks, maintainable architecture
  \*/

// =============================================================================

/\*\*

- [TESTING STRATEGY]: Comprehensive verification approach
- [CLEAN CODE]: Test-Driven Integration - Verify each step thoroughly
- [TESTING PHASES]: Build, functional, performance, integration testing
  \*/

// TODO: Testing Implementation
// [CLEAN CODE BLOCK]: Integration Testing Strategy
// [PRINCIPLE]: Quality Assurance - Verify system integrity at each step
// [STRUCTURE]: Systematic testing approach for each integration phase
/\*\*

- [TESTING CHECKLIST]:
-
- After Each Integration Step:
- - [ ] npm run build passes without errors
- - [ ] All existing functionality preserved
- - [ ] Tour system continues to work
- - [ ] Panel management remains functional
- - [ ] Settings persistence works correctly
- - [ ] Simulation timing maintains accuracy
- - [ ] No performance degradation observed
- - [ ] Memory usage remains stable
- - [ ] Error handling preserved
-
- Integration-Specific Tests:
- - [ ] State synchronization between hooks works correctly
- - [ ] Ref-based performance patterns maintained
- - [ ] Cross-hook communication functions properly
- - [ ] Fast-forward functionality preserved
- - [ ] Theme switching works correctly
- - [ ] Layout persistence maintained
- - [ ] Settings preview/apply/cancel cycle functions
-
- Final Validation:
- - [ ] Complete system functionality verified
- - [ ] Performance benchmarks met
- - [ ] Code quality standards achieved
- - [ ] Documentation updated
- - [ ] Clean separation of concerns established
        \*/

// =============================================================================
// END PHASE 2 INTEGRATION PLAN
// =============================================================================

/\*\*

- [IMPLEMENTATION SUCCESS CRITERIA]:
- - All 4 integration phases completed successfully
- - App.jsx reduced to ~800-1000 lines
- - 6 of 14 hooks integrated and working
- - System functionality completely preserved
- - Performance maintained or improved
- - Clean architecture established for Phase 3
-
- [NEXT PHASE READINESS]:
- - Foundation established for remaining hook integrations
- - Clear patterns for continued modularization
- - Architecture proven stable and maintainable
- - Ready for Phase 3 specialized system extraction
    \*/
