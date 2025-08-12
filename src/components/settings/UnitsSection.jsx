import React from "react";

export default function UnitsSection({ values, onChange }) {
  return (
    <div className="space-y-4">
      <label className="block text-sm">
        Unit system
        <select
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.system}
          onChange={(e) => onChange("system", e.target.value)}
        >
          <option value="imperial">Imperial</option>
          <option value="metric">Metric</option>
        </select>
      </label>
    </div>
  );
}
