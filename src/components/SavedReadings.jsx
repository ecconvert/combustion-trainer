import React from "react";

function SavedReadingsPanel({ saved, exportSavedReadings }) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex justify-end mb-2">
        <button className="btn" onClick={exportSavedReadings} disabled={!saved.length}>
          Export
        </button>
      </div>
      <div className="flex-1 overflow-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="text-left text-slate-500">
              {[
                "t",
                "fuel",
                "setFire",
                "fuelFlow",
                "airFlow",
                "stackF",
                "O2",
                "CO2",
                "COppm",
                "NOxppm",
                "excessAir",
                "efficiency",
                "notes",
              ].map((h) => (
                <th key={h} className="py-1 pr-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {saved.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-1 pr-3 whitespace-nowrap">
                  {new Date(r.t).toLocaleString()}
                </td>
                <td className="py-1 pr-3 whitespace-nowrap">{r.fuel ?? ""}</td>
                <td className="py-1 pr-3 whitespace-nowrap">{r.setFire ?? ""}</td>
                <td className="py-1 pr-3 whitespace-nowrap">{r.fuelFlow ?? ""}</td>
                <td className="py-1 pr-3 whitespace-nowrap">{r.airFlow ?? ""}</td>
                <td className="py-1 pr-3 whitespace-nowrap">{r.stackF ?? ""}</td>
                <td className="py-1 pr-3 whitespace-nowrap">{r.O2 ?? ""}</td>
                <td className="py-1 pr-3 whitespace-nowrap">{r.CO2 ?? ""}</td>
                <td className="py-1 pr-3 whitespace-nowrap">{r.COppm ?? ""}</td>
                <td className="py-1 pr-3 whitespace-nowrap">{r.NOxppm ?? ""}</td>
                <td className="py-1 pr-3 whitespace-nowrap">{r.excessAir ?? ""}</td>
                <td className="py-1 pr-3 whitespace-nowrap">{r.efficiency ?? ""}</td>
                <td className="py-1 pr-3 whitespace-nowrap">{r.notes ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default React.memo(SavedReadingsPanel);
