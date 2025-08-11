import React from 'react';
import { useAppSelector } from '@sim/store/hooks';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer
} from 'recharts';

const TrendGraph: React.FC = () => {
  const data = useAppSelector((s) => s.analyzer.trend);
  const vis = useAppSelector((s) => s.analyzer.seriesVisibility);
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" domain={['auto', 'auto']} type="number" />
        <YAxis />
        <Tooltip />
        <Legend />
        {vis.o2 && <Line type="monotone" dataKey="o2" stroke="#8884d8" name="O2" />}
        {vis.co2 && <Line type="monotone" dataKey="co2" stroke="#82ca9d" name="CO2" />}
        {vis.co && <Line type="monotone" dataKey="co" stroke="#ff7300" name="CO" />}
        {vis.nox && <Line type="monotone" dataKey="nox" stroke="#ff0000" name="NOx" />}
        {vis.stackTemp && <Line type="monotone" dataKey="stackTemp" stroke="#000" name="Stack" />}
      </LineChart>
    </ResponsiveContainer>
  );
};

export default TrendGraph;
