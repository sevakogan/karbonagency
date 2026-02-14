"use client";

import type { DailyMetrics } from "@/types";

interface Props {
  metrics: DailyMetrics[];
}

export default function DailySpendChart({ metrics }: Props) {
  if (metrics.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center text-gray-400 text-sm">
        No data yet — metrics will appear once your ads are running.
      </div>
    );
  }

  const maxSpend = Math.max(...metrics.map((m) => Number(m.spend)), 1);
  const maxClicks = Math.max(...metrics.map((m) => m.clicks), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-end gap-1.5 h-48">
        {metrics.map((m) => {
          const spendHeight = (Number(m.spend) / maxSpend) * 100;
          const clickHeight = (m.clicks / maxClicks) * 100;

          return (
            <div key={m.id ?? m.date} className="flex-1 flex items-end gap-0.5 group relative min-w-0">
              <div
                className="flex-1 bg-red-200 rounded-t transition-all group-hover:bg-red-400"
                style={{ height: `${Math.max(spendHeight, 3)}%` }}
                title={`Spend: $${Number(m.spend).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              />
              <div
                className="flex-1 bg-blue-200 rounded-t transition-all group-hover:bg-blue-400"
                style={{ height: `${Math.max(clickHeight, 3)}%` }}
                title={`Clicks: ${m.clicks.toLocaleString()}`}
              />
              <div className="absolute -bottom-6 left-0 right-0 text-center text-[9px] text-gray-400 truncate">
                {new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-6 mt-10 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-red-200" />
          Spend
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-blue-200" />
          Clicks
        </div>
      </div>
    </div>
  );
}
