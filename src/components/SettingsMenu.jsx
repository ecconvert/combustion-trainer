import React, { useEffect, useRef, useState } from "react";
import { getDefaultConfig } from "../lib/config";
import GeneralSection from "./settings/GeneralSection.jsx";
import AnalyzerSection from "./settings/AnalyzerSection.jsx";
import UnitsSection from "./settings/UnitsSection.jsx";
import AmbientSection from "./settings/AmbientSection.jsx";
import DataSection from "./settings/DataSection.jsx";
import GaugeSection from "./settings/GaugeSection";
import ExportSection from "./settings/ExportSection.jsx";

export default function SettingsMenu({
  open,
  config,
  onApply,
  onCancel,
  onPreview,
  history,
  saved,
  onExportSaved,
  onResetLayouts,
}) {
  const [local, setLocal] = useState(config);
  const [section, setSection] = useState("general");
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [previewPayload, setPreviewPayload] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (open) {
      // Only reset local state when opening; avoid stealing focus on every live change
      setLocal(config);
      const focusable = modalRef.current?.querySelectorAll(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      focusable && focusable[0]?.focus();
    }
    // Intentionally do not depend on `config` to prevent focus loss while typing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Handle preview updates asynchronously to avoid setState during render
  useEffect(() => {
    if (previewPayload && onPreview) {
      onPreview(previewPayload.config, previewPayload.meta);
      setPreviewPayload(null);
    }
  }, [previewPayload, onPreview]);

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
    export: { label: "Export", Component: ExportSection },
    data: { label: "Data and privacy", Component: DataSection },
  };

  const handleField = (sec, field, value) => {
    setLocal((p) => {
      const next = { ...p, [sec]: { ...p[sec], [field]: value } };
      // Schedule preview update to happen after state update
      setPreviewPayload({ config: next, meta: { section: sec, field } });
      return next;
    });
  };

  const handleReset = () => {
    if (!window.confirm("Reset this section to defaults?")) return;
    const defaults = getDefaultConfig();
    setLocal((p) => {
      const next = { ...p, [section]: defaults[section] };
      // Schedule preview update to happen after state update
      setPreviewPayload({ config: next, meta: { section, field: "*" } });
      return next;
    });
  };

  const SectionComponent = sections[section]?.Component;

  const handleMouseDown = (e) => {
    setDragging(true);
    setOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (dragging) {
      setPosition({
        x: e.clientX - offset.x,
        y: e.clientY - offset.y,
      });
    }
  };

  const handleMouseUp = () => setDragging(false);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, offset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        ref={modalRef}
  data-testid="settings-dialog"
  className="bg-card text-foreground w-full h-full sm:h-auto sm:max-w-3xl sm:rounded-md flex flex-col overflow-hidden max-h-screen sm:max-h-[85vh]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        aria-describedby="settings-desc"
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
          zIndex: 1000,
          minWidth: 320,
        }}
      >
        <div
          className="px-2 py-1 bg-card border-b border-border"
          style={{ cursor: "move" }}
          onMouseDown={handleMouseDown}
        >
          <strong>Settings</strong>
          <button
            className="btn"
            onClick={onCancel}
            aria-label="Close settings"
            style={{ float: "right" }}
          >
            &times;
          </button>
        </div>
        <div className="flex-1 flex min-h-0">
          <nav
            className="w-40 border-r p-4 hidden sm:block border-border overflow-y-auto"
            aria-label="Settings sections"
          >
            <ul className="space-y-2">
              {Object.entries(sections).map(([key, { label }]) => (
                <li key={key}>
                  <button
                    className={`text-left w-full px-2 py-1 rounded-md ${section === key ? "bg-background" : ""}`}
                    onClick={() => setSection(key)}
                  >
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div data-testid="settings-scroll" className="flex-1 p-4 overflow-y-auto min-h-0">
            {section === "export" ? (
              <ExportSection
                history={history}
                saved={saved}
                onExportSaved={onExportSaved}
              />
            ) : (
              SectionComponent && (
                <SectionComponent
                  values={local[section]}
                  onChange={(field, value) => handleField(section, field, value)}
                  onResetLayouts={section === "general" ? onResetLayouts : undefined}
                  onCloseSettings={section === "general" ? onCancel : undefined}
                />
              )
            )}
            <div className="mt-6 flex items-center justify-between">
              <button className="btn" onClick={handleReset}>
                Restore defaults
              </button>
              <div className="flex gap-2">
                <button className="btn" onClick={onCancel}>
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => onApply(local)}
                >
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