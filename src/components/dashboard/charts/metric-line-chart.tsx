"use client";

import { useState, useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  type TooltipProps,
} from "recharts";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CHART_RANGES = [7, 14, 30] as const;
type ChartRange = (typeof CHART_RANGES)[number];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MetricSeries {
  readonly key: string;
  readonly label: string;
  readonly color: string;
  readonly colorLight: string;
  /** Format function for tooltip values */
  readonly format?: (value: number) => string;
  /** Y-axis ID (use "right" for a second Y-axis) */
  readonly yAxis?: "left" | "right";
}

interface DataRow {
  readonly date: string;
  readonly [key: string]: string | number;
}

interface Props {
  readonly title: string;
  readonly data: readonly DataRow[];
  readonly series: readonly MetricSeries[];
  /** Format function for the left Y-axis labels */
  readonly yAxisFormat?: (value: number) => string;
  /** Chart height in pixels (default: 200) */
  readonly height?: number;
}

// ---------------------------------------------------------------------------
// Custom tooltip
// ---------------------------------------------------------------------------

function ChartTooltip({
  active,
  payload,
  label,
  seriesMap,
}: TooltipProps<number, string> & {
  seriesMap: Map<string, MetricSeries>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg bg-white border border-gray-200 shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-gray-900 mb-1.5">{label}</p>
      {payload.map((entry) => {
        const series = seriesMap.get(entry.dataKey as string);
        const formatted = series?.format
          ? series.format(entry.value ?? 0)
          : (entry.value ?? 0).toLocaleString();
        return (
          <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
            <span
              className="w-2.5 h-2.5 rounded-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600">{entry.name}:</span>
            <span className="font-medium text-gray-900">{formatted}</span>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MetricLineChart({
  title,
  data,
  series,
  yAxisFormat,
  height = 200,
}: Props) {
  const [range, setRange] = useState<ChartRange>(30);

  const seriesMap = useMemo(() => {
    const m = new Map<string, MetricSeries>();
    for (const s of series) {
      m.set(s.key, s);
    }
    return m;
  }, [series]);

  const chartData = useMemo(() => {
    const sliced = data.slice(-range);
    return sliced.map((row) => ({
      ...row,
      dateLabel: new Date(row.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data, range]);

  const hasRightAxis = series.some((s) => s.yAxis === "right");

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          {title}
        </h3>
        <p className="text-center text-gray-400 text-sm py-8">
          No data available for this period.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header with range toggle */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          {title}
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
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={chartData}
          margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        >
          <defs>
            {series.map((s) => (
              <linearGradient
                key={s.key}
                id={`gradient-${s.key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#f3f4f6"
          />
          <XAxis
            dataKey="dateLabel"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            interval={range <= 14 ? 0 : "preserveStartEnd"}
          />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 10, fill: "#9ca3af" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={yAxisFormat}
          />
          {hasRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              hide
            />
          )}
          <Tooltip
            content={<ChartTooltip seriesMap={seriesMap} />}
            cursor={{ stroke: "#d1d5db", strokeDasharray: "3 3" }}
          />
          <Legend
            verticalAlign="bottom"
            height={28}
            iconType="square"
            iconSize={10}
            wrapperStyle={{ fontSize: 11 }}
          />
          {series.map((s) => (
            <Area
              key={s.key}
              yAxisId={s.yAxis ?? "left"}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={s.color}
              fill={`url(#gradient-${s.key})`}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: s.color }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
