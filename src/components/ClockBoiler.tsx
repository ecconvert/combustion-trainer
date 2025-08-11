import React from 'react';
import { setClockFuelFlow } from '@sim/store/analyzerSlice';
import { useAppDispatch } from '@sim/store/hooks';

const ClockBoiler: React.FC = () => {
  const [volume, setVolume] = React.useState('');
  const [seconds, setSeconds] = React.useState('');
  const dispatch = useAppDispatch();
  const flow = React.useMemo(() => {
    const v = parseFloat(volume);
    const s = parseFloat(seconds);
    return s > 0 ? (3600 * v) / s : 0;
  }, [volume, seconds]);
  React.useEffect(() => {
    if (flow > 0) dispatch(setClockFuelFlow(flow));
    else dispatch(setClockFuelFlow(undefined));
  }, [flow, dispatch]);
  return (
    <div className="flex flex-col gap-2">
      <label>
        Measured volume
        <input
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          className="border ml-2"
        />
      </label>
      <label>
        Seconds
        <input
          value={seconds}
          onChange={(e) => setSeconds(e.target.value)}
          className="border ml-2"
        />
      </label>
      <div>Flow: {flow.toFixed(2)} unit/h</div>
    </div>
  );
};

export default ClockBoiler;
