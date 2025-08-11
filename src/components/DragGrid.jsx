import React from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import { useGui } from '../context/GuiContext.jsx';

const ResponsiveGridLayout = WidthProvider(Responsive);

// Wrapper around react-grid-layout with persistence
export default function DragGrid({ children, defaultLayouts }) {
  const { layout, setLayout } = useGui();

  const handleLayoutChange = (_current, allLayouts) => {
    setLayout(allLayouts);
  };

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={Object.keys(layout).length ? layout : defaultLayouts}
      onLayoutChange={handleLayoutChange}
      breakpoints={{ lg: 1024, md: 768, sm: 0 }}
      cols={{ lg: 12, md: 12, sm: 1 }}
      rowHeight={50}
      draggableHandle=".section-header"
      isBounded
    >
      {children}
    </ResponsiveGridLayout>
  );
}

