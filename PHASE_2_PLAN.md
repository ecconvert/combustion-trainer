# Phase 2 Integration Plan - Combustion Trainer Modularization

## Overview

Phase 2 focuses on integrating the core state management and simulation hooks that were created in Phase 1. This phase will systematically replace the monolithic state management in App.jsx with modular hooks while maintaining system stability.

## Phase 2 Goals

- Integrate `useAppState` for centralized state management
- Integrate `useSimulationLoop` for 10Hz simulation coordination
- Extract and integrate layout management patterns
- Extract and integrate settings management
- Reduce App.jsx from 2,261 lines to ~800-1000 lines
- Maintain full system functionality throughout integration

## Integration Strategy

### 1. Pre-Integration Analysis

- [ ] Map current state usage patterns in App.jsx
- [ ] Identify state dependencies and coordination points
- [ ] Plan integration order to minimize breaking changes
- [ ] Create test scenarios for each integration step

### 2. Integration Steps (Sequential Order)

#### Step 1: useAppState Integration

**Purpose**: Replace scattered state management with centralized hook
**Files Modified**: `src/App.jsx`, possibly component props
**Estimated Impact**: ~200-300 lines reduced from App.jsx

**State to Extract:**

- Core simulation state (boilerOn, rheostat, fuel flows, temperatures)
- Burner state machine variables
- Analyzer state and saved readings
- Fuel selection and scenario management
- Performance references for high-frequency updates

**Integration Process:**

1. Add useAppState import to App.jsx
2. Replace individual useState declarations with hook destructuring
3. Update all state references to use hook values
4. Replace state setters with hook setters
5. Update refs to use hook-provided refs
6. Verify all state coordination works correctly

#### Step 2: useSimulationLoop Integration

**Purpose**: Extract main simulation timing and coordination logic
**Files Modified**: `src/App.jsx`
**Estimated Impact**: ~250-300 lines reduced from App.jsx

**Logic to Extract:**

- 10Hz simulation interval management
- Burner state machine advancement
- Temperature simulation logic
- Flame signal simulation
- Safety system coordination
- State countdown management

**Integration Process:**

1. Add useSimulationLoop import to App.jsx
2. Remove existing simulation useEffect chains
3. Replace with hook initialization using state refs
4. Verify timing and state transitions work correctly
5. Test fast-forward functionality with speed multiplier

#### Step 3: Settings System Integration

**Purpose**: Extract settings, theme, and configuration management
**Files Modified**: `src/App.jsx`
**Estimated Impact**: ~150-200 lines reduced from App.jsx

**Logic to Extract:**

- Settings state management
- Theme handling and persistence
- Configuration preview/apply/cancel logic
- localStorage persistence for settings
- Settings menu coordination

#### Step 4: Layout Management Integration

**Purpose**: Extract responsive grid layout management
**Files Modified**: `src/App.jsx`
**Estimated Impact**: ~100-150 lines reduced from App.jsx

**Logic to Extract:**

- React Grid Layout state management
- Layout persistence to localStorage
- Breakpoint handling
- Layout reset functionality
- Drag and resize handlers

## Technical Considerations

### Performance Optimization

- Maintain ref-based patterns for 10Hz simulation updates
- Minimize re-renders during state transitions
- Preserve memoization patterns for expensive calculations
- Test performance impact of hook integration

### State Coordination

- Ensure proper dependency order between hooks
- Maintain cross-hook communication patterns
- Preserve event coordination timing
- Verify state synchronization accuracy

### Testing Strategy

- Build verification after each integration step
- Functional testing of each extracted system
- Performance testing of simulation loops
- Cross-browser compatibility verification

### Risk Mitigation

- Create integration branches for each step
- Maintain rollback capabilities
- Document all changes for troubleshooting
- Test with real-world usage scenarios

## Expected Outcomes

### After Step 1 (useAppState)

- **App.jsx Size**: ~2,000 lines (down from 2,261)
- **Benefits**: Centralized state management, cleaner debugging
- **Status**: Core state extracted and coordinated

### After Step 2 (useSimulationLoop)

- **App.jsx Size**: ~1,700 lines (down from 2,000)
- **Benefits**: Isolated simulation logic, better timing control
- **Status**: Main simulation logic extracted

### After Step 3 (Settings)

- **App.jsx Size**: ~1,500 lines (down from 1,700)
- **Benefits**: Modular settings management, easier configuration
- **Status**: Settings system extracted

### After Step 4 (Layout)

- **App.jsx Size**: ~1,300-1,400 lines (down from 1,500)
- **Benefits**: Reusable layout patterns, cleaner layout logic
- **Status**: Layout management extracted

### Final Phase 2 State

- **Total Lines Reduced**: ~800-900 lines
- **Hooks Integrated**: 6 of 14 created hooks
- **Architecture**: Clean separation between business logic and presentation
- **App.jsx Role**: Primarily layout orchestration and component coordination

## Phase 3 Preview

After Phase 2 completion, Phase 3 will focus on:

- Analyzer state management extraction
- Meter calculations and timing systems
- CAM mapping and tuning mode logic
- Data history and CSV export systems
- Final App.jsx cleanup to pure orchestration

## Success Criteria

### Functional Requirements

- [ ] All existing functionality preserved
- [ ] Tour system continues to work correctly
- [ ] Panel management remains functional
- [ ] Simulation timing maintains accuracy
- [ ] Settings persistence works correctly

### Technical Requirements

- [ ] Build passes after each integration step
- [ ] No performance degradation in simulation
- [ ] Memory usage remains stable
- [ ] Error handling preserved throughout

### Code Quality Requirements

- [ ] Clean separation of concerns achieved
- [ ] State coordination patterns established
- [ ] Hook dependencies properly managed
- [ ] Documentation updated for new architecture

## Timeline Estimate

- **Pre-Integration Analysis**: 1-2 hours
- **Step 1 (useAppState)**: 3-4 hours
- **Step 2 (useSimulationLoop)**: 3-4 hours
- **Step 3 (Settings)**: 2-3 hours
- **Step 4 (Layout)**: 2-3 hours
- **Testing and Validation**: 2-3 hours
- **Total Estimated Time**: 13-19 hours

This plan provides a systematic approach to integrating the core hooks while maintaining system stability and setting up the foundation for Phase 3 completion.
