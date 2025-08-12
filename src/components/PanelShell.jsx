import React, { useState } from "react";
import { moveAcrossZones } from "../layout/store";

/**
 * Generic wrapper providing drag handle and menu for movable panels.
 * Keeps children mounted even when collapsed.
 */
export default function PanelShell({ id, title, children }) {
  const [collapsed, setCollapsed] = useState(false);

  const move = (zone) => moveAcrossZones(id, undefined, zone);

  return (
  <div className="panel-shell border rounded bg-card text-foreground shadow-sm border-border">
      <div
        className="flex items-center justify-between p-2 drag-handle cursor-move select-none"
        aria-label="Drag to move panel"
      >
        <span className="font-medium text-sm">{title}</span>
        <div className="flex gap-1 items-center">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-xs px-1 py-0.5 border rounded border-border bg-card"
          >
            {collapsed ? "Expand" : "Collapse"}
          </button>
          <details className="relative">
            <summary className="cursor-pointer px-1 text-lg leading-none">⋮</summary>
            <div className="absolute right-0 mt-1 bg-card border-border border rounded shadow text-xs flex flex-col z-10">
              <button className="px-2 py-1 text-left" onClick={() => move("mainWide")}>Move to Main wide</button>
              <button className="px-2 py-1 text-left" onClick={() => move("mainNarrow")}>Move to Main narrow</button>
              <button className="px-2 py-1 text-left" onClick={() => move("techDrawer")}>Move to Technician</button>
            </div>
          </details>
        </div>
      </div>
      {!collapsed && <div className="p-2">{children}</div>}
    </div>
  );
}
