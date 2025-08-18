import React from 'react';

export default function FastForwardBadge({ visible = false, multiplier = 8 }) {
  if (!visible) return null;

  return (
    <div
      data-test="fast-forward-badge"
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-50 bg-amber-600 text-white px-3 py-1 rounded-full shadow-lg flex items-center gap-2"
    >
      <span className="text-lg">⚡</span>
      <div className="text-sm">
        <div className="font-semibold">Fast-Forward Enabled</div>
        <div className="text-xs">Speed ×{multiplier}</div>
      </div>
    </div>
  );
}
