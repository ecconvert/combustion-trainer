import React, { useEffect, useRef } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import PanelShell from "./PanelShell";
import { panels } from "../layout/panels";
import {
  useLayoutStore,
  moveWithinZone,
  moveAcrossZones,
  zoneRefs,
} from "../layout/store";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

/**
 * Wrapper around ResponsiveGridLayout that wires drag/resize events
 * to the layout store and enables cross-zone moves.
 */
export default function GridZone({ zone }) {
  const ref = useRef(null);
  const layouts = useLayoutStore((s) => s.layouts[zone]);
  const zoneById = useLayoutStore((s) => s.zoneById);

  useEffect(() => {
    zoneRefs[zone] = ref.current;
    return () => {
      zoneRefs[zone] = null;
    };
  }, [zone]);

  const items = Object.keys(zoneById).filter((id) => zoneById[id] === zone);

  const handleLayoutChange = (_, allLayouts) => {
    moveWithinZone(zone, allLayouts);
  };

  const handleDragStop = (layout, oldItem, newItem, placeholder, e) => {
    const centerX = e.clientX;
    const centerY = e.clientY;
    for (const [other, el] of Object.entries(zoneRefs)) {
      if (other !== zone && el) {
        const r = el.getBoundingClientRect();
        if (centerX >= r.left && centerX <= r.right && centerY >= r.top && centerY <= r.bottom) {
          moveAcrossZones(newItem.i, zone, other, { x: newItem.x, y: newItem.y, w: newItem.w, h: newItem.h });
          return;
        }
      }
    }
    moveWithinZone(zone, { ...layouts, lg: layout });
  };

  return (
    <div ref={ref} className="mb-4">
      <ResponsiveGridLayout
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        onDragStop={handleDragStop}
        draggableHandle=".drag-handle"
        isResizable
        margin={[8, 8]}
        compactType="vertical"
      >
        {items.map((id) => {
          const Panel = panels[id].Component;
          return (
            <div key={id} data-grid={{}}>
              <PanelShell id={id} title={panels[id].title}>
                <Panel />
              </PanelShell>
            </div>
          );
        })}
      </ResponsiveGridLayout>
    </div>
  );
}
