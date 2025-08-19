import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook for managing gas analyzer simulation
 * Handles analyzer state machine, menu navigation, probe management, zero calibration
 */
export default function useAnalyzer() {
  // ----------------------- Core analyzer state -----------------------
  const [anState, setAnState] = useState("OFF");
  const [probeInFlue, setProbeInFlue] = useState(false);
  const [zeroProgress, setZeroProgress] = useState(0);
  const ZERO_DURATION_MS = 6000; // 6s stabilization demo

  // ----------------------- Menu navigation state -----------------------
  const [anMenuOpen, setAnMenuOpen] = useState(false);
  const [anMenuScreen, setAnMenuScreen] = useState('MAIN'); // MAIN | MEASUREMENTS | FUEL | LIVE | RECORDS | SETTINGS | DIAGNOSIS
  const [anMenuIndex, setAnMenuIndex] = useState(0);
  const [selectedMeasurement, setSelectedMeasurement] = useState(null); // e.g. 'Flue Gas Analysis'
  const [selectedFuel, setSelectedFuel] = useState(null);

  // ----------------------- Menu constants -----------------------
  const mainMenuItems = useMemo(() => [
    'Measurements',
    'Measurement Records',
    'Device Settings',
    'Instrument Diagnosis',
  ], []);
  
  const measurementItems = useMemo(() => [
    'Flue Gas Analysis',
    'Draught Measurement',
    'Differential Pressure',
    'CO Ambient',
  ], []);
  
  const fuelItems = useMemo(() => [
    'Natural Gas',
    'Light Oil',
    'Wood Pellets',
  ], []);

  // ----------------------- Analyzer actions -----------------------
  const startAnalyzer = useCallback(() => setAnState("ZERO"), []);
  const finishZero = useCallback(() => setAnState("READY"), []);
  const holdAnalyzer = useCallback(() => setAnState("HOLD"), []);
  const resumeAnalyzer = useCallback(() => setAnState("SAMPLING"), []);
  
  const insertProbe = useCallback(() => {
    setProbeInFlue(true);
    setAnState("SAMPLING");
  }, []);
  
  const removeProbe = useCallback(() => {
    setProbeInFlue(false);
  }, []);

  const stopAnalyzer = useCallback(() => {
    setProbeInFlue(false);
    setAnState('READY');
    setAnMenuScreen('MAIN');
  }, []);

  // ----------------------- Menu navigation -----------------------
  const openMenu = useCallback(() => {
    if (anState !== 'OFF') {
      setAnMenuOpen((o) => !o);
      setAnMenuScreen('MAIN');
      setAnMenuIndex(0);
    }
  }, [anState]);

  const closeMenu = useCallback(() => {
    setAnMenuOpen(false);
  }, []);
  const handleMenuNav = useCallback((dir) => {
    if (!anMenuOpen) return;
    const list = anMenuScreen === 'MAIN' ? mainMenuItems
      : anMenuScreen === 'MEASUREMENTS' ? measurementItems
      : anMenuScreen === 'FUEL' ? fuelItems
      : [];
    if (!list.length) return;
    setAnMenuIndex((i) => {
      const next = (i + (dir === 'up' ? -1 : 1) + list.length) % list.length;
      return next;
    });
  }, [anMenuOpen, anMenuScreen, mainMenuItems, measurementItems, fuelItems]);

  const handleMenuOk = useCallback(() => {
    if (!anMenuOpen) return;
    if (anMenuScreen === 'MAIN') {
      const sel = mainMenuItems[anMenuIndex];
      if (sel === 'Measurements') { setAnMenuScreen('MEASUREMENTS'); setAnMenuIndex(0); }
      else if (sel === 'Measurement Records') { setAnMenuScreen('RECORDS'); }
      else if (sel === 'Device Settings') { setAnMenuScreen('SETTINGS'); }
      else if (sel === 'Instrument Diagnosis') { setAnMenuScreen('DIAGNOSIS'); }
    } else if (anMenuScreen === 'MEASUREMENTS') {
      const sel = measurementItems[anMenuIndex];
      setSelectedMeasurement(sel);
      if (sel === 'Flue Gas Analysis') {
        setAnMenuScreen('FUEL');
        setAnMenuIndex(0);
      } else {
        setAnMenuScreen('LIVE');
      }
    } else if (anMenuScreen === 'FUEL') {
      const sel = fuelItems[anMenuIndex];
      setSelectedFuel(sel);
      setAnMenuScreen('LIVE');
    } else if (anMenuScreen === 'LIVE') {
      if (anState === 'READY' && !probeInFlue) insertProbe();
    }
  }, [anMenuOpen, anMenuScreen, anMenuIndex, mainMenuItems, measurementItems, fuelItems, anState, probeInFlue, insertProbe]);

  const handleMenuEsc = useCallback(() => {
    if (!anMenuOpen) return;
    if (anMenuScreen === 'MAIN') { setAnMenuOpen(false); return; }
    if (anMenuScreen === 'MEASUREMENTS') { setAnMenuScreen('MAIN'); setAnMenuIndex(0); return; }
    if (anMenuScreen === 'FUEL') { setAnMenuScreen('MEASUREMENTS'); setAnMenuIndex(0); return; }
    if (anMenuScreen === 'LIVE') { setAnMenuScreen('MAIN'); return; }
    if (['RECORDS','SETTINGS','DIAGNOSIS'].includes(anMenuScreen)) { setAnMenuScreen('MAIN'); return; }
  }, [anMenuOpen, anMenuScreen]);

  // ----------------------- Zero calibration progress -----------------------
  useEffect(() => {
    let id = null;
    if (anState === 'ZERO') {
      const start = Date.now();
      setZeroProgress(0);
      id = setInterval(() => {
        const elapsed = Date.now() - start;
        const pct = Math.min(100, Math.round((elapsed / ZERO_DURATION_MS) * 100));
        setZeroProgress(pct);
      }, 100);
    } else {
      setZeroProgress(0);
    }
    return () => { if (id) clearInterval(id); };
  }, [anState, ZERO_DURATION_MS]);

  // ----------------------- Helper functions -----------------------
  const getHelpText = useCallback(() => {
    const help = {
      OFF: 'Analyzer is powered down. Click Start to begin zeroing (ambient baseline).',
      ZERO: 'ZERO: Establishing baseline in ambient air – wait, then click Finish Zero when stable.',
      READY: 'READY: Baseline captured, electronics stable. Safe to Insert Probe into the flue.',
      SAMPLING: 'SAMPLING: Probe in flue; readings updating in real time. Wait for stability before saving.',
      HOLD: 'HOLD: Sampling paused – gas path isolated. Resume to continue updating readings.'
    };
    return help[anState] || '';
  }, [anState]);

  return {
    // Core state
    anState,
    setAnState,
    probeInFlue,
    setProbeInFlue,
    zeroProgress,
    ZERO_DURATION_MS,
    
    // Menu state
    anMenuOpen,
    setAnMenuOpen,
    anMenuScreen,
    setAnMenuScreen,
    anMenuIndex,
    setAnMenuIndex,
    selectedMeasurement,
    setSelectedMeasurement,
    selectedFuel,
    setSelectedFuel,
    
    // Menu constants
    mainMenuItems,
    measurementItems,
    fuelItems,
    
    // Actions
    startAnalyzer,
    finishZero,
    holdAnalyzer,
    resumeAnalyzer,
    insertProbe,
    removeProbe,
    stopAnalyzer,
    
    // Menu navigation
    handleMenuNav,
    handleMenuOk,
    handleMenuEsc,
    openMenu,
    closeMenu,
    
    // Helpers
    getHelpText,
  };
}