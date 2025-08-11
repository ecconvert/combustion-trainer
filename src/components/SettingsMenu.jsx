import React, { useEffect, useRef, useState } from "react";
import { getDefaultConfig } from "../lib/config";

export default function SettingsMenu({ open, config, onApply, onCancel }) {
  const [local, setLocal] = useState(config);
  const [section, setSection] = useState("general");
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) {
      setLocal(config);
      // focus first focusable element
      const focusable = modalRef.current?.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      focusable && focusable[0]?.focus();
    }
  }, [open, config]);

  // ESC to close and basic focus trap
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Tab") {
        const focusable = modalRef.current?.querySelectorAll(
          "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  const sections = [
    { key: "general", label: "General" },
    { key: "analyzer", label: "Analyzer" },
    { key: "units", label: "Units" },
    { key: "ambient", label: "Ambient" },
    { key: "data", label: "Data and privacy" },
  ];

  const handleField = (sec, field, value) => {
    setLocal((p) => ({ ...p, [sec]: { ...p[sec], [field]: value } }));
  };

  const handleReset = () => {
    if (!window.confirm("Reset this section to defaults?")) return;
    const defaults = getDefaultConfig();
    setLocal((p) => ({ ...p, [section]: defaults[section] }));
  };

  const renderSection = () => {
    switch (section) {
      case "general":
        return (
          <div className="space-y-4">
            <label className="block text-sm">
              Theme
              <select
                className="mt-1 border rounded-md px-2 py-1 w-full"
                value={local.general.theme}
                onChange={(e) => handleField("general", "theme", e.target.value)}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </label>
            <label className="block text-sm">
              Default view
              <select
                className="mt-1 border rounded-md px-2 py-1 w-full"
                value={local.general.defaultView}
                onChange={(e) => handleField("general", "defaultView", e.target.value)}
              >
                <option value="main">Main</option>
                <option value="techDrawer">Technician drawer</option>
              </select>
            </label>
            <label className="block text-sm">
              Trend length (samples)
              <input
                type="number"
                className="mt-1 border rounded-md px-2 py-1 w-full"
                value={local.general.trendLength}
                onChange={(e) =>
                  handleField("general", "trendLength", parseInt(e.target.value || 0, 10))
                }
              />
              {local.general.trendLength < 60 || local.general.trendLength > 10000 ? (
                <div className="text-xs text-red-600">60–10000</div>
              ) : null}
            </label>
          </div>
        );
      case "analyzer":
        return (
          <div className="space-y-4">
            <label className="block text-sm">
              Sampling interval (sec)
              <input
                type="number"
                className="mt-1 border rounded-md px-2 py-1 w-full"
                value={local.analyzer.samplingSec}
                onChange={(e) =>
                  handleField("analyzer", "samplingSec", parseFloat(e.target.value || 0))
                }
                step="0.1"
                min="0.2"
              />
              {local.analyzer.samplingSec < 0.2 || local.analyzer.samplingSec > 60 ? (
                <div className="text-xs text-red-600">0.2–60</div>
              ) : null}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={local.analyzer.autostart}
                onChange={(e) => handleField("analyzer", "autostart", e.target.checked)}
              />
              Autostart analyzer
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={local.analyzer.showZeroReminder}
                onChange={(e) => handleField("analyzer", "showZeroReminder", e.target.checked)}
              />
              Show zero reminder
            </label>
          </div>
        );
      case "units":
        return (
          <div className="space-y-4">
            <label className="block text-sm">
              Unit system
              <select
                className="mt-1 border rounded-md px-2 py-1 w-full"
                value={local.units.system}
                onChange={(e) => handleField("units", "system", e.target.value)}
              >
                <option value="imperial">Imperial</option>
                <option value="metric">Metric</option>
              </select>
            </label>
          </div>
        );
      case "ambient":
        return (
          <div className="space-y-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={local.ambient.live}
                onChange={(e) => handleField("ambient", "live", e.target.checked)}
              />
              Use live ambient data
            </label>
            <label className="block text-sm">
              Default ZIP
              <input
                type="text"
                className="mt-1 border rounded-md px-2 py-1 w-full"
                value={local.ambient.defaultZip}
                onChange={(e) => handleField("ambient", "defaultZip", e.target.value)}
              />
            </label>
            <label className="block text-sm">
              Ambient API base URL
              <input
                type="text"
                className="mt-1 border rounded-md px-2 py-1 w-full"
                value={local.ambient.baseUrl}
                onChange={(e) => handleField("ambient", "baseUrl", e.target.value)}
              />
            </label>
            <label className="block text-sm">
              ZIP geocode base URL
              <input
                type="text"
                className="mt-1 border rounded-md px-2 py-1 w-full"
                value={local.ambient.zipGeoBaseUrl}
                onChange={(e) => handleField("ambient", "zipGeoBaseUrl", e.target.value)}
              />
            </label>
            <div className="text-xs text-slate-500">
              Live ambient will be wired in a later update using <code>zipToAmbient</code>.
            </div>
          </div>
        );
      case "data":
        return (
          <div className="space-y-4 text-sm">
            <p>
              Data export and import buttons remain in the header for now and will
              move here in a follow‑up.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="bg-white w-full h-full sm:h-auto sm:max-w-3xl sm:rounded-md sm:flex"
        role="dialog"
        aria-modal="true"
      >
        <div className="sm:hidden flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button className="btn" onClick={onCancel} aria-label="Close settings">
            Close
          </button>
        </div>
        <div className="flex-1 flex">
          <nav className="w-40 border-r p-4 hidden sm:block" aria-label="Settings sections">
            <ul className="space-y-2">
              {sections.map((s) => (
                <li key={s.key}>
                  <button
                    className={`text-left w-full px-2 py-1 rounded-md ${
                      section === s.key ? "bg-slate-200" : ""
                    }`}
                    onClick={() => setSection(s.key)}
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex-1 p-4 overflow-y-auto">
            {renderSection()}
            <div className="mt-6 flex items-center justify-between">
              <button className="btn" onClick={handleReset}>
                Restore defaults
              </button>
              <div className="flex gap-2">
                <button className="btn" onClick={onCancel}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={() => onApply(local)}>
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
