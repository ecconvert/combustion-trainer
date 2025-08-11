import React from 'react';
import { useDispatch } from 'react-redux';
import RightDrawer from '@components/RightDrawer';
import CollapsibleSection from '@components/CollapsibleSection';
import AnalyzerToggle from '@components/AnalyzerToggle';
import TrendGraph from '@components/TrendGraph';
import TrendTable from '@components/TrendTable';
import SavedReadings from '@components/SavedReadings';
import ClockBoiler from '@components/ClockBoiler';
import SeriesVisibility from '@components/SeriesVisibility';
import { openDrawer } from '@sim/store/uiSlice';

const App: React.FC = () => {
  const dispatch = useDispatch();
  return (
    <div className="p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Combustion Trainer</h1>
        <button
          className="border px-2 py-1 rounded"
          onClick={() => dispatch(openDrawer())}
        >
          Technician
        </button>
      </header>

      <CollapsibleSection title="Boiler Controls" panelKey="programmer">
        <div className="flex gap-2 items-center">
          <label className="flex items-center gap-1">
            Power <input type="checkbox" />
          </label>
          <label className="flex items-center gap-1">
            Fire Rate <input type="range" min="0" max="100" />
          </label>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Flows" panelKey="flows">
        <p>Fuel and air flow inputs...</p>
      </CollapsibleSection>

      <RightDrawer>
        <CollapsibleSection title="Analyzer" panelKey="trendGraph">
          <AnalyzerToggle />
        </CollapsibleSection>

        <CollapsibleSection title="Series Visibility" panelKey="savedReadings">
          <SeriesVisibility />
        </CollapsibleSection>

        <CollapsibleSection title="Trend Graph" panelKey="trendGraph">
          <TrendGraph />
        </CollapsibleSection>

        <CollapsibleSection title="Trend Table" panelKey="trendTable">
          <TrendTable />
        </CollapsibleSection>

        <CollapsibleSection title="Saved Readings" panelKey="savedReadings">
          <SavedReadings />
        </CollapsibleSection>

        <CollapsibleSection title="Clock the boiler" panelKey="clockBoiler">
          <ClockBoiler />
        </CollapsibleSection>
      </RightDrawer>
    </div>
  );
};

export default App;
