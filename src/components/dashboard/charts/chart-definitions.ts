import type { MetricSeries } from "./metric-line-chart";
import type { DailyMetrics } from "@/types";

// ---------------------------------------------------------------------------
// Formatters
// ---------------------------------------------------------------------------

const fmtDollar = (v: number) =>
  `$${v.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtNumber = (v: number) => v.toLocaleString();

const fmtPercent = (v: number) => `${v.toFixed(2)}%`;

const fmtDollarAxis = (v: number) =>
  v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`;

const fmtCompact = (v: number) =>
  v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`;

// ---------------------------------------------------------------------------
// Chart configurations
// ---------------------------------------------------------------------------

export interface ChartConfig {
  readonly title: string;
  readonly series: readonly MetricSeries[];
  /** Extracts data rows from metrics */
  readonly getData: (metrics: readonly DailyMetrics[]) => readonly { date: string; [key: string]: string | number }[];
  /** Y-axis formatter */
  readonly yAxisFormat?: (value: number) => string;
  readonly height?: number;
}

/**
 * All available chart definitions, keyed by a unique ID.
 */
export const CHART_CONFIGS: Record<string, ChartConfig> = {
  impressions_reach: {
    title: "Impressions & Reach",
    series: [
      {
        key: "impressions",
        label: "Impressions",
        color: "#f97316",
        colorLight: "#fed7aa",
        format: fmtNumber,
      },
      {
        key: "reach",
        label: "Reach",
        color: "#06b6d4",
        colorLight: "#cffafe",
        format: fmtNumber,
      },
    ],
    getData: (metrics) =>
      metrics.map((m) => ({
        date: m.date,
        impressions: m.impressions,
        reach: m.reach,
      })),
    yAxisFormat: fmtCompact,
  },

  ctr_cpc: {
    title: "CTR & CPC",
    series: [
      {
        key: "ctr",
        label: "CTR %",
        color: "#8b5cf6",
        colorLight: "#ddd6fe",
        format: fmtPercent,
      },
      {
        key: "cpc",
        label: "CPC",
        color: "#10b981",
        colorLight: "#d1fae5",
        format: fmtDollar,
        yAxis: "right",
      },
    ],
    getData: (metrics) =>
      metrics.map((m) => ({
        date: m.date,
        ctr: m.ctr,
        cpc: m.cpc,
      })),
    yAxisFormat: (v: number) => `${v.toFixed(1)}%`,
  },

  cpm: {
    title: "CPM",
    series: [
      {
        key: "cpm",
        label: "CPM",
        color: "#ec4899",
        colorLight: "#fce7f3",
        format: fmtDollar,
      },
    ],
    getData: (metrics) =>
      metrics.map((m) => ({
        date: m.date,
        cpm: m.cpm,
      })),
    yAxisFormat: fmtDollarAxis,
  },

  link_clicks: {
    title: "Link Clicks & Video Views",
    series: [
      {
        key: "link_clicks",
        label: "Link Clicks",
        color: "#3b82f6",
        colorLight: "#dbeafe",
        format: fmtNumber,
      },
      {
        key: "video_views",
        label: "Video Views",
        color: "#a855f7",
        colorLight: "#f3e8ff",
        format: fmtNumber,
      },
    ],
    getData: (metrics) =>
      metrics.map((m) => ({
        date: m.date,
        link_clicks: m.link_clicks,
        video_views: m.video_views,
      })),
    yAxisFormat: fmtCompact,
  },

  cost_per_result: {
    title: "Cost per Conversion",
    series: [
      {
        key: "cost_per_conversion",
        label: "Cost / Conversion",
        color: "#ef4444",
        colorLight: "#fee2e2",
        format: fmtDollar,
      },
    ],
    getData: (metrics) =>
      metrics.map((m) => ({
        date: m.date,
        cost_per_conversion: m.cost_per_conversion ?? 0,
      })),
    yAxisFormat: fmtDollarAxis,
  },

  roas: {
    title: "Return on Ad Spend",
    series: [
      {
        key: "roas",
        label: "ROAS",
        color: "#14b8a6",
        colorLight: "#ccfbf1",
        format: (v: number) => `${v.toFixed(2)}x`,
      },
    ],
    getData: (metrics) =>
      metrics.map((m) => ({
        date: m.date,
        roas: m.roas ?? 0,
      })),
    yAxisFormat: (v: number) => `${v.toFixed(1)}x`,
  },
} as const;

/**
 * Default ordering of charts on the dashboard.
 */
export const DEFAULT_CHART_ORDER = [
  "impressions_reach",
  "ctr_cpc",
  "link_clicks",
  "cpm",
  "cost_per_result",
  "roas",
] as const;
