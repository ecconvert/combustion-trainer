import React from "react";

export default function GeneralSection({ values, onChange, onResetLayouts, onCloseSettings }) {
  return (
    <div className="space-y-4">
      <label className="block text-sm">
        Theme
        <select
          className="mt-1 border rounded-md px-2 py-1 w-full dark:bg-slate-800 dark:border-slate-600"
          value={values.theme}
          onChange={(e) => onChange("theme", e.target.value)}
        >
          <option value="light">Light</option>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </label>
      <label className="block text-sm">
        Default view
        <select
          className="mt-1 border rounded-md px-2 py-1 w-full dark:bg-slate-800 dark:border-slate-600"
          value={values.defaultView}
          onChange={(e) => onChange("defaultView", e.target.value)}
        >
          <option value="main">Main</option>
          <option value="techDrawer">Technician drawer</option>
        </select>
      </label>
      <label className="block text-sm">
        Trend length (samples)
        <input
          type="number"
          className="mt-1 border rounded-md px-2 py-1 w-full dark:bg-slate-800 dark:border-slate-600"
          value={values.trendLength}
          onChange={(e) => onChange("trendLength", parseInt(e.target.value || 0, 10))}
        />
        {values.trendLength < 60 || values.trendLength > 10000 ? (
          <div className="text-xs text-red-600">60–10000</div>
        ) : null}
      </label>
      
      <div className="border-t pt-4">
        <label className="block text-sm mb-2">
          Onboarding Tour
        </label>
        <button
          type="button"
          className="btn w-full"
          onClick={() => {
            if (window.startCombustionTour) {
              window.startCombustionTour();
            }
            // Close the settings menu for a smoother experience
            if (onCloseSettings) {
              onCloseSettings();
            }
          }}
        >
          Start Tour
        </button>
        <div className="text-xs text-slate-500 mt-1">
          Replay the guided introduction to all features
        </div>
      </div>

      {onResetLayouts && (
        <div className="border-t pt-4">
          <label className="block text-sm mb-2">
            Layout
          </label>
          <button
            type="button"
            className="btn w-full"
            data-testid="btn-reset-layout"
            onClick={onResetLayouts}
          >
            Reset Layout
          </button>
          <div className="text-xs text-slate-500 mt-1">
            Restore the default panel layout and positions
          </div>
        </div>
      )}
    </div>
  );
}
