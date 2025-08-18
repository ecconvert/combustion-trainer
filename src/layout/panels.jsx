import React from "react";
import SeriesVisibility from "../components/SeriesVisibility";

/* eslint-disable react-refresh/only-export-components */
// Placeholder component for panels not yet implemented
const Placeholder = ({ label }) => (
  <div className="p-2 text-center text-xs">{label}</div>
);

export const panels = {
  fuelSelector: { title: "Fuel Selector", Component: () => <Placeholder label="Fuel Selector" /> },
  boilerPower: { title: "Boiler Power", Component: () => <Placeholder label="Boiler Power" /> },
  fireRate: { title: "Fire Rate", Component: () => <Placeholder label="Fire Rate" /> },
  flows: { title: "Flows", Component: () => <Placeholder label="Flows" /> },
  chamberViz: { title: "Chamber Viz", Component: () => <Placeholder label="Chamber Viz" /> },
  readouts: { title: "Readouts", Component: () => <Placeholder label="Readouts" /> },
  analyzer: { title: "Analyzer", Component: () => <Placeholder label="Analyzer" /> },
  programmer: { title: "Programmer", Component: () => <Placeholder label="Programmer" /> },
  tuningPanel: { title: "Tuning Panel", Component: () => <Placeholder label="Tuning" /> },
  trendGraph: { title: "Trend Graph", Component: () => <Placeholder label="Trend Graph" /> },
  trendTable: { title: "Trend Table", Component: () => <Placeholder label="Trend Table" /> },
  saved: { title: "Saved Readings", Component: () => <Placeholder label="Saved Readings" /> },
  clockBoiler: { title: "Clock the Boiler", Component: () => <Placeholder label="Clock Boiler" /> },
  seriesVisibility: { title: "Series Visibility", Component: SeriesVisibility },
  ambientInputs: { title: "Ambient Inputs", Component: () => <Placeholder label="Ambient Inputs" /> },
};

/* eslint-enable react-refresh/only-export-components */

const zoneOrder = {
  mainWide: ["chamberViz", "boilerPower", "fireRate", "flows", "programmer", "tuningPanel"],
  mainNarrow: ["readouts"],
  techDrawer: [
    "analyzer",
    "trendGraph",
    "trendTable",
    "saved",
    "clockBoiler",
    "ambientInputs",
    "seriesVisibility",
    "fuelSelector",
  ],
};

export const defaultZoneById = Object.fromEntries(
  Object.entries(zoneOrder).flatMap(([zone, ids]) => ids.map((id) => [id, zone]))
);

const breakpoints = ["lg", "md", "sm", "xs"];

function buildLayouts(ids, cols) {
  const out = { lg: [], md: [], sm: [], xs: [] };
  ids.forEach((id, idx) => {
    const base = { i: id, x: 0, y: idx * 2, w: cols, h: 2 };
    breakpoints.forEach((bp) => {
      out[bp].push({ ...base, w: bp === "xs" ? 1 : base.w });
    });
  });
  return out;
}

export const defaultLayouts = {
  mainWide: buildLayouts(zoneOrder.mainWide, 8),
  mainNarrow: buildLayouts(zoneOrder.mainNarrow, 4),
  techDrawer: buildLayouts(zoneOrder.techDrawer, 12),
};
