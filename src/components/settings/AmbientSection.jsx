import React from "react";

export default function AmbientSection({ values, onChange }) {
  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.live}
          onChange={(e) => onChange("live", e.target.checked)}
        />
        Use live ambient data
      </label>
      <label className="block text-sm">
        Default ZIP
        <input
          type="text"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.defaultZip}
          onChange={(e) => onChange("defaultZip", e.target.value)}
        />
      </label>
      <label className="block text-sm">
        Ambient API base URL
        <input
          type="text"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.baseUrl}
          onChange={(e) => onChange("baseUrl", e.target.value)}
        />
      </label>
      <label className="block text-sm">
        ZIP geocode base URL
        <input
          type="text"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.zipGeoBaseUrl}
          onChange={(e) => onChange("zipGeoBaseUrl", e.target.value)}
        />
      </label>
      <div className="text-xs text-slate-500">
        Live ambient will be wired in a later update using <code>zipToAmbient</code>.
      </div>
    </div>
  );
}
