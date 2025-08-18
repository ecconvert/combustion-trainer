import React from 'react';
import { downloadCSV } from '../../lib/csv';

export default function ExportSection({ history, saved, onExportSaved }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Export Data</h2>
      <p className="text-sm text-slate-500">
        Export trend history or saved readings to a CSV file.
      </p>
      <div className="flex gap-2">
        <button
          className="btn"
          onClick={() => downloadCSV('session.csv', history)}
          disabled={!history || history.length === 0}
        >
          Export Trend CSV
        </button>
        <button
          className="btn"
          onClick={onExportSaved}
          disabled={!saved || saved.length === 0}
        >
          Export Saved Readings
        </button>
      </div>
    </div>
  );
}
