import { useState, useCallback, useEffect, useRef } from 'react';

// ----------------------- Constants -----------------------
const SAVED_KEY = "ct_saved_v1";

// ----------------------- Helper functions -----------------------
function loadSaved() {
  try {
    const raw = localStorage.getItem(SAVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error("Failed to load saved readings:", e);
    return [];
  }
}

function persistSaved(next) {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  } catch (e) {
    console.error("Failed to persist saved readings:", e);
  }
}

/**
 * Hook for managing data history and saved readings
 * Handles real-time data collection, saved readings persistence, and CSV export
 */
export default function useDataHistory({ 
  config, 
  rheostat, 
  fuelFlowRef, 
  airFlowRef, 
  dispRef 
}) {
  // ----------------------- State -----------------------
  const [saved, setSaved] = useState(loadSaved); // persistent saved readings
  const [history, setHistory] = useState([]); // real-time trend data
  const rheostatRef = useRef(rheostat);

  // ----------------------- Keep refs updated -----------------------
  useEffect(() => { 
    rheostatRef.current = rheostat; 
  }, [rheostat]);

  // ----------------------- Real-time data collection -----------------------
  useEffect(() => {
    const id = setInterval(() => {
      const now = Date.now();
      const row = {
        ts: now,
        t: new Date(now).toLocaleTimeString(),
        Rate: rheostatRef.current,
        FuelFlow: Number(parseFloat(fuelFlowRef.current).toFixed(2)),
        AirFlow: Number(parseFloat(airFlowRef.current).toFixed(2)),
        O2: Number(dispRef.current.O2.toFixed(2)),
        CO2: Number(dispRef.current.CO2.toFixed(2)),
        CO: Math.round(dispRef.current.CO),
        NOx: Math.round(dispRef.current.NOx),
        StackF: Math.round(dispRef.current.StackF),
        Eff: Number(Number(dispRef.current.Eff).toFixed(1)),
      };
      setHistory((h) => [...h.slice(-config.general.trendLength), row]);
    }, config.analyzer.samplingSec * 1000);
    
    return () => clearInterval(id);
  }, [config.analyzer.samplingSec, config.general.trendLength, fuelFlowRef, airFlowRef, dispRef]);

  // ----------------------- Saved readings management -----------------------
  const saveReading = useCallback((snapshot) => {
    const row = { id: crypto.randomUUID(), t: Date.now(), ...snapshot };
    setSaved((prev) => {
      const next = [row, ...prev];
      persistSaved(next);
      return next;
    });
  }, []);

  const exportSavedReadings = useCallback(() => {
    if (!saved.length) return;
    
    const headers = [
      "id",
      "t",
      "fuel",
      "setFire",
      "airFlow",
      "fuelFlow",
      "stackF",
      "O2",
      "CO2",
      "COppm",
      "NOxppm",
      "excessAir",
      "efficiency",
      "notes",
    ];
    
    const lines = [headers.join(",")].concat(
      saved.map((r) =>
        [
          r.id,
          new Date(r.t).toISOString(),
          r.fuel ?? "",
          r.setFire ?? "",
          r.airFlow ?? "",
          r.fuelFlow ?? "",
          r.stackF ?? "",
          r.O2 ?? "",
          r.CO2 ?? "",
          r.COppm ?? "",
          r.NOxppm ?? "",
          r.excessAir ?? "",
          r.efficiency ?? "",
          JSON.stringify(r.notes ?? ""),
        ].join(","),
      ),
    );
    
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "saved_readings.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [saved]);

  const clearSavedReadings = useCallback(() => {
    setSaved([]);
    persistSaved([]);
  }, []);

  const deleteSavedReading = useCallback((id) => {
    setSaved((prev) => {
      const next = prev.filter(r => r.id !== id);
      persistSaved(next);
      return next;
    });
  }, []);

  return {
    // State
    saved,
    setSaved,
    history,
    setHistory,
    
    // Actions
    saveReading,
    exportSavedReadings,
    clearSavedReadings,
    deleteSavedReading,
    
    // Helper functions
    loadSaved,
    persistSaved,
  };
}