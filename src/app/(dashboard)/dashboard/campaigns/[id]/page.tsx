export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaignById, getCampaignMetrics } from "@/lib/actions/campaigns";
import Badge from "@/components/ui/badge";
import StatCard from "@/components/dashboard/stat-card";
import CampaignMetricsChart from "@/components/dashboard/campaign-metrics-chart";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) notFound();

  const metrics = await getCampaignMetrics(id);

  // Compute aggregate metrics
  const totalSpend = metrics.reduce((sum, m) => sum + Number(m.spend), 0);
  const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
  const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
  const totalBookings = metrics.reduce((sum, m) => sum + m.bookings, 0);
  const avgCPB = totalBookings > 0 ? totalSpend / totalBookings : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link href="/dashboard/campaigns" className="text-white/40 hover:text-white/70 text-sm transition-colors">
          Campaigns
        </Link>
        <span className="text-white/20">/</span>
        <h1 className="text-2xl font-black">{campaign.name}</h1>
        <Badge variant={campaign.status}>{campaign.status}</Badge>
      </div>
      <p className="text-sm text-white/40 mb-8">
        Platform: {campaign.platform} | Budget: {campaign.budget ? `$${Number(campaign.budget).toLocaleString()}` : "—"}
        {campaign.start_date && ` | ${new Date(campaign.start_date).toLocaleDateString()}`}
        {campaign.end_date && ` — ${new Date(campaign.end_date).toLocaleDateString()}`}
      </p>

      {/* Aggregate stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Spend" value={`$${totalSpend.toLocaleString()}`} />
        <StatCard label="Impressions" value={totalImpressions.toLocaleString()} />
        <StatCard label="Clicks" value={totalClicks.toLocaleString()} />
        <StatCard label="CTR" value={`${ctr.toFixed(2)}%`} />
        <StatCard label="Bookings" value={totalBookings.toLocaleString()} />
        <StatCard label="Avg CPB" value={avgCPB > 0 ? `$${avgCPB.toFixed(2)}` : "—"} />
      </div>

      {/* Metrics chart */}
      <CampaignMetricsChart metrics={metrics} />

      {/* Metrics table */}
      <div className="mt-8">
        <h2 className="text-lg font-bold mb-4">Performance by Period</h2>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          {metrics.length === 0 ? (
            <div className="text-center py-12 text-white/30 text-sm">
              No metrics recorded yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wide">
                  <th className="text-left py-3 px-4 font-medium">Period</th>
                  <th className="text-right py-3 px-4 font-medium">Spend</th>
                  <th className="text-right py-3 px-4 font-medium">Impressions</th>
                  <th className="text-right py-3 px-4 font-medium">Clicks</th>
                  <th className="text-right py-3 px-4 font-medium">CTR</th>
                  <th className="text-right py-3 px-4 font-medium">Bookings</th>
                  <th className="text-right py-3 px-4 font-medium">CPB</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => {
                  const mCtr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
                  return (
                    <tr key={m.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="py-3 px-4">
                        {new Date(m.period_start).toLocaleDateString()} — {new Date(m.period_end).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">${Number(m.spend).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-white/60">{m.impressions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-white/60">{m.clicks.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-white/60">{mCtr.toFixed(2)}%</td>
                      <td className="py-3 px-4 text-right font-medium">{m.bookings.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium">
                        {m.cost_per_booking ? `$${Number(m.cost_per_booking).toFixed(2)}` : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
