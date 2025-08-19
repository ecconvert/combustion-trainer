import React from 'react';

/**
 * Puff of smoke displayed when CO levels indicate soot production.
 */
export default function Smoke() {
  return (
    <div
      aria-label="smoke"
      className="absolute bottom-1/2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none"
    >
      <div
        className="w-4 h-4 rounded-full bg-gray-400 opacity-60"
        style={{ animation: "smoke 1.5s infinite" }}
      />
      <div
        className="w-3 h-3 rounded-full bg-gray-400 opacity-40 mt-1"
        style={{ animation: "smoke 1.5s infinite 0.3s" }}
      />
      <div
        className="w-5 h-5 rounded-full bg-gray-300 opacity-30 mt-1"
        style={{ animation: "smoke 1.5s infinite 0.6s" }}
      />
    </div>
  );
}