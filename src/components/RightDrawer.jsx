import React from "react";

/**
 * Simple slide-in drawer anchored to the right side of the viewport.
 * Width is 25% on desktop and full on small screens. Content remains mounted
 * while hidden. Visibility is controlled by the `open` prop.
 */
export default function RightDrawer({ open, onClose, children }) {
  return (
    <div
  className={`fixed top-0 right-0 h-full bg-card text-foreground shadow-xl transition-transform duration-300 z-50 ${
        open ? "translate-x-0" : "translate-x-full"
      } w-full sm:w-1/4`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tech-drawer-title"
      aria-describedby="tech-drawer-desc"
    >
      <div className="p-4 h-full overflow-y-auto">
        <h2 id="tech-drawer-title" className="sr-only">
          Technician Drawer
        </h2>
        <p id="tech-drawer-desc" className="sr-only">
          Tools and panels for tuning and analysis
        </p>
        <button
          type="button"
          data-testid="btn-tech-close"
          onClick={onClose}
          className="mb-4 btn"
          aria-label="Close technician drawer"
        >
          Close
        </button>
        {children}
      </div>
    </div>
  );
}
