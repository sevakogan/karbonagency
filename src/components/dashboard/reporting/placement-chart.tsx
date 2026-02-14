"use client";

import { useMemo } from "react";

export interface PlacementDataPoint {
  readonly platform: string;
  readonly spend: number;
  readonly impressions: number;
  readonly clicks: number;
  readonly conversions: number;
}

interface PlacementChartProps {
  data: readonly PlacementDataPoint[];
}

const PLATFORM_COLORS: Record<string, string> = {
  facebook: "bg-blue-500",
  instagram: "bg-pink-500",
  "audience network": "bg-amber-500",
  messenger: "bg-purple-500",
};

const PLATFORM_RING_COLORS: Record<string, string> = {
  facebook: "#3b82f6",
  instagram: "#ec4899",
  "audience network": "#f59e0b",
  messenger: "#8b5cf6",
};

function getPlatformColor(platform: string): string {
  return PLATFORM_COLORS[platform.toLowerCase()] ?? "bg-gray-400";
}

function getPlatformRingColor(platform: string): string {
  return PLATFORM_RING_COLORS[platform.toLowerCase()] ?? "#9ca3af";
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

interface PlacementSlice {
  readonly platform: string;
  readonly spend: number;
  readonly impressions: number;
  readonly clicks: number;
  readonly conversions: number;
  readonly percentage: number;
}

export default function PlacementChart({ data }: PlacementChartProps) {
  const { slices, totalSpend } = useMemo(() => {
    if (data.length === 0) return { slices: [], totalSpend: 0 };

    const total = data.reduce((sum, d) => sum + d.spend, 0);

    const sorted = [...data]
      .sort((a, b) => b.spend - a.spend)
      .map((d) => ({
        ...d,
        percentage: total > 0 ? (d.spend / total) * 100 : 0,
      }));

    return { slices: sorted, totalSpend: total };
  }, [data]);

  if (slices.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center text-gray-400 text-sm">
        No placement data available.
      </div>
    );
  }

  // Build SVG donut chart
  const size = 200;
  const center = size / 2;
  const outerRadius = 90;
  const innerRadius = 55;

  const arcs = buildArcs(slices, center, outerRadius, innerRadius);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Donut chart */}
        <div className="shrink-0">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="drop-shadow-sm"
          >
            {arcs.map((arc) => (
              <path
                key={arc.platform}
                d={arc.path}
                fill={getPlatformRingColor(arc.platform)}
                className="transition-opacity hover:opacity-80"
              >
                <title>
                  {arc.platform}: ${fmt(arc.spend, 2)} ({fmt(arc.percentage, 1)}%)
                </title>
              </path>
            ))}
            {/* Center text */}
            <text
              x={center}
              y={center - 6}
              textAnchor="middle"
              className="fill-gray-900 font-black"
              fontSize={16}
            >
              ${totalSpend >= 1000 ? `${(totalSpend / 1000).toFixed(1)}k` : fmt(totalSpend, 0)}
            </text>
            <text
              x={center}
              y={center + 12}
              textAnchor="middle"
              className="fill-gray-400"
              fontSize={11}
            >
              Total Spend
            </text>
          </svg>
        </div>

        {/* Breakdown list */}
        <div className="flex-1 w-full space-y-3">
          {slices.map((slice) => (
            <div key={slice.platform} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded shrink-0 ${getPlatformColor(slice.platform)}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {slice.platform}
                  </span>
                  <span className="text-sm font-mono text-gray-500">
                    ${fmt(slice.spend, 2)}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${getPlatformColor(slice.platform)}`}
                      style={{ width: `${Math.max(slice.percentage, 1)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {fmt(slice.percentage, 1)}%
                  </span>
                </div>
              </div>
            </div>
          ))}

          {/* Summary stats */}
          <div className="pt-3 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-400">Impressions</p>
              <p className="text-sm font-medium text-gray-700">
                {fmt(slices.reduce((s, d) => s + d.impressions, 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Clicks</p>
              <p className="text-sm font-medium text-gray-700">
                {fmt(slices.reduce((s, d) => s + d.clicks, 0))}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Conversions</p>
              <p className="text-sm font-medium text-gray-700">
                {fmt(slices.reduce((s, d) => s + d.conversions, 0))}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Build SVG arc paths for a donut chart */
function buildArcs(
  slices: readonly PlacementSlice[],
  center: number,
  outerR: number,
  innerR: number
): readonly {
  platform: string;
  spend: number;
  percentage: number;
  path: string;
}[] {
  const GAP_ANGLE = 0.02; // radians between slices
  let currentAngle = -Math.PI / 2; // start at top

  return slices.map((slice) => {
    const angle = (slice.percentage / 100) * 2 * Math.PI - GAP_ANGLE;
    const startAngle = currentAngle + GAP_ANGLE / 2;
    const endAngle = startAngle + Math.max(angle, 0.01);

    const outerStart = polarToCartesian(center, center, outerR, startAngle);
    const outerEnd = polarToCartesian(center, center, outerR, endAngle);
    const innerStart = polarToCartesian(center, center, innerR, endAngle);
    const innerEnd = polarToCartesian(center, center, innerR, startAngle);

    const largeArc = angle > Math.PI ? 1 : 0;

    const path = [
      `M ${outerStart.x} ${outerStart.y}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
      `L ${innerStart.x} ${innerStart.y}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${innerEnd.x} ${innerEnd.y}`,
      "Z",
    ].join(" ");

    currentAngle += (slice.percentage / 100) * 2 * Math.PI;

    return {
      platform: slice.platform,
      spend: slice.spend,
      percentage: slice.percentage,
      path,
    };
  });
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angle: number
): { x: number; y: number } {
  return {
    x: cx + radius * Math.cos(angle),
    y: cy + radius * Math.sin(angle),
  };
}
