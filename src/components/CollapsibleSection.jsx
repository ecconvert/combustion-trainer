import React, { useId } from 'react';
import { useGui } from '../context/GuiContext.jsx';

// Generic collapsible panel that stays mounted while hidden.
export default function CollapsibleSection({ id, title, children, defaultCollapsed = false }) {
  const autoId = useId();
  const sectionId = id || autoId;
  const { collapseMap, setCollapseMap } = useGui();
  const collapsed = collapseMap[sectionId] ?? defaultCollapsed;

  const toggle = () => {
    setCollapseMap((m) => ({ ...m, [sectionId]: !collapsed }));
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  };

  return (
    <div className="collapsible-section border rounded mb-4">
      <div
        className="section-header px-3 py-2 bg-slate-200 cursor-pointer flex justify-between items-center"
        onClick={toggle}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={!collapsed}
        aria-controls={`${sectionId}-content`}
      >
        <h2 className="font-semibold text-sm">{title}</h2>
        <span aria-hidden>{collapsed ? '+' : '−'}</span>
      </div>
      <div
        id={`${sectionId}-content`}
        className="overflow-hidden transition-[max-height] duration-300"
        style={{ maxHeight: collapsed ? 0 : '2000px' }}
      >
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}

