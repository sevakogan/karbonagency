"use client";

import type { DailyMetrics } from "@/types";

interface Props {
  metrics: DailyMetrics[];
}

export default function ConversionsChart({ metrics }: Props) {
  if (metrics.length === 0) return null;

  const maxConversions = Math.max(...metrics.map((m) => m.conversions), 1);
  const maxLeads = Math.max(...metrics.map((m) => m.leads), 1);
  const maxVal = Math.max(maxConversions, maxLeads);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-end gap-1.5 h-40">
        {metrics.map((m) => {
          const convHeight = maxVal > 0 ? (m.conversions / maxVal) * 100 : 0;
          const leadHeight = maxVal > 0 ? (m.leads / maxVal) * 100 : 0;

          return (
            <div key={m.id ?? m.date} className="flex-1 flex items-end gap-0.5 group relative min-w-0">
              <div
                className="flex-1 bg-green-200 rounded-t transition-all group-hover:bg-green-400"
                style={{ height: `${Math.max(convHeight, 3)}%` }}
                title={`Conversions: ${m.conversions}`}
              />
              <div
                className="flex-1 bg-purple-200 rounded-t transition-all group-hover:bg-purple-400"
                style={{ height: `${Math.max(leadHeight, 3)}%` }}
                title={`Leads: ${m.leads}`}
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
          <div className="w-3 h-3 rounded bg-green-200" />
          Conversions
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-200" />
          Leads
        </div>
      </div>
    </div>
  );
}
