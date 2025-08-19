/**
 * usePanelManagement Hook
 * 
 * Manages panel system functionality including:
 * - Panel zone assignments (main, techDrawer, etc.)
 * - Zone persistence to localStorage
 * - Panel filtering and organization by zone
 * - Legacy migration for old zone data
 * - Panel movement between zones
 * 
 * Extracted from App.jsx for modular architecture.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { panels, defaultZoneById } from '../panels';

const ZONES_KEY = "ct_zones_v1";
const RGL_LS_KEY = "ct_layouts_v2";

function loadZones() {
  try {
    return JSON.parse(localStorage.getItem(ZONES_KEY)) || defaultZoneById;
  } catch (e) {
    console.error("Failed to load zones from localStorage:", e);
    return defaultZoneById;
  }
}

function saveZones(z) {
  try {
    localStorage.setItem(ZONES_KEY, JSON.stringify(z));
  } catch (e) {
    console.error("Failed to save zones to localStorage:", e);
  }
}

export function usePanelManagement() {
  // Zone management state
  const [zones, setZones] = useState(loadZones());

  // Move panel to a different zone
  const dock = useCallback((id, zone) => {
    setZones((prev) => {
      const next = { ...prev, [id]: zone };
      saveZones(next);
      return next;
    });
  }, []);

  // Filter panels by zone
  const mainItems = useMemo(
    () => Object.keys(panels).filter((id) => zones[id] === "main"),
    [zones],
  );

  // Get panels for a specific zone
  const getPanelsForZone = useCallback((zoneName) => {
    return Object.keys(panels).filter((id) => zones[id] === zoneName);
  }, [zones]);

  // Legacy migration effects
  useEffect(() => {
    try {
      const zonesRaw = localStorage.getItem(ZONES_KEY);
      const zonesObj = zonesRaw ? JSON.parse(zonesRaw) : null;
      
      // Ensure saved panel is in techDrawer by default
      if (!zonesObj || zonesObj.saved == null) {
        const next = { ...(zonesObj || {}), saved: "techDrawer" };
        localStorage.setItem(ZONES_KEY, JSON.stringify(next));
      }

      // Clean up old saved panel from layouts
      const layoutsRaw = localStorage.getItem(RGL_LS_KEY);
      if (layoutsRaw) {
        const parsed = JSON.parse(layoutsRaw);
        let changed = false;
        Object.keys(parsed).forEach((bp) => {
          const arr = parsed[bp];
          const filtered = arr.filter((it) => it.i !== "saved");
          if (filtered.length !== arr.length) {
            parsed[bp] = filtered;
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(RGL_LS_KEY, JSON.stringify(parsed));
        }
      }
    } catch (e) {
      console.error("Failed to migrate panel zones:", e);
    }
  }, []);

  // Get panel configuration
  const getPanelConfig = useCallback((id) => {
    return panels[id];
  }, []);

  // Get all available panels
  const getAllPanels = useCallback(() => {
    return panels;
  }, []);

  // Get current zone for a panel
  const getPanelZone = useCallback((id) => {
    return zones[id];
  }, [zones]);

  return {
    // State
    zones,
    mainItems,
    
    // Actions
    dock,
    getPanelsForZone,
    getPanelConfig,
    getAllPanels,
    getPanelZone,
    
    // Panel definitions (for compatibility)
    panels
  };
}