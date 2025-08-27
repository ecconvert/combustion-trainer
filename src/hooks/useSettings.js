import { useState, useRef } from "react";
import { saveConfig, getDefaultConfig } from "../lib/config";

/**
 * useSettings Hook
 *
 * Manages application settings, configuration persistence, and settings modal state.
 * Handles configuration loading, validation, theme management, and live preview functionality.
 *
 * Features:
 * - Config state management with localStorage persistence
 * - Settings modal visibility control
 * - Live preview with rollback capability
 * - Theme management integration
 * - Simulation speed control for tours
 * - Tuning mode state management
 *
 * @param {Object} initialConfig - Initial configuration object
 * @returns {Object} Settings state and control functions
 */
export default function useSettings(initialConfig = null) {
  // ----------------------- Core Config State -----------------------
  const [config, setConfig] = useState(initialConfig || getDefaultConfig());
  const configBeforeSettings = useRef(null);

  // ----------------------- Settings Modal State -----------------------
  const [showSettings, setShowSettings] = useState(false);

  // ----------------------- Simulation Settings -----------------------
  // Note: simSpeedMultiplier moved to useTour hook to avoid conflicts
  const [tuningOn, setTuningOn] = useState(false);

  // ----------------------- Derived Values -----------------------
  const unitSystem = config.units.system;
  const theme = config.general?.theme || "light";

  // ----------------------- Global Window API -----------------------
  // Note: Simulation speed controls moved to useTour hook to prevent conflicts

  // ----------------------- Settings Modal Handlers -----------------------

  /**
   * Opens settings modal and stores current config for potential rollback
   */
  const openSettings = () => {
    configBeforeSettings.current = structuredClone(config);
    setShowSettings(true);
  };

  /**
   * Applies new configuration and closes modal
   * @param {Object} nextConfig - New configuration to apply
   */
  const handleApply = (nextConfig) => {
    setConfig(nextConfig);
    saveConfig(nextConfig);
    setShowSettings(false);
    configBeforeSettings.current = null;
  };

  /**
   * Cancels settings changes and reverts to previous config
   */
  const handleCancel = () => {
    if (configBeforeSettings.current) {
      setConfig(configBeforeSettings.current);
    }
    setShowSettings(false);
    configBeforeSettings.current = null;
  };

  /**
   * Live preview handler for settings changes
   * @param {Object} nextConfig - Configuration to preview
   * @param {Object} _meta - Metadata about the change (section, field)
   */
  const handlePreview = (nextConfig, _meta) => {
    setConfig(nextConfig);
    // Theme changes are handled externally via config updates
  };

  // ----------------------- Config Management -----------------------

  /**
   * Updates configuration and persists to localStorage
   * @param {Object} updates - Partial configuration updates
   */
  const updateConfig = (updates) => {
    const nextConfig = { ...config, ...updates };
    setConfig(nextConfig);
    saveConfig(nextConfig);
  };

  /**
   * Updates a specific section of the configuration
   * @param {string} section - Configuration section name
   * @param {Object} updates - Updates for the section
   */
  const updateConfigSection = (section, updates) => {
    const nextConfig = {
      ...config,
      [section]: { ...config[section], ...updates },
    };
    setConfig(nextConfig);
    saveConfig(nextConfig);
  };

  /**
   * Resets configuration to defaults
   */
  const resetConfig = () => {
    const defaultConfig = getDefaultConfig();
    setConfig(defaultConfig);
    saveConfig(defaultConfig);
  };

  // ----------------------- Simulation Control -----------------------

  /**
   * Toggles tuning mode on/off
   */
  const toggleTuning = () => {
    setTuningOn((prev) => !prev);
  };

  /**
   * Sets tuning mode explicitly
   * @param {boolean} enabled - Whether tuning mode should be enabled
   */
  const setTuning = (enabled) => {
    setTuningOn(enabled);
  };

  // ----------------------- Return API -----------------------
  return {
    // Core configuration
    config,
    setConfig,
    updateConfig,
    updateConfigSection,
    resetConfig,

    // Derived values
    unitSystem,
    theme,

    // Settings modal
    showSettings,
    setShowSettings,
    openSettings,
    handleApply,
    handleCancel,
    handlePreview,

    // Tuning mode
    tuningOn,
    setTuningOn,
    toggleTuning,
    setTuning,

    // Internal state for rollback
    configBeforeSettings,
  };
}
