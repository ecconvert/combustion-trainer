import React from 'react';
import { toggleSeries } from '@sim/store/analyzerSlice';
import { useAppDispatch, useAppSelector } from '@sim/store/hooks';

const SeriesVisibility: React.FC = () => {
  const visibility = useAppSelector((s) => s.analyzer.seriesVisibility);
  const dispatch = useAppDispatch();
  return (
    <div className="flex flex-col gap-1">
      {Object.entries(visibility).map(([key, val]) => (
        <label key={key} className="flex items-center gap-1">
          <input
            type="checkbox"
            checked={val}
            onChange={() => dispatch(toggleSeries(key as any))}
          />
          <span>{key}</span>
        </label>
      ))}
    </div>
  );
};

export default SeriesVisibility;
