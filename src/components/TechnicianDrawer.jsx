import React from 'react';
import CollapsibleSection from './CollapsibleSection';
import { useUIStore } from '../uiStore';

export default function TechnicianDrawer() {
  const { drawerOpen, setDrawerOpen, setSettingsOpen } = useUIStore();
  return (
    <div
      className={`fixed top-0 right-0 h-full z-20 bg-white shadow-xl transition-transform duration-300 overflow-y-auto w-full md:w-1/4 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Technician</h2>
        <div className="space-x-2">
          <button className="btn" onClick={() => setSettingsOpen(true)}>⚙️</button>
          <button className="btn" onClick={() => setDrawerOpen(false)}>Close</button>
        </div>
      </div>
      <div className="p-4">
        <CollapsibleSection id="drawer-analyzer" title="Analyzer" defaultCollapsed>
          <div className="text-sm">Analyzer controls go here.</div>
        </CollapsibleSection>
        <CollapsibleSection id="drawer-readouts" title="Combustion Readouts" defaultCollapsed>
          <div className="text-sm">Numbers panel placeholder.</div>
        </CollapsibleSection>
        <CollapsibleSection id="drawer-ambient" title="Ambient Inputs" defaultCollapsed>
          <div className="text-sm">Temperature, pressure, humidity inputs.</div>
        </CollapsibleSection>
        <CollapsibleSection id="drawer-trend-graph" title="Trend Graph" defaultCollapsed>
          <div className="text-sm">Trend graph placeholder.</div>
        </CollapsibleSection>
        <CollapsibleSection id="drawer-trend-table" title="Trend Table" defaultCollapsed>
          <div className="text-sm">Trend table placeholder.</div>
        </CollapsibleSection>
        <CollapsibleSection id="drawer-saved" title="Saved Readings" defaultCollapsed>
          <button className="btn mb-2">Export CSV</button>
        </CollapsibleSection>
        <CollapsibleSection id="drawer-clock" title="Clock the Boiler" defaultCollapsed>
          <div className="text-sm">Clocking inputs placeholder.</div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
