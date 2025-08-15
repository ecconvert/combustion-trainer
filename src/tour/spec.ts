/**
 * Tour specifications for the Combustion Trainer onboarding experience.
 * Defines feature mapping and Joyride step configurations.
 */

export interface FeatureInfo {
  id: string;
  selector: string;
  name: string;
  purpose: string;
  sanity_check: string;
}

export const FEATURE_MAP: FeatureInfo[] = [
  {
    id: "fuel",
    selector: "[data-tour='fuel']",
    name: "Fuel Selector",
    purpose: "Pick a fuel type. Each fuel changes typical O₂/CO targets.",
    sanity_check: "Dropdown with Natural Gas, Propane, Fuel Oil #2, Biodiesel options"
  },
  {
    id: "power",
    selector: "[data-tour='power']",
    name: "Boiler Power",
    purpose: "Turn boiler on/off. Watch status sequence run to RUN_AUTO.",
    sanity_check: "On/Off buttons toggle boiler power state"
  },
  {
    id: "firing-rate",
    selector: "[data-tour='firing-rate']",
    name: "Firing Rate",
    purpose: "Set firing rate 0-100%. We will tune at 30% and 70%.",
    sanity_check: "Slider controls rheostat percentage"
  },
  {
    id: "regulator",
    selector: "[data-tour='regulator']",
    name: "Pressure Regulator",
    purpose: "Adjust fuel pressure. Higher pressure = wider fuel range.",
    sanity_check: "Number input for pump/manifold pressure"
  },
  {
    id: "tuning-toggle",
    selector: "[data-tour='tuning-toggle']",
    name: "Tuning Mode",
    purpose: "Enable manual fuel/air adjustment and cam point saving.",
    sanity_check: "Off/On buttons toggle tuning mode"
  },
  {
    id: "cam-30",
    selector: "[data-tour='cam-30']",
    name: "Cam 30% Point",
    purpose: "Save fuel/air settings at 30% firing rate.",
    sanity_check: "Button labeled 30% in cam intervals section"
  },
  {
    id: "cam-70",
    selector: "[data-tour='cam-70']",
    name: "Cam 70% Point",
    purpose: "Save fuel/air settings at 70% firing rate.",
    sanity_check: "Button labeled 70% in cam intervals section"
  },
  {
    id: "analyzer",
    selector: "[data-tour='analyzer']",
    name: "Combustion Analyzer",
    purpose: "Shows O₂, CO, NOx readings. Save readings here.",
    sanity_check: "Panel with Start, Insert Probe, Hold/Resume buttons"
  },
  {
    id: "trends",
    selector: "[data-tour='trends']",
    name: "Live Trends",
    purpose: "Chart showing O₂, CO, NOx, stack temp over time.",
    sanity_check: "Line chart with colored trend lines"
  },
  {
    id: "scenarios",
    selector: "[data-tour='scenarios']",
    name: "Troubleshooting Scenarios",
    purpose: "Simulate common field problems like low air or dirty nozzles.",
    sanity_check: "Dropdown with scenario options like 'Low air, hot stack'"
  },
  {
    id: "settings",
    selector: "[data-tour='settings']",
    name: "Settings Menu",
    purpose: "Access units, themes, export options, and restart this tour.",
    sanity_check: "Settings button opens configuration modal"
  }
];

export const JOYRIDE_STEPS = [
  {
    target: "[data-tour='fuel']",
    content: "Welcome! Today you'll pick a fuel, power up, tune at 30% and 70%, then export data. Let's start with fuel selection.",
  },
  {
    target: "[data-tour='fuel']",
    content: "Pick a fuel. Each fuel changes typical O₂/CO targets.",
  },
  {
    target: "[data-tour='power']",
    content: "Power on. Watch status sequence run to RUN_AUTO.",
  },
  {
    target: "[data-tour='firing-rate']",
    content: "Set firing rate 0-100%. We will tune at 30% and 70%.",
  },
  {
    target: "[data-tour='regulator']",
    content: "Adjust fuel pressure. Higher pressure = wider fuel range.",
  },
  {
    target: "[data-tour='tuning-toggle']",
    content: "Enable Tuning Mode to adjust fuel and air manually.",
  },
  {
    target: "[data-tour='cam-30']",
    content: "Click 30% then tune. Save this cam point when stable.",
  },
  {
    target: "[data-tour='cam-70']",
    content: "Click 70% then tune. Save this cam point too.",
  },
  {
    target: "[data-tour='analyzer']",
    content: "Analyzer shows O₂, CO, NOx. Start → Insert Probe → Save Reading.",
  },
  {
    target: "[data-tour='trends']",
    content: "Live trends chart. Export CSV from here when done.",
  },
  {
    target: "[data-tour='scenarios']",
    content: "Try troubleshooting scenarios like 'Low air, hot stack'.",
  },
  {
    target: "[data-tour='settings']",
    content: "Settings for units, themes, export, and restarting this tour. Quick checklist: Fuel picked ✓ RUN_AUTO seen ✓ Cam saved ✓ CSV exported ✓",
  },
];
