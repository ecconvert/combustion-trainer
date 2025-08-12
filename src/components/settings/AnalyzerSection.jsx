import React from "react";

export default function AnalyzerSection({ values, onChange }) {
  return (
    <div className="space-y-4">
      <label className="block text-sm">
        Sampling interval (sec)
        <input
          type="number"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.samplingSec}
          onChange={(e) => onChange("samplingSec", parseFloat(e.target.value || 0))}
          step="0.1"
          min="0.2"
        />
        {values.samplingSec < 0.2 || values.samplingSec > 60 ? (
          <div className="text-xs text-red-600">0.2–60</div>
        ) : null}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.autostart}
          onChange={(e) => onChange("autostart", e.target.checked)}
        />
        Autostart analyzer
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.showZeroReminder}
          onChange={(e) => onChange("showZeroReminder", e.target.checked)}
        />
        Show zero reminder
      </label>
    </div>
  );
}
