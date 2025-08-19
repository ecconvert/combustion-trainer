import React from 'react';

/**
 * Simple status LED with label.
 *
 * @param {Object} props
 * @param {boolean} props.on - Whether the LED is lit.
 * @param {string} props.label - Text label shown to the right.
 * @param {string} [props.color="limegreen"] - Light color when on.
 */
export default function Led({ on, label, color = "limegreen" }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ background: on ? color : "#cbd5e1", boxShadow: on ? `0 0 10px ${color}` : "none" }}
      />
      <span className="text-xs text-slate-600">{label}</span>
    </div>
  );
}