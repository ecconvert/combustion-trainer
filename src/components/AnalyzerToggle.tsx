import React from 'react';
import { startAnalyzer, stopAnalyzer } from '@sim/store/analyzerSlice';
import { useAppDispatch, useAppSelector } from '@sim/store/hooks';

const AnalyzerToggle: React.FC = () => {
  const running = useAppSelector((s) => s.analyzer.running);
  const dispatch = useAppDispatch();
  const toggle = () =>
    running ? dispatch(stopAnalyzer()) : dispatch(startAnalyzer());
  return (
    <button className="px-2 py-1 border rounded" onClick={toggle}>
      {running ? 'Analyzer Off' : 'Analyzer On'}
    </button>
  );
};

export default AnalyzerToggle;
