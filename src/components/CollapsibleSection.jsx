import React from "react";
import { useUI } from "../uiStore.jsx";

export default function CollapsibleSection({ id, title, children, defaultCollapsed = false }) {
  const { state, setState } = useUI();
  const collapsed = state.collapseMap[id] ?? defaultCollapsed;

  const toggle = () => {
    setState((s) => ({
      ...s,
      collapseMap: { ...s.collapseMap, [id]: !collapsed },
    }));
  };

  return (
    <div className="mb-2 border rounded-md">
      <button
        type="button"
        onClick={toggle}
        className="w-full flex justify-between items-center px-2 py-1 bg-slate-100"
      >
        <span>{title}</span>
        <span>{collapsed ? "+" : "-"}</span>
      </button>
      <div className={collapsed ? "hidden" : "block"}>
        <div className="p-2">{children}</div>
      </div>
    </div>
  );
}
