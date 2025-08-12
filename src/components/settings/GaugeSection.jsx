import React from "react";

export default function GaugeSection({ values, onChange }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold mb-2">Gauge / Needle Settings</h3>
  <div className="text-xs text-slate-500">Needle sweep controls only the pointer. Arc angles below control the visual band and are independent.</div>
      <label className="block text-sm">
        Low Angle
        <input
          type="number"
          min="0"
          max="360"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.gaugeAngleLow ?? 180}
          onChange={e => onChange("gaugeAngleLow", Number(e.target.value))}
        />
      </label>
      <label className="block text-sm">
        High Angle
        <input
          type="number"
          min="0"
          max="360"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.gaugeAngleHigh ?? 300}
          onChange={e => onChange("gaugeAngleHigh", Number(e.target.value))}
        />
      </label>
      <label className="block text-sm">
        Arc Low Angle
        <input
          type="number"
          min="0"
          max="360"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.arcAngleLow ?? 220}
          onChange={e => onChange("arcAngleLow", Number(e.target.value))}
        />
      </label>
      <label className="block text-sm">
        Arc High Angle
        <input
          type="number"
          min="0"
          max="360"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.arcAngleHigh ?? 330}
          onChange={e => onChange("arcAngleHigh", Number(e.target.value))}
        />
      </label>
      <label className="block text-sm">
        Scale
        <input
          type="number"
          min="0.5"
          max="2"
          step="0.01"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.gaugeScale ?? 1.18}
          onChange={e => onChange("gaugeScale", Number(e.target.value))}
        />
      </label>
      <label className="block text-sm">
        Speed
        <input
          type="number"
          min="0.1"
          max="3"
          step="0.01"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.gaugeSpeed ?? 1}
          onChange={e => onChange("gaugeSpeed", Number(e.target.value))}
        />
      </label>
      <label className="block text-sm">
        Fire Rate
        <input
          type="number"
          min="0"
          max="100"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.gaugeFireRate ?? 0}
          onChange={e => onChange("gaugeFireRate", Number(e.target.value))}
        />
      </label>
      <label className="block text-sm">
        Flip Direction
        <input
          type="checkbox"
          className="ml-2"
          checked={values.gaugeFlipDirection ?? false}
          onChange={e => onChange("gaugeFlipDirection", e.target.checked)}
        />
      </label>
      <label className="block text-sm">
        Needle Width
        <input
          type="number"
          min="0.01"
          max="0.2"
          step="0.01"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.gaugeNeedleWidth ?? 0.06}
          onChange={e => onChange("gaugeNeedleWidth", Number(e.target.value))}
        />
      </label>
      <label className="block text-sm">
        Dot Size
        <input
          type="number"
          min="0.01"
          max="0.2"
          step="0.01"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.gaugeDotSize ?? 0.06}
          onChange={e => onChange("gaugeDotSize", Number(e.target.value))}
        />
      </label>
      <label className="block text-sm">
        Needle Start (Inner)
        <input
          type="number"
          min="0"
          max="0.8"
          step="0.01"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.needleInner ?? 0}
          onChange={e => onChange("needleInner", Number(e.target.value))}
        />
      </label>
      <label className="block text-sm">
        Arc Offset
        <input
          type="number"
          min="-180"
          max="180"
          step="1"
          className="mt-1 border rounded-md px-2 py-1 w-full"
          value={values.arcOffset ?? 0}
          onChange={e => onChange("arcOffset", Number(e.target.value))}
        />
      </label>
    </div>
  );
}