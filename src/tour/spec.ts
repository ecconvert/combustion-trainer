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
    target: 'body',
    content: `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: bold;">🔥 Welcome to Combustion Trainer!</h3>
        <p style="margin: 0 0 8px 0;">This guided tour will teach you how to tune a boiler for optimal efficiency. You'll learn to select fuel, power up, tune at different firing rates, and export your data.</p>
        <p style="margin: 0; font-weight: bold;">Let's get started!</p>
      </div>
    `,
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: "[data-tour='fuel']",
    content: `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">🔧 Step 1: Select Your Fuel</h3>
        <p style="margin: 0;">Each fuel type (Natural Gas, Propane, Fuel Oil #2) has different combustion characteristics and optimal O₂/CO targets. Choose your fuel to begin.</p>
      </div>
    `,
    placement: 'bottom',
  },
  {
    target: "[data-tour='power']",
    content: `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">⚡ Step 2: Power On the Boiler</h3>
        <p style="margin: 0;">Click the Power button to start the boiler. Watch the status sequence progress from OFF → PURGE → IGNITION → RUN_AUTO.</p>
      </div>
    `,
    placement: 'bottom',
  },
  {
    target: "[data-tour='firing-rate']",
    content: `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">🎚️ Step 3: Set Firing Rate</h3>
        <p style="margin: 0;">Control the boiler's firing rate from 0-100%. For optimal tuning, we'll work at both 30% and 70% firing rates to cover the operating range.</p>
      </div>
    `,
    placement: 'bottom',
  },
  {
    target: "[data-tour='regulator']",
    content: `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">🔧 Step 4: Adjust Fuel Pressure</h3>
        <p style="margin: 0;">The pressure regulator controls fuel pressure. Higher pressure provides a wider fuel adjustment range during tuning.</p>
      </div>
    `,
    placement: 'bottom',
  },
  {
    target: "[data-tour='tuning-toggle']",
    content: `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">🎯 Step 5: Enable Tuning Mode</h3>
        <p style="margin: 0;">Turn ON Tuning Mode to manually adjust fuel and air flows. This unlocks the CAM point saving feature for creating your combustion curve.</p>
      </div>
    `,
    placement: 'bottom',
  },
  {
    target: "[data-tour='cam-30']",
    content: `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">📊 Step 6: Tune at 30% Load</h3>
        <p style="margin: 0;">Click the 30% CAM button, then adjust fuel and air to achieve optimal combustion. Save this point when O₂ and CO readings are stable.</p>
      </div>
    `,
    placement: 'bottom',
  },
  {
    target: "[data-tour='cam-70']",
    content: `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">📊 Step 7: Tune at 70% Load</h3>
        <p style="margin: 0;">Now click 70% and repeat the tuning process. This higher firing rate will require different fuel/air settings. Save this point too.</p>
      </div>
    `,
    placement: 'bottom',
  },
  {
    target: "[data-tour='analyzer']",
    content: `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">🔬 Step 8: Use the Analyzer</h3>
        <p style="margin: 0;">The combustion analyzer measures O₂, CO, and NOx levels. Click Start → Insert Probe → Save Reading to document your tuning results.</p>
      </div>
    `,
    placement: 'bottom',
  },
  {
    target: "[data-tour='trends']",
    content: `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">📈 Step 9: Monitor Live Trends</h3>
        <p style="margin: 0;">The trends chart shows real-time combustion data. You can export CSV data from here when your tuning session is complete.</p>
      </div>
    `,
    placement: 'bottom',
  },
  {
    target: "[data-tour='scenarios']",
    content: `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">🧪 Step 10: Try Troubleshooting</h3>
        <p style="margin: 0;">Practice with scenarios like 'Low air, hot stack' or 'High draft, cold stack' to learn how different conditions affect combustion.</p>
      </div>
    `,
    placement: 'bottom',
  },
  {
    target: "[data-tour='settings']",
    content: `
      <div>
        <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold;">⚙️ Final Step: Settings & Checklist</h3>
        <p style="margin: 0 0 8px 0;">Access settings for units, themes, and data export. Quick checklist:</p>
        <ul style="margin: 0; padding-left: 20px;">
          <li>✓ Fuel selected</li>
          <li>✓ Boiler reached RUN_AUTO</li>
          <li>✓ CAM points saved</li>
          <li>✓ Data exported</li>
        </ul>
        <p style="margin: 8px 0 0 0; font-weight: bold;">Great job completing the tour! 🎉</p>
      </div>
    `,
    placement: 'bottom',
  },
];
