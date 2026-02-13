import type { CampaignMetrics } from "@/types";

interface Props {
  metrics: CampaignMetrics[];
}

export default function CampaignMetricsChart({ metrics }: Props) {
  if (metrics.length === 0) return null;

  const sorted = [...metrics].sort(
    (a, b) => new Date(a.period_start).getTime() - new Date(b.period_start).getTime()
  );

  const maxSpend = Math.max(...sorted.map((m) => Number(m.spend)), 1);
  const maxBookings = Math.max(...sorted.map((m) => m.bookings), 1);

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 mb-4">Spend vs Bookings</h2>
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-end gap-2 h-48">
          {sorted.map((m) => {
            const spendHeight = (Number(m.spend) / maxSpend) * 100;
            const bookingHeight = (m.bookings / maxBookings) * 100;

            return (
              <div key={m.id} className="flex-1 flex items-end gap-1 group relative">
                <div
                  className="flex-1 bg-red-200 rounded-t-md transition-all group-hover:bg-red-300"
                  style={{ height: `${Math.max(spendHeight, 4)}%` }}
                  title={`Spend: $${Number(m.spend).toLocaleString()}`}
                />
                <div
                  className="flex-1 bg-green-200 rounded-t-md transition-all group-hover:bg-green-300"
                  style={{ height: `${Math.max(bookingHeight, 4)}%` }}
                  title={`Bookings: ${m.bookings}`}
                />
                <div className="absolute -bottom-6 left-0 right-0 text-center text-[10px] text-gray-400 truncate">
                  {new Date(m.period_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
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
            <div className="w-3 h-3 rounded bg-green-200" />
            Bookings
          </div>
        </div>
      </div>
    </div>
  );
}
