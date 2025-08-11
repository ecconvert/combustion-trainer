import React, { useState } from 'react';
import { defaultAppConfig, useUIStore } from '../uiStore';

export default function SettingsModal() {
  const { settingsOpen, setSettingsOpen, config, setConfig } = useUIStore();
  const [draft, setDraft] = useState(config);

  if (!settingsOpen) return null;

  const apply = () => {
    setConfig(draft);
    setSettingsOpen(false);
  };
  const cancel = () => setSettingsOpen(false);
  const restore = () => {
    if (window.confirm('Restore default settings?')) {
      setDraft(defaultAppConfig);
      setConfig(defaultAppConfig);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-30 flex items-center justify-center">
      <div className="bg-white rounded-lg p-4 w-11/12 max-w-md">
        <h2 className="text-lg font-semibold mb-4">Settings</h2>
        <div className="space-y-3">
          <label className="block text-sm">
            Theme
            <select className="w-full border rounded-md px-2 py-1" value={draft.theme} onChange={(e) => setDraft({ ...draft, theme: e.target.value })}>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="system">System</option>
            </select>
          </label>
          <label className="block text-sm">
            Units
            <select className="w-full border rounded-md px-2 py-1" value={draft.units} onChange={(e) => setDraft({ ...draft, units: e.target.value })}>
              <option value="imperial">Imperial</option>
              <option value="metric">Metric</option>
            </select>
          </label>
          <label className="block text-sm">
            Analyzer sampling rate (s)
            <input type="number" className="w-full border rounded-md px-2 py-1" value={draft.samplingRate} onChange={(e) => setDraft({ ...draft, samplingRate: parseFloat(e.target.value) })} />
          </label>
          <label className="block text-sm">
            Trend length (points)
            <input type="number" className="w-full border rounded-md px-2 py-1" value={draft.trendLength} onChange={(e) => setDraft({ ...draft, trendLength: parseInt(e.target.value) })} />
          </label>
        </div>
        <div className="flex justify-between mt-4">
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
