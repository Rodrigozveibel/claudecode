import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { OccupancyTrend } from '../../types';
import { formatDate } from '../../utils/date';

interface OccupancyChartProps {
  data: OccupancyTrend[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
        <p className="font-medium text-gray-700 mb-1">{label ? formatDate(label) : ''}</p>
        <p className="text-blue-600">{`Ocupação: ${payload[0]?.value?.toFixed(1)}%`}</p>
      </div>
    );
  }
  return null;
};

export const OccupancyChart: React.FC<OccupancyChartProps> = ({ data, height = 200 }) => {
  const formattedData = data.map((d) => ({
    ...d,
    dateLabel: formatDate(d.date, 'dd/MM'),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="dateLabel"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
          domain={[0, 100]}
          tickFormatter={(v: number) => `${v}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="occupancy"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: '#3b82f6' }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
