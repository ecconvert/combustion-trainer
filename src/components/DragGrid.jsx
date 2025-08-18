import React from "react";

/**
 * Placeholder for a draggable grid layout. Currently renders children in a
 * responsive CSS grid without drag behaviour. This stub allows wiring up
 * layout persistence later.
 */
export default function DragGrid({ children, className = "" }) {
  return <div className={`grid grid-cols-12 gap-4 ${className}`}>{children}</div>;
}
