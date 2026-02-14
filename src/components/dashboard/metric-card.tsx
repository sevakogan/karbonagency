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
    <div className={`rounded-xl border border-gray-200 bg-white shadow-sm ${isLarge ? "p-6" : "p-4"}`}>
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
          <InfoTooltip text={description} formula={formula} />
        </p>
      </div>
      <p className={`font-black text-gray-900 ${isLarge ? "text-3xl" : "text-2xl"}`}>
        {prefix}{value}{suffix}
      </p>
      {trend && (
        <p className={`text-xs mt-1 ${trendDown ? "text-red-500" : "text-green-600"}`}>
          {trend}
        </p>
      )}
    </div>
  );
}
