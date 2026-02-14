"use client";

import { useMemo, useState } from "react";

export interface SpendDataPoint {
  readonly date: string;
  readonly spend: number;
  readonly impressions: number;
}

interface SpendOverviewChartProps {
  data: readonly SpendDataPoint[];
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(0);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

/** Number of Y-axis guide lines */
const Y_STEPS = 4;

export default function SpendOverviewChart({ data }: SpendOverviewChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const chartData = useMemo(() => {
    if (data.length === 0) return null;

    const maxSpend = Math.max(...data.map((d) => d.spend), 1);
    const maxImpressions = Math.max(...data.map((d) => d.impressions), 1);

    // Chart dimensions (viewBox units)
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 60, bottom: 40, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const xStep = data.length > 1 ? chartW / (data.length - 1) : chartW / 2;

    // Build SVG path for spend (area fill + line)
    const spendPoints = data.map((d, i) => {
      const x = padding.left + i * xStep;
      const y = padding.top + chartH - (d.spend / maxSpend) * chartH;
      return { x, y };
    });

    const spendLine = spendPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    const spendArea =
      spendLine +
      ` L ${spendPoints[spendPoints.length - 1].x} ${padding.top + chartH}` +
      ` L ${spendPoints[0].x} ${padding.top + chartH} Z`;

    // Build SVG path for impressions (line only)
    const impPoints = data.map((d, i) => {
      const x = padding.left + i * xStep;
      const y =
        padding.top + chartH - (d.impressions / maxImpressions) * chartH;
      return { x, y };
    });

    const impLine = impPoints
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    // Y-axis labels
    const spendLabels = Array.from({ length: Y_STEPS + 1 }, (_, i) => {
      const val = (maxSpend / Y_STEPS) * i;
      const y = padding.top + chartH - (i / Y_STEPS) * chartH;
      return { val, y, label: formatCurrency(val) };
    });

    const impLabels = Array.from({ length: Y_STEPS + 1 }, (_, i) => {
      const val = (maxImpressions / Y_STEPS) * i;
      const y = padding.top + chartH - (i / Y_STEPS) * chartH;
      return { val, y, label: formatNumber(val) };
    });

    // X-axis labels (show ~6-8 labels max)
    const step = Math.max(1, Math.floor(data.length / 7));
    const xLabels = data
      .map((d, i) => ({
        label: formatDate(d.date),
        x: padding.left + i * xStep,
        show: i % step === 0 || i === data.length - 1,
      }))
      .filter((l) => l.show);

    return {
      width,
      height,
      padding,
      chartH,
      spendLine,
      spendArea,
      impLine,
      spendPoints,
      impPoints,
      spendLabels,
      impLabels,
      xLabels,
      maxSpend,
      maxImpressions,
      xStep,
    };
  }, [data]);

  if (!chartData || data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center text-gray-400 text-sm">
        No spend data available for the selected period.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="relative">
        <svg
          viewBox={`0 0 ${chartData.width} ${chartData.height}`}
          className="w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          {/* Grid lines */}
          {chartData.spendLabels.map((label, i) => (
            <line
              key={`grid-${i}`}
              x1={chartData.padding.left}
              y1={label.y}
              x2={chartData.width - chartData.padding.right}
              y2={label.y}
              stroke="#f3f4f6"
              strokeWidth={1}
            />
          ))}

          {/* Spend area fill */}
          <path d={chartData.spendArea} fill="rgba(239, 68, 68, 0.08)" />

          {/* Spend line */}
          <path
            d={chartData.spendLine}
            fill="none"
            stroke="#ef4444"
            strokeWidth={2.5}
            strokeLinejoin="round"
          />

          {/* Impressions line (dashed) */}
          <path
            d={chartData.impLine}
            fill="none"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="6 3"
            strokeLinejoin="round"
          />

          {/* Left Y-axis labels (Spend) */}
          {chartData.spendLabels.map((label, i) => (
            <text
              key={`spend-label-${i}`}
              x={chartData.padding.left - 8}
              y={label.y + 4}
              textAnchor="end"
              className="fill-gray-400"
              fontSize={11}
            >
              {label.label}
            </text>
          ))}

          {/* Right Y-axis labels (Impressions) */}
          {chartData.impLabels.map((label, i) => (
            <text
              key={`imp-label-${i}`}
              x={chartData.width - chartData.padding.right + 8}
              y={label.y + 4}
              textAnchor="start"
              className="fill-blue-400"
              fontSize={11}
            >
              {label.label}
            </text>
          ))}

          {/* X-axis labels */}
          {chartData.xLabels.map((label, i) => (
            <text
              key={`x-label-${i}`}
              x={label.x}
              y={chartData.height - 8}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize={11}
            >
              {label.label}
            </text>
          ))}

          {/* Hover zones */}
          {data.map((_, i) => {
            const x =
              chartData.padding.left +
              i * chartData.xStep -
              chartData.xStep / 2;
            const w = chartData.xStep;
            return (
              <rect
                key={`hover-${i}`}
                x={Math.max(chartData.padding.left, x)}
                y={chartData.padding.top}
                width={Math.min(
                  w,
                  chartData.width -
                    chartData.padding.right -
                    Math.max(chartData.padding.left, x)
                )}
                height={chartData.chartH}
                fill="transparent"
                onMouseEnter={() => setHoveredIdx(i)}
              />
            );
          })}

          {/* Hover indicator */}
          {hoveredIdx !== null && (
            <>
              <line
                x1={chartData.spendPoints[hoveredIdx].x}
                y1={chartData.padding.top}
                x2={chartData.spendPoints[hoveredIdx].x}
                y2={chartData.padding.top + chartData.chartH}
                stroke="#d1d5db"
                strokeWidth={1}
                strokeDasharray="4 2"
              />
              <circle
                cx={chartData.spendPoints[hoveredIdx].x}
                cy={chartData.spendPoints[hoveredIdx].y}
                r={4}
                fill="#ef4444"
                stroke="white"
                strokeWidth={2}
              />
              <circle
                cx={chartData.impPoints[hoveredIdx].x}
                cy={chartData.impPoints[hoveredIdx].y}
                r={4}
                fill="#3b82f6"
                stroke="white"
                strokeWidth={2}
              />
            </>
          )}
        </svg>

        {/* Hover tooltip */}
        {hoveredIdx !== null && (
          <div
            className="absolute bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs pointer-events-none z-10"
            style={{
              left: `${(chartData.spendPoints[hoveredIdx].x / chartData.width) * 100}%`,
              top: "0",
              transform: "translateX(-50%)",
            }}
          >
            <p className="font-medium text-gray-700 mb-1">
              {formatDate(data[hoveredIdx].date)}
            </p>
            <p className="text-red-600">
              Spend: ${data[hoveredIdx].spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-blue-600">
              Impressions: {data[hoveredIdx].impressions.toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-red-500 rounded" />
          Spend (left axis)
        </div>
        <div className="flex items-center gap-2">
          <svg width="16" height="2" viewBox="0 0 16 2">
            <line x1="0" y1="1" x2="16" y2="1" stroke="#3b82f6" strokeWidth="2" strokeDasharray="4 2" />
          </svg>
          Impressions (right axis)
        </div>
      </div>
    </div>
  );
}
