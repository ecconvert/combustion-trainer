/**
 * Tour specifications for the Combustion Trainer onboarding experience.
 * Defines feature mapping and Joyride step configurations.
 */

import React from 'react';

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
    content: (
      <div>
        <h3>🔥 Welcome to Combustion Trainer!</h3>
        <p>
          This guided tour will teach you how to safely start up and tune a boiler for optimal efficiency. 
          You'll learn the proper startup sequence, tuning procedures, and data collection methods.
        </p>
        <p><strong>Let's begin with a safe, methodical startup!</strong></p>
      </div>
    ),
  placement: 'center' as any,
    disableBeacon: true,
  },
  {
    target: "[data-tour='fuel']",
    content: (
      <div>
        <h4>🔧 Step 1: Select Your Fuel</h4>
        <p>
          <strong>Always start by selecting your fuel type first!</strong> Each fuel 
          (Natural Gas, Propane, Fuel Oil #2) has different combustion characteristics 
          and safety requirements.
        </p>
        <p>Choose your fuel to establish the baseline parameters.</p>
      </div>
    ),
  placement: 'bottom' as any,
  },
  {
    target: "[data-tour='power']",
    content: (
      <div>
        <h4>⚡ Step 2: Power On the Boiler</h4>
        <p>
          <strong>We'll start this boiler for you!</strong> The tour will automatically 
          turn on the boiler power so you can see the complete startup sequence.
        </p>
        <p>
          In real life, you would click <code>On</code> here to energize the boiler control system.
        </p>
        <p><strong>Note:</strong> If you cancel the tour, the boiler will return to its original state.</p>
      </div>
    ),
  placement: 'top' as any,
  },
  {
    target: "[data-tour='programmer']",
    content: (
      <div>
        <h4>� Step 3: Monitor the Programmer (EP160)</h4>
        <p>
          The <strong>Programmer (EP160)</strong> panel shows the current burner state and controls the startup sequence. 
          This is your "brain" of the boiler system.
        </p>
        <p>
          <strong>⚡ Fast-Forward Enabled!</strong> We're speeding up the startup sequence for this tutorial. 
          Normally this takes 30-60 seconds, but we'll show it in just a few seconds.
        </p>
        <p>
          <strong>🚀 Watch the automatic startup sequence:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li><strong>State:</strong> STANDBY → PREPURGE → TRIAL → RUN_AUTO</li>
          <li><strong>LEDs:</strong> Watch T5 Spark ⚡, T6 Pilot 🔥, T7 Main flame 🔥</li>
          <li><strong>Flame Signal:</strong> Real-time flame intensity (20-80 is normal)</li>
        </ul>
        <p><strong>👀 The tour started the boiler - watch for RUN_AUTO status!</strong></p>
      </div>
    ),
  placement: 'top' as any,
  },
  {
    target: "[data-tour='firing-rate']",
    content: (
      <div>
        <h4>🎚️ Step 4: Set Initial Firing Rate</h4>
        <p>
          Once the programmer shows <code>RUN_AUTO</code>, you can safely adjust the firing rate. 
          Start low (around 30%) for initial tuning, then work up to higher rates.
        </p>
        <p><strong>Best Practice:</strong> Always tune at multiple firing rates (30% and 70%).</p>
      </div>
    ),
  placement: 'bottom' as any,
  },
  {
    target: "[data-tour='technician']",
    content: (
      <div>
        <h4>🔧 Step 5: Open Technician Tools</h4>
        <p>
          Click the <strong>Technician</strong> button to access advanced tuning controls. 
          This opens the technician drawer with specialized tools and settings.
        </p>
        <p><strong>👆 Go ahead and click it now!</strong> The tour will automatically open the drawer for you.</p>
        <p><strong>Pro Tip:</strong> The technician panel contains all the tools for manual tuning!</p>
      </div>
    ),
  placement: 'left' as any,
  },
  {
    target: "[data-tour='tuning-toggle']",
    content: (
      <div>
        <h4>🎯 Step 6: Enable Tuning Mode</h4>
        <p>
          Turn <strong>ON</strong> Tuning Mode to manually adjust fuel and air flows. 
          This unlocks the CAM point saving feature for creating your combustion curve.
        </p>
        <p><strong>Safety Note:</strong> Only adjust fuel/air when burner is running stable.</p>
        <p><em>Note: CAM interval buttons (0%, 10%, 20%, etc.) will appear when tuning mode is enabled!</em></p>
      </div>
    ),
  placement: 'left' as any,
    disableBeacon: true,
  },
  {
    target: "[data-tour='analyzer']",
    content: (
      <div>
        <h4>🔬 Step 7: Start the Analyzer</h4>
        <p>
          Click <strong>Start/Zero</strong> to initialize the combustion analyzer. 
          Wait for it to reach <strong>Ready</strong> status before proceeding.
        </p>
        <p><strong>Tip:</strong> Always zero the analyzer before taking readings!</p>
      </div>
    ),
  placement: 'left' as any,
  },
  {
    target: "[data-tour='analyzer']",
    content: (
      <div>
        <h4>📏 Step 8: Insert Probe & Sample</h4>
        <p>
          Once Ready, click <strong>Insert Probe</strong> to begin sampling. The analyzer 
          will measure O<sub>₂</sub>, CO, CO<sub>af</sub>, and NO<sub>x</sub> levels.
        </p>
        <p><strong>Wait for stable readings</strong> before making adjustments!</p>
      </div>
    ),
  placement: 'left' as any,
  },
  {
    target: "[data-tour='cam-30']",
    content: (
      <div>
        <h4>📊 Step 9: Tune at 30% Load</h4>
        <p>
          Click the <strong>30% CAM</strong> button, then adjust fuel and air to achieve 
          optimal combustion (target O<sub>₂</sub> levels per your fuel type).
        </p>
        <p><strong>Save this point</strong> when readings are stable and within targets.</p>
        <p><em>The CAM buttons appear when tuning mode is ON for easy 10% interval tuning!</em></p>
      </div>
    ),
  placement: 'left' as any,
  },
  {
    target: "[data-tour='cam-70']",
    content: (
      <div>
        <h4>🔧 Step 10: Tune at 70% Load</h4>
        <p>
          Now click <strong>70%</strong> and repeat the tuning process. Higher firing rates 
          typically require different fuel/air ratios for optimal efficiency.
        </p>
        <p><strong>Save this point too</strong> - you're building your combustion curve!</p>
      </div>
    ),
    placement: 'left',
  },
  {
    target: "[data-tour='trends']",
    content: (
      <div>
        <h4>📈 Step 11: Monitor Live Trends</h4>
        <p>
          The trends chart shows real-time combustion data. This helps you see how 
          changes affect performance over time.
        </p>
        <p><strong>Professional Tip:</strong> Watch for stable, consistent readings!</p>
      </div>
    ),
  placement: 'bottom' as any,
  },
  {
    target: "[data-tour='scenarios']",
    content: (
      <div>
        <h4>🧪 Step 12: Practice Troubleshooting</h4>
        <p>
          Try scenarios like <em>"Low air, hot stack"</em> or <em>"Dirty nozzles"</em> 
          to learn how different field conditions affect combustion.
        </p>
        <p><strong>Real-world skill:</strong> Diagnosing problems from analyzer readings!</p>
      </div>
    ),
  placement: 'left' as any,
  },
  {
    target: "[data-tour='settings']",
    content: (
      <div>
        <h4>⚙️ Completion Checklist</h4>
        <p>
          Great job! Here's your startup and tuning checklist:
        </p>
        <ul>
          <li>✓ Fuel selected and pressure set</li>
          <li>✓ Programmer monitored through startup sequence</li>
          <li>✓ Boiler safely started to <code>RUN_AUTO</code></li>
          <li>✓ Technician drawer opened</li>
          <li>✓ Tuning mode enabled</li>
          <li>✓ Analyzer started and calibrated</li>
          <li>✓ CAM points saved at multiple loads</li>
          <li>✓ Data exported for records</li>
        </ul>
        <p><strong>You're now ready for professional combustion tuning! 🎉</strong></p>
        <p><em>Use Settings to restart this tour anytime.</em></p>
      </div>
    ),
  placement: 'left' as any,
  },
];