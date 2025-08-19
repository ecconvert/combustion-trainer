import { useEffect } from "react";

/**
 * useTuningMode Hook
 * 
 * Manages tuning mode functionality including layout modifications for tuning panel visibility.
 * When tuning mode is enabled, automatically adds or repositions the tuning panel in all layouts
 * to ensure consistent UI experience across different screen sizes.
 * 
 * Features:
 * - Automatic tuning panel injection when tuning mode is enabled
 * - Smart positioning to avoid collisions with existing panels
 * - Responsive layout adjustments for different breakpoints
 * - Legacy layout migration for improved panel placement
 * 
 * @param {boolean} tuningOn - Whether tuning mode is currently enabled
 * @param {Function} setLayouts - Function to update grid layouts
 * @param {Object} defaultLayouts - Default layout configurations for each breakpoint
 * @returns {Object} Tuning mode utilities and state
 */
export default function useTuningMode(tuningOn, setLayouts, defaultLayouts) {
  
  // ----------------------- Layout Management Effect -----------------------
  useEffect(() => {
    if (!tuningOn) return;
    
    setLayouts((prev) => {
      let changed = false;
      const next = { ...prev };
      
      Object.keys(next).forEach((bp) => {
        const arr = Array.isArray(next[bp]) ? next[bp].slice() : [];
        const template = (defaultLayouts[bp] || []).find((it) => it.i === 'tuning');
        const has = arr.find((it) => it.i === 'tuning');
        
        if (!has) {
          // Add tuning panel if it doesn't exist
          const yMax = arr.reduce((m, it) => Math.max(m, it.y + (it.h || 0)), 0);
          const newItem = template ? { ...template, y: yMax } : { 
            i: 'tuning', 
            x: 0, 
            y: yMax, 
            w: 6, 
            h: 18 
          };
          arr.push(newItem);
          next[bp] = arr;
          changed = true;
        } else if (has && template) {
          // Check if existing tuning panel needs repositioning or resizing
          const legacyLike = has.x === 0 && (has.w >= 5 || has.w === prev?.[bp]?.find?.(i=>i.i==='controls')?.w);
          const needsResize = has.w !== template.w || has.h < template.h * 0.8;
          const needsMove = has.x !== template.x;
          
          if (legacyLike || needsResize || needsMove) {
            const updated = { ...has };
            updated.x = template.x;
            updated.w = template.w;
            updated.h = Math.max(has.h, template.h);
            
            let targetY = template.y;
            
            // Check for collisions and find safe position
            const collides = (item, x, w, y, h) => 
              !(item.x + item.w <= x || x + w <= item.x || item.y + item.h <= y || y + h <= item.y);
            
            while (arr.some(it => it.i !== 'tuning' && collides(it, updated.x, updated.w, targetY, updated.h))) {
              const blockers = arr.filter(it => it.i !== 'tuning' && collides(it, updated.x, updated.w, targetY, updated.h));
              const pushDown = Math.max(...blockers.map(b => b.y + b.h));
              targetY = pushDown;
            }
            
            updated.y = targetY;
            next[bp] = arr.map(it => it.i === 'tuning' ? updated : it);
            changed = true;
          }
        }
      });
      
      return changed ? next : prev;
    });
  }, [tuningOn, setLayouts, defaultLayouts]);
  
  // ----------------------- Tuning Mode Utilities -----------------------
  
  /**
   * Checks if tuning panel exists in current layout
   * @param {Array} layout - Current layout array
   * @returns {boolean} Whether tuning panel is present
   */
  const hasTuningPanel = (layout) => {
    return Array.isArray(layout) && layout.some(item => item.i === 'tuning');
  };
  
  /**
   * Gets tuning panel configuration for a specific breakpoint
   * @param {string} breakpoint - Layout breakpoint key
   * @returns {Object|null} Tuning panel configuration or null if not found
   */
  const getTuningPanelConfig = (breakpoint) => {
    if (!defaultLayouts || !defaultLayouts[breakpoint]) return null;
    return defaultLayouts[breakpoint].find(item => item.i === 'tuning') || null;
  };
  
  /**
   * Calculates optimal position for tuning panel in current layout
   * @param {Array} currentLayout - Current layout array
   * @param {Object} panelConfig - Tuning panel configuration
   * @returns {Object} Optimal position {x, y, w, h}
   */
  const calculateOptimalPosition = (currentLayout, panelConfig) => {
    if (!Array.isArray(currentLayout) || !panelConfig) {
      return { x: 0, y: 0, w: 6, h: 18 };
    }
    
    const yMax = currentLayout.reduce((m, it) => Math.max(m, it.y + (it.h || 0)), 0);
    
    return {
      x: panelConfig.x || 0,
      y: Math.max(yMax, panelConfig.y || 0),
      w: panelConfig.w || 6,
      h: panelConfig.h || 18
    };
  };
  
  /**
   * Checks if a position would collide with existing panels
   * @param {Array} layout - Current layout array
   * @param {Object} position - Position to check {x, y, w, h}
   * @param {string} excludeId - Panel ID to exclude from collision check
   * @returns {boolean} Whether position would cause collision
   */
  const wouldCollide = (layout, position, excludeId = 'tuning') => {
    if (!Array.isArray(layout)) return false;
    
    const { x, y, w, h } = position;
    
    return layout.some(item => {
      if (item.i === excludeId) return false;
      
      const itemRight = item.x + item.w;
      const itemBottom = item.y + item.h;
      const posRight = x + w;
      const posBottom = y + h;
      
      return !(itemRight <= x || posRight <= item.x || itemBottom <= y || posBottom <= item.y);
    });
  };
  
  // ----------------------- Return API -----------------------
  return {
    // State
    isActive: tuningOn,
    
    // Utilities
    hasTuningPanel,
    getTuningPanelConfig,
    calculateOptimalPosition,
    wouldCollide,
    
    // Constants
    TUNING_PANEL_ID: 'tuning',
    DEFAULT_TUNING_SIZE: { w: 6, h: 18 },
    MIN_TUNING_SIZE: { w: 3, h: 14 }
  };
}