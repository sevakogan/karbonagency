"use client";

import MetricCard from "@/components/dashboard/metric-card";
import { METRIC_DEFINITIONS } from "@/lib/metric-definitions";

export interface ReportingKpiData {
  readonly spend: number;
  readonly impressions: number;
  readonly clicks: number;
  readonly ctr: number;
  readonly cpc: number;
  readonly cpm: number;
  readonly conversions: number;
  readonly roas: number | null;
  readonly leads: number;
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCurrency(n: number): string {
  return `$${fmt(n, 2)}`;
}

interface ReportingKpiGridProps {
  metrics: ReportingKpiData;
}

export default function ReportingKpiGrid({ metrics }: ReportingKpiGridProps) {
  const d = METRIC_DEFINITIONS;

  const cards = [
    {
      key: "spend",
      label: d.total_spend.label,
      value: fmtCurrency(metrics.spend),
      description: d.total_spend.description,
      size: "large" as const,
    },
    {
      key: "impressions",
      label: d.impressions.label,
      value: fmt(metrics.impressions),
      description: d.impressions.description,
    },
    {
      key: "clicks",
      label: d.clicks.label,
      value: fmt(metrics.clicks),
      description: d.clicks.description,
    },
    {
      key: "ctr",
      label: d.ctr.label,
      value: `${fmt(metrics.ctr, 2)}%`,
      description: d.ctr.description,
      formula: d.ctr.formula,
    },
    {
      key: "cpc",
      label: d.cpc.label,
      value: fmtCurrency(metrics.cpc),
      description: d.cpc.description,
      formula: d.cpc.formula,
    },
    {
      key: "cpm",
      label: d.cpm.label,
      value: fmtCurrency(metrics.cpm),
      description: d.cpm.description,
      formula: d.cpm.formula,
    },
    {
      key: "conversions",
      label: d.conversions.label,
      value: fmt(metrics.conversions),
      description: d.conversions.description,
    },
    {
      key: "roas",
      label: d.roas.label,
      value: metrics.roas !== null ? `${fmt(metrics.roas, 1)}x` : "\u2014",
      description: d.roas.description,
      formula: d.roas.formula,
    },
    {
      key: "leads",
      label: d.leads.label,
      value: fmt(metrics.leads),
      description: d.leads.description,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {cards.map((card) => (
        <MetricCard
          key={card.key}
          label={card.label}
          value={card.value}
          description={card.description}
          formula={card.formula}
          size={card.size}
        />
      ))}
    </div>
  );
}
