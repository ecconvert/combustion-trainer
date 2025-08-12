import React from "react";
import SeriesVisibility from "./components/SeriesVisibility";

/* eslint-disable react-refresh/only-export-components */
const Placeholder = ({ label }) => (
  <div className="p-2 text-center text-xs">{label}</div>
);

export const panels = {
  analyzer: { title: "Analyzer", Component: () => <Placeholder label="Analyzer" /> },
  trendGraph: { title: "Trend Graph", Component: () => <Placeholder label="Trend Graph" /> },
  trendTable: { title: "Trend Table", Component: () => <Placeholder label="Trend Table" /> },
  savedReadings: { title: "Saved", Component: () => <Placeholder label="Saved" /> },
  clockBoiler: { title: "Clock Boiler", Component: () => <Placeholder label="Clock Boiler" /> },
  ambientInputs: { title: "Ambient Inputs", Component: () => <Placeholder label="Ambient Inputs" /> },
  seriesVisibility: { title: "Series Visibility", Component: SeriesVisibility },
  fuelSelector: { title: "Fuel Selector", Component: () => <Placeholder label="Fuel Selector" /> },
};

export const defaultZoneById = Object.fromEntries(
  Object.keys(panels).map((id) => [id, "techDrawer"])
);

function buildLayouts(ids, cols) {
  const out = { lg: [], md: [], sm: [], xs: [], xxs: [] };
  ids.forEach((id, idx) => {
    const base = { i: id, x: 0, y: idx * 2, w: cols, h: 2 };
    Object.keys(out).forEach((bp) => {
      out[bp].push({ ...base });
    });
  });
  return out;
}

export const defaultLayouts = {
  techDrawer: buildLayouts(Object.keys(panels), 12),
};
/* eslint-enable react-refresh/only-export-components */
