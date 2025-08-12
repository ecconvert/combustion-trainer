import React from "react";

/**
 * Simple UI for toggling visibility of data series. Consumers provide the
 * current visibility map and a setter function.
 */
export default function SeriesVisibility({ visibility, setVisibility }) {
  const toggle = (key) => {
    setVisibility((v) => ({ ...v, [key]: !v[key] }));
  };

  return (
    <div className="card p-4 text-sm">
      <div className="label mb-2">Series Visibility</div>
      {Object.keys(visibility).map((k) => (
        <label key={k} className="flex items-center gap-2 mb-1">
          <input
            type="checkbox"
            checked={visibility[k]}
            onChange={() => toggle(k)}
          />
          {k}
        </label>
      ))}
    </div>
  );
}
