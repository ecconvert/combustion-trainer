import React from 'react';
import { useUIStore } from '../uiStore';

const seriesKeys = [
  { key: 'O2', label: 'O2' },
  { key: 'CO2', label: 'CO2' },
  { key: 'CO', label: 'CO' },
  { key: 'NOx', label: 'NOx' },
  { key: 'StackTemp', label: 'Stack Temp' },
  { key: 'Efficiency', label: 'Efficiency' },
];

export default function SeriesVisibility() {
  const { seriesVisibility, setSeriesVisibility } = useUIStore();
  const toggle = (k) => setSeriesVisibility({ ...seriesVisibility, [k]: !seriesVisibility[k] });
  return (
    <div className="card">
      <div className="label mb-2">Series Visibility</div>
      <div className="space-y-1 text-sm">
        {seriesKeys.map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2">
            <input type="checkbox" checked={seriesVisibility[key]} onChange={() => toggle(key)} />
            {label}
          </label>
        ))}
      </div>
    </div>
  );
}
