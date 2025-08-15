/**
 * Tuning walkthrough script for guided boiler calibration.
 * Provides step-by-step instructions for saving cam points at multiple loads.
 */

export interface WalkStep {
  id: string;
  title: string;
  body: string;
  action_hint: string;
  success_criteria: string;
}

export const TUNING_WALKTHROUGH: WalkStep[] = [
  {
    id: "power",
    title: "Power on",
    body: "Turn on. Wait for RUN_AUTO. Purge makes the furnace safe.",
    action_hint: "Click [data-tour='power'] On button",
    success_criteria: "Status shows RUN_AUTO"
  },
  {
    id: "rate30",
    title: "Set 30%",
    body: "Set firing rate to 30%. Let readings stabilize for steady load.",
    action_hint: "Drag [data-tour='firing-rate'] or click [data-tour='cam-30']",
    success_criteria: "Rheostat reads ~30%"
  },
  {
    id: "tune30",
    title: "Open Tuning Mode",
    body: "Toggle Tuning. Save the 30% cam point when stable.",
    action_hint: "Click [data-tour='tuning-toggle'] On, then tune fuel/air",
    success_criteria: "Cam 30% saved"
  },
  {
    id: "observe",
    title: "Read O₂/CO",
    body: "Keep CO safe. Adjust toward target O₂. Excess air affects efficiency.",
    action_hint: "Watch analyzer readings, nudge fuel/air sliders",
    success_criteria: "O₂ near target band; CO acceptable"
  },
  {
    id: "rate70",
    title: "Go to 70%",
    body: "Repeat tuning process and save cam at higher load.",
    action_hint: "Click [data-tour='cam-70'], tune, save",
    success_criteria: "Cam 70% saved"
  },
  {
    id: "export",
    title: "Export CSV",
    body: "Save a reading and export CSV. Field data for your records.",
    action_hint: "Use [data-tour='analyzer'] Save Reading, then export trends",
    success_criteria: "CSV downloaded"
  }
];

/**
 * Helper text for explaining combustion fundamentals during walkthrough
 */
export const FUNDAMENTALS = {
  purge: "Purge removes unburned gases before ignition for safety",
  steadyLoad: "Steady firing rate helps analyzer readings stabilize",
  excessAir: "Extra O₂ above stoichiometric = excess air. Affects efficiency",
  coSafety: "High CO indicates incomplete combustion. Keep under limits",
  camPoints: "Cam points store fuel/air ratios at specific firing rates"
};
