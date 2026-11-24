import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { StorageTrendPoint } from "../../types/storage";
import { formatBytes } from "../../utils/formatters";

interface StorageHistoryChartProps {
  data: StorageTrendPoint[];
}

export const StorageHistoryChart: React.FC<StorageHistoryChartProps> = ({
  data,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No historical storage snapshots recorded yet.
      </div>
    );
  }

  const chartData = data.map((d) => ({
    date: d.date.split(" ")[0],
    usedGB: parseFloat((d.used_bytes / (1024 * 1024 * 1024)).toFixed(1)),
    availableGB: parseFloat(
      (d.available_bytes / (1024 * 1024 * 1024)).toFixed(1),
    ),
    rawUsed: d.used_bytes,
    rawAvailable: d.available_bytes,
  }));

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#007AFF" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#007AFF" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorAvail" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="date"
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
          />
          <YAxis
            stroke="#94A3B8"
            fontSize={11}
            tickLine={false}
            tickFormatter={(val) => `${val} GB`}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const used = payload[0].payload.rawUsed;
                const avail = payload[0].payload.rawAvailable;
                return (
                  <div className="bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark p-2.5 rounded-lg shadow-glass text-xs">
                    <div className="font-semibold text-slate-800 dark:text-slate-100 mb-1">
                      {label}
                    </div>
                    <div className="text-accent flex items-center justify-between gap-4">
                      <span>Used:</span>
                      <span className="font-medium">{formatBytes(used)}</span>
                    </div>
                    <div className="text-emerald-500 flex items-center justify-between gap-4">
                      <span>Available:</span>
                      <span className="font-medium">{formatBytes(avail)}</span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="usedGB"
            stroke="#007AFF"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorUsed)"
          />
          <Area
            type="monotone"
            dataKey="availableGB"
            stroke="#10B981"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorAvail)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

