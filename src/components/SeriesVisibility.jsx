import React from 'react';
import { useGui } from '../context/GuiContext.jsx';

const SERIES = ['O2', 'CO2', 'CO', 'NOx', 'StackF', 'Eff'];

export default function SeriesVisibility() {
  const { seriesVisibility, setSeriesVisibility } = useGui();

  const toggle = (k) => {
    setSeriesVisibility((v) => ({ ...v, [k]: !v[k] }));
  };

  return (
    <div className="card">
      <div className="label mb-2">Series Visibility</div>
      <div className="space-y-1">
        {SERIES.map((k) => (
          <label key={k} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={seriesVisibility[k]}
              onChange={() => toggle(k)}
            />
            <span>{k}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

