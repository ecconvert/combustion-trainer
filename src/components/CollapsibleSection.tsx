import React from 'react';
import { useAppSelector, useAppDispatch } from '@sim/store/hooks';
import { togglePanel, PanelKey } from '@sim/store/uiSlice';

interface Props {
  title: string;
  panelKey: PanelKey;
  children: React.ReactNode;
}

const CollapsibleSection: React.FC<Props> = ({ title, panelKey, children }) => {
  const open = useAppSelector((s) => s.ui.panels[panelKey]);
  const dispatch = useAppDispatch();
  return (
    <section className="border rounded mb-2">
      <header className="flex justify-between items-center bg-slate-100 px-2 py-1">
        <h2 className="font-semibold">{title}</h2>
        <button
          aria-label={open ? `collapse ${title}` : `expand ${title}`}
          onClick={() => dispatch(togglePanel(panelKey))}
        >
          {open ? '−' : '+'}
        </button>
      </header>
      {open && <div className="p-2">{children}</div>}
    </section>
  );
};

export default CollapsibleSection;
