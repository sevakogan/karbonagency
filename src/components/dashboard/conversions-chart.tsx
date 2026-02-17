"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  type TooltipProps,
} from "recharts";
import type { DailyMetrics } from "@/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_RANGES = [7, 14, 30] as const;
type ChartRange = (typeof CHART_RANGES)[number];

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function ConversionTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg bg-white border border-gray-200 shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1.5">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium text-gray-900">
            {(entry.value ?? 0).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  readonly metrics: readonly DailyMetrics[];
}

export default function ConversionsChart({ metrics }: Props) {
  const [range, setRange] = useState<ChartRange>(30);

  const chartData = useMemo(() => {
    const sliced = metrics.slice(-range);
    return sliced.map((m) => ({
      date: new Date(m.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
      conversions: m.conversions,
      leads: m.leads,
    }));
  }, [metrics, range]);

  if (metrics.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header with range toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Daily Conversions & Leads
        </h3>
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5">
          {CHART_RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                range === r
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {r}d
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={180}>
        <BarChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            interval={range <= 14 ? 0 : "preserveStartEnd"}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            content={<ConversionTooltip />}
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 11 }}
          />
          <Bar
            dataKey="conversions"
            name="Conversions"
            fill="#86efac"
            activeBar={{ fill: "#22c55e" }}
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="leads"
            name="Leads"
            fill="#c4b5fd"
            activeBar={{ fill: "#8b5cf6" }}
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
