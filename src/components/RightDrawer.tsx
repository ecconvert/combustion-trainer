import React from 'react';
import { closeDrawer } from '@sim/store/uiSlice';
import { useAppDispatch, useAppSelector } from '@sim/store/hooks';

interface Props {
  children: React.ReactNode;
}

const RightDrawer: React.FC<Props> = ({ children }) => {
  const open = useAppSelector((s) => s.ui.drawerOpen);
  const dispatch = useAppDispatch();
  return (
    <div
      className={`fixed top-0 right-0 h-full bg-white shadow-lg transition-transform duration-300 z-50 w-full sm:w-1/4 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!open}
    >
      <button
        className="p-2"
        aria-label="close technician drawer"
        onClick={() => dispatch(closeDrawer())}
      >
        Close
      </button>
      <div className="overflow-y-auto h-full p-2">{children}</div>
    </div>
  );
};

export default RightDrawer;
