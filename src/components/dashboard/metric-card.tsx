"use client";

import InfoTooltip from "@/components/ui/info-tooltip";

interface MetricCardProps {
  label: string;
  value: string | number;
  description: string;
  formula?: string;
  trend?: string;
  trendDown?: boolean;
  prefix?: string;
  suffix?: string;
  size?: "default" | "large";
}

/**
 * A stat card with a built-in "?" tooltip explaining the metric.
 * Designed for client-facing dashboards where users may not know ad terminology.
 */
export default function MetricCard({
  label,
  value,
  description,
  formula,
  trend,
  trendDown = false,
  prefix = "",
  suffix = "",
  size = "default",
}: MetricCardProps) {
  const isLarge = size === "large";

  return (
    <div className={`glass-card ${isLarge ? "p-4" : "p-3"}`}>
      <div className="flex items-start justify-between mb-0.5">
        <p className="text-[11px] font-medium uppercase tracking-wide" style={{ color: "var(--text-secondary)" }}>
          {label}
          <InfoTooltip text={description} formula={formula} />
        </p>
      </div>
      <p className={`font-bold ${isLarge ? "text-xl" : "text-lg"}`} style={{ color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
        {prefix}{value}{suffix}
      </p>
      {trend && (
        <p className="text-[11px] mt-0.5" style={{ color: trendDown ? "var(--system-red)" : "var(--system-green)" }}>
          {trend}
        </p>
      )}
    </div>
  );
}
