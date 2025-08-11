import React from 'react';
import { useGui } from '../context/GuiContext.jsx';

// Slide-in drawer from the right for technician tools
export default function RightDrawer({ children }) {
  const { drawerOpen, setDrawerOpen } = useGui();

  return (
    <>
      <button
        className="fixed top-4 right-4 z-50 btn"
        aria-expanded={drawerOpen}
        onClick={() => setDrawerOpen(!drawerOpen)}
      >
        {drawerOpen ? 'Close' : 'Technician'}
      </button>
      <aside
        className={`fixed top-0 right-0 h-full bg-white shadow-lg transform transition-transform duration-300 z-40 overflow-y-auto w-full sm:w-1/4 ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-hidden={!drawerOpen}
      >
        <div className="p-4 space-y-4">{children}</div>
      </aside>
    </>
  );
}

