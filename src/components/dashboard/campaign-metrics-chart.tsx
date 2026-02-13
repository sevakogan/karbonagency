import type { CampaignMetrics } from "@/types";

interface Props {
  metrics: CampaignMetrics[];
}

export default function CampaignMetricsChart({ metrics }: Props) {
  if (metrics.length === 0) return null;

  // Sort chronologically for the chart
  const sorted = [...metrics].sort(
    (a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime()
  );

  const maxSpend = Math.max(...sorted.map((m) => Number(m.spend)), 1);
  const maxBookings = Math.max(...sorted.map((m) => m.bookings), 1);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Spend vs Bookings</h2>
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
        <div className="flex items-end gap-2 h-48">
          {sorted.map((m) => {
            const spendHeight = (Number(m.spend) / maxSpend) * 100;
            const bookingHeight = (m.bookings / maxBookings) * 100;

            return (
              <div key={m.id} className="flex-1 flex items-end gap-1 group relative">
                {/* Spend bar */}
                <div
                  className="flex-1 bg-red-500/30 rounded-t-md transition-all group-hover:bg-red-500/50"
                  style={{ height: `${Math.max(spendHeight, 4)}%` }}
                  title={`Spend: $${Number(m.spend).toLocaleString()}`}
                />
                {/* Bookings bar */}
                <div
                  className="flex-1 bg-green-500/30 rounded-t-md transition-all group-hover:bg-green-500/50"
                  style={{ height: `${Math.max(bookingHeight, 4)}%` }}
                  title={`Bookings: ${m.bookings}`}
                />
                {/* Period label */}
                <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-white/20 truncate">
                  {new Date(m.period_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-10 text-xs text-white/40">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-500/30" />
            Spend
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500/30" />
            Bookings
          </div>
        </div>
      </div>
    </div>
  );
}
