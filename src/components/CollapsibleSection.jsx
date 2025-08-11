import React from 'react';
import { useUIStore } from '../uiStore';

export default function CollapsibleSection({ id, title, defaultCollapsed = false, children }) {
  const { collapseMap, setCollapse } = useUIStore();
  const collapsed = collapseMap[id] ?? defaultCollapsed;
  const toggle = () => setCollapse(id, !collapsed);
  return (
    <div className="border rounded-lg mb-4 bg-white">
      <div
        className="flex items-center justify-between px-3 py-2 bg-slate-100 cursor-pointer select-none"
        onClick={toggle}
      >
        <h2 className="font-semibold text-sm">{title}</h2>
        <span className="text-xs">{collapsed ? '+' : '−'}</span>
      </div>
      <div className={collapsed ? 'hidden' : 'block px-3 py-2'}>{children}</div>
    </div>
  );
}
