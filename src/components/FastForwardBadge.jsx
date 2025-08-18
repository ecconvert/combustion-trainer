import React from 'react';

// Simple pulse animation inline so we don't rely on external CSS additions
const pulseStyle = {
  animation: 'ff-pulse 1s ease-in-out infinite',
};

// Inject keyframes once (guard via global flag)
if (typeof document !== 'undefined' && !(window).__FF_PULSE) {
  try {
    const style = document.createElement('style');
    style.textContent = `@keyframes ff-pulse {0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.15);opacity:.85}}`;
    document.head.appendChild(style);
    (window).__FF_PULSE = true;
  } catch { /* ignore */ }
}

export default function FastForwardBadge({ visible = false, multiplier = 8 }) {
  if (!visible) return null;

  return (
    <div
      data-test="fast-forward-badge"
      role="status"
      aria-live="polite"
      className="fixed top-4 right-4 z-50 bg-amber-600/95 backdrop-blur text-white px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 border border-amber-400"
    >
      <div style={pulseStyle} className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
        <span className="text-xl" aria-hidden="true">⏩</span>
      </div>
      <div className="text-sm leading-tight">
        <div className="font-semibold">Tour Fast-Forward</div>
        <div className="text-xs opacity-90">Startup accelerated ×{multiplier} – will return to normal at RUN_AUTO.</div>
      </div>
    </div>
  );
}
