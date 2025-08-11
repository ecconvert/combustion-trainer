import React from 'react';
import { useAppSelector } from '@sim/store/hooks';

const TrendTable: React.FC = () => {
  const data = useAppSelector((s) => s.analyzer.trend);
  return (
    <table className="w-full text-sm">
      <thead>
        <tr>
          <th>Time</th>
          <th>O2</th>
          <th>CO2</th>
          <th>CO</th>
          <th>NOx</th>
          <th>Stack</th>
        </tr>
      </thead>
      <tbody>
        {data.slice(-20).map((r) => (
          <tr key={r.timestamp}>
            <td>{new Date(r.timestamp).toLocaleTimeString()}</td>
            <td>{r.o2.toFixed(2)}</td>
            <td>{r.co2.toFixed(2)}</td>
            <td>{r.co.toFixed(1)}</td>
            <td>{r.nox.toFixed(1)}</td>
            <td>{r.stackTemp.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TrendTable;
