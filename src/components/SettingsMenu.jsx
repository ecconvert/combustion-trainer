import React, { useEffect, useRef, useState } from "react";
import { getDefaultConfig } from "../lib/config";
import GeneralSection from "./settings/GeneralSection.jsx";
import AnalyzerSection from "./settings/AnalyzerSection.jsx";
import UnitsSection from "./settings/UnitsSection.jsx";
import AmbientSection from "./settings/AmbientSection.jsx";
import DataSection from "./settings/DataSection.jsx";
import GaugeSection from "./settings/GaugeSection";

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

  const sections = {
    general: { label: "General", Component: GeneralSection },
    gauge: { label: "Gauge / Needle", Component: GaugeSection },
    analyzer: { label: "Analyzer", Component: AnalyzerSection },
    units: { label: "Units", Component: UnitsSection },
    ambient: { label: "Ambient", Component: AmbientSection },
    data: { label: "Data and privacy", Component: DataSection },
  };

  const handleField = (sec, field, value) => {
    setLocal((p) => ({ ...p, [sec]: { ...p[sec], [field]: value } }));
  };

  const handleReset = () => {
    if (!window.confirm("Reset this section to defaults?")) return;
    const defaults = getDefaultConfig();
    setLocal((p) => ({ ...p, [section]: defaults[section] }));
  };

  const SectionComponent = sections[section]?.Component;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
        className="bg-white w-full h-full sm:h-auto sm:max-w-3xl sm:rounded-md sm:flex"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        aria-describedby="settings-desc"
      >
        <h2 id="settings-title" className="sr-only">Settings</h2>
        <p id="settings-desc" className="sr-only">
          Configure theme, units, and analyzer options
        </p>
        <div className="sm:hidden flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          <button className="btn" onClick={onCancel} aria-label="Close settings">
            Close
          </button>
        </div>
        <div className="flex-1 flex">
          <nav className="w-40 border-r p-4 hidden sm:block" aria-label="Settings sections">
            <ul className="space-y-2">
              {Object.entries(sections).map(([key, { label }]) => (
                <li key={key}>
                  <button
                    className={`text-left w-full px-2 py-1 rounded-md ${
                      section === key ? "bg-slate-200" : ""
                    }`}
                    onClick={() => setSection(key)}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex-1 p-4 overflow-y-auto">
            {SectionComponent && (
              <SectionComponent
                values={local[section]}
                onChange={(field, value) => handleField(section, field, value)}
              />
            )}
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
