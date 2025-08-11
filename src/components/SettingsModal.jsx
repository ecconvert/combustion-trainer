import React, { useState } from "react";
import { useUI, defaultConfig } from "../uiStore.jsx";

export default function SettingsModal({ open, onClose }) {
  const { state, setState } = useUI();
  const [form, setForm] = useState(state.config);

  if (!open) return null;

  const apply = () => {
    setState((s) => ({ ...s, config: form }));
    onClose();
  };

  const cancel = () => {
    setForm(state.config);
    onClose();
  };

  const restore = () => {
    if (window.confirm("Restore default settings?")) {
      setForm(defaultConfig);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white w-full h-full md:h-auto md:w-96 p-4 rounded-md shadow-lg overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <div className="space-y-3">
          <label className="block text-sm">
            Theme
            <select
              className="border rounded-md w-full px-2 py-1 mt-1"
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>

          <label className="block text-sm">
            Units
            <select
              className="border rounded-md w-full px-2 py-1 mt-1"
              value={form.units}
              onChange={(e) => setForm({ ...form, units: e.target.value })}
            >
              <option value="imperial">Imperial</option>
              <option value="metric">Metric</option>
            </select>
          </label>

          <label className="block text-sm">
            Analyzer sampling rate (s)
            <input
              type="number"
              className="border rounded-md w-full px-2 py-1 mt-1"
              value={form.sampleRate}
              onChange={(e) => setForm({ ...form, sampleRate: parseFloat(e.target.value) || 0 })}
            />
          </label>

          <label className="block text-sm">
            Trend length (points)
            <input
              type="number"
              className="border rounded-md w-full px-2 py-1 mt-1"
              value={form.trendLength}
              onChange={(e) => setForm({ ...form, trendLength: parseInt(e.target.value) || 0 })}
            />
          </label>
        </div>
        <div className="mt-6 flex justify-between">
          <button className="btn" onClick={restore}>Restore Defaults</button>
          <div className="space-x-2">
            <button className="btn" onClick={cancel}>Cancel</button>
            <button className="btn btn-primary" onClick={apply}>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
}
