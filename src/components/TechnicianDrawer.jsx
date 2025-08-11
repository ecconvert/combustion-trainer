import React from "react";
import CollapsibleSection from "./CollapsibleSection";
import { useUI } from "../uiStore.jsx";

export default function TechnicianDrawer({ openSettings }) {
  const { state, setState } = useUI();
  const close = () => setState((s) => ({ ...s, drawerOpen: false }));

  return (
    <div
      className={`fixed top-0 right-0 h-full bg-white shadow-lg z-50 transition-transform duration-300 overflow-y-auto w-full md:w-1/4 ${
        state.drawerOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Technician</h2>
        <button onClick={close} aria-label="Close" className="text-xl">
          ×
        </button>
      </div>
      <div className="p-4 space-y-2">
        <CollapsibleSection id="analyzer" title="Analyzer">
          <label className="flex items-center gap-2 text-sm">
            <span>On</span>
            <input type="checkbox" />
          </label>
        </CollapsibleSection>

        <CollapsibleSection id="combustion" title="Combustion Readouts">
          <p className="text-sm text-slate-600">Readout placeholders</p>
        </CollapsibleSection>

        <CollapsibleSection id="ambient" title="Ambient Inputs" defaultCollapsed>
          <p className="text-sm text-slate-600">Ambient inputs</p>
        </CollapsibleSection>

        <CollapsibleSection id="trendGraph" title="Trend Graph">
          <p className="text-sm text-slate-600">Graph placeholder</p>
        </CollapsibleSection>

        <CollapsibleSection id="trendTable" title="Trend Table">
          <p className="text-sm text-slate-600">Table placeholder</p>
        </CollapsibleSection>

        <CollapsibleSection id="savedReadings" title="Saved Readings">
          <button className="btn">Export CSV</button>
        </CollapsibleSection>

        <CollapsibleSection id="clock" title="Clock the Boiler">
          <p className="text-sm text-slate-600">Clock inputs</p>
        </CollapsibleSection>

        <button
          className="btn w-full mt-4"
          onClick={() => {
            close();
            openSettings();
          }}
        >
          Open Settings
        </button>
      </div>
    </div>
  );
}
