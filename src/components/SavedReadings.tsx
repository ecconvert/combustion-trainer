import React from 'react';
import { loadSaved, clearSaved, exportCSV } from '@sim/data/savedReadings';

const SavedReadings: React.FC = () => {
  const [readings, setReadings] = React.useState(loadSaved());
  const clear = () => {
    clearSaved();
    setReadings([]);
  };
  const exportData = () => {
    const csv = exportCSV(readings);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'readings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div>
      <button onClick={exportData} className="mr-2 px-2 py-1 border rounded">
        Export CSV
      </button>
      <button onClick={clear} className="px-2 py-1 border rounded">
        Clear
      </button>
      <ul className="mt-2 max-h-40 overflow-y-auto text-sm">
        {readings.map((r) => (
          <li key={r.timestamp}>
            {new Date(r.timestamp).toLocaleTimeString()} O2:{r.O2.toFixed(1)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SavedReadings;
