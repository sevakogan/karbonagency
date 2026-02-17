"use client";

import { useState, useMemo, useCallback, useRef } from "react";
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

const VISIBLE_DAYS = 30;
const DRAG_THRESHOLD = 5;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartX = useRef<number | null>(null);
  const dragStartOffset = useRef(0);

  const chartData = useMemo(
    () =>
      metrics.map((m) => ({
        date: new Date(m.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        conversions: m.conversions,
        leads: m.leads,
      })),
    [metrics]
  );

  const maxOffset = Math.max(0, chartData.length - VISIBLE_DAYS);
  const [offset, setOffset] = useState(maxOffset);

  const visibleData = useMemo(
    () => chartData.slice(offset, offset + VISIBLE_DAYS),
    [chartData, offset]
  );

  const clampOffset = useCallback(
    (val: number) => Math.max(0, Math.min(val, maxOffset)),
    [maxOffset]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      dragStartX.current = e.clientX;
      dragStartOffset.current = offset;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [offset]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragStartX.current === null) return;
      const dx = e.clientX - dragStartX.current;
      if (Math.abs(dx) < DRAG_THRESHOLD) return;

      const containerWidth = containerRef.current?.clientWidth ?? 600;
      const dayWidth = containerWidth / VISIBLE_DAYS;
      const daysDelta = Math.round(-dx / dayWidth);

      setOffset(clampOffset(dragStartOffset.current + daysDelta));
    },
    [clampOffset]
  );

  const handlePointerUp = useCallback(() => {
    dragStartX.current = null;
  }, []);

  if (metrics.length === 0) return null;

  const canGoBack = offset > 0;
  const canGoForward = offset < maxOffset;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Navigation header */}
      {chartData.length > VISIBLE_DAYS && (
        <div className="flex items-center justify-between mb-3">
          <button
            type="button"
            onClick={() => setOffset(clampOffset(offset - VISIBLE_DAYS))}
            disabled={!canGoBack}
            className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1"
          >
            ← Earlier
          </button>
          <span className="text-[11px] text-gray-400">
            {visibleData[0]?.date} — {visibleData[visibleData.length - 1]?.date}
          </span>
          <button
            type="button"
            onClick={() => setOffset(clampOffset(offset + VISIBLE_DAYS))}
            disabled={!canGoForward}
            className="text-xs text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-2 py-1"
          >
            Later →
          </button>
        </div>
      )}

      {/* Chart with drag */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="select-none touch-none"
        style={{ cursor: chartData.length > VISIBLE_DAYS ? "grab" : "default" }}
      >
        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={visibleData}
            margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#9ca3af" }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ConversionTooltip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
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
    </div>
  );
}
