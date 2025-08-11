import React from "react";
import { useUI } from "../uiStore.jsx";

const SERIES = ["O2", "CO2", "CO", "NOx", "StackTemp", "Efficiency"];

export default function SeriesVisibility() {
  const { state, setState } = useUI();
  const vis = state.seriesVisibility;

  const toggle = (k) => {
    setState((s) => ({
      ...s,
      seriesVisibility: { ...s.seriesVisibility, [k]: !vis[k] },
    }));
  };

  return (
    <div className="p-2 border rounded-md">
      <div className="font-semibold mb-1 text-sm">Series Visibility</div>
      {SERIES.map((k) => (
        <label key={k} className="block text-sm">
          <input
            type="checkbox"
            className="mr-1"
            checked={vis[k]}
            onChange={() => toggle(k)}
          />
          {k}
        </label>
      ))}
    </div>
  );
}
