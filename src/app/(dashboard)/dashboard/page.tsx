export const dynamic = "force-dynamic";

import Link from "next/link";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getClientMetrics } from "@/lib/actions/metrics";
import { getCampaigns } from "@/lib/actions/campaigns";
import MetricCard from "@/components/dashboard/metric-card";
import DailySpendChart from "@/components/dashboard/daily-spend-chart";
import ConversionsChart from "@/components/dashboard/conversions-chart";
import StatCard from "@/components/dashboard/stat-card";
import Badge from "@/components/ui/badge";
import { METRIC_DEFINITIONS } from "@/lib/metric-definitions";
import { SERVICE_LABELS } from "@/types";
import type { CampaignService } from "@/types";

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCurrency(n: number): string {
  return `$${fmt(n, 2)}`;
}

export default async function DashboardOverview() {
  const supabase = await createSupabaseServer();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, client_id")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // ── Admin view ────────────────────────────────────────
  if (isAdmin) {
    const { count: leadCount } = await supabase
      .from("agency_leads")
      .select("*", { count: "exact", head: true });
    const { count: campaignCount } = await supabase
      .from("campaigns")
      .select("*", { count: "exact", head: true });
    const { count: newLeadCount } = await supabase
      .from("agency_leads")
      .select("*", { count: "exact", head: true })
      .eq("status", "new");
    const { count: clientCount } = await supabase
      .from("clients")
      .select("*", { count: "exact", head: true });

    return (
      <div>
        <h1 className="text-2xl font-black text-gray-900 mb-1">
          Admin Dashboard
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Leads" value={leadCount ?? 0} />
          <StatCard label="New Leads" value={newLeadCount ?? 0} />
          <StatCard label="Projects" value={campaignCount ?? 0} />
          <StatCard label="Total Clients" value={clientCount ?? 0} />
        </div>
      </div>
    );
  }

  // ── Client view — full metrics dashboard ──────────────
  const clientId = profile?.client_id;
  if (!clientId) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg font-medium">No client account linked</p>
        <p className="text-sm mt-1">
          Contact your account manager to get set up.
        </p>
      </div>
    );
  }

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().split("T")[0];
  const until = now.toISOString().split("T")[0];

  const [metrics, campaigns] = await Promise.all([
    getClientMetrics(clientId, since, until),
    getCampaigns({ clientId }),
  ]);

  const d = METRIC_DEFINITIONS;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Welcome back
          {profile?.full_name ? `, ${profile.full_name}` : ""} —
          here&apos;s your advertising performance for the last 30 days.
        </p>
      </div>

      {/* ── Section 1: Spend & Budget ─────────────────── */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Spend & Budget
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label={d.total_spend.label}
            value={fmtCurrency(metrics.total_spend)}
            description={d.total_spend.description}
            size="large"
          />
          <MetricCard
            label={d.daily_spend.label}
            value={fmtCurrency(
              metrics.daily.length > 0
                ? metrics.total_spend / metrics.daily.length
                : 0
            )}
            description={d.daily_spend.description}
            formula={d.daily_spend.formula}
          />
          <MetricCard
            label={d.cpc.label}
            value={fmtCurrency(metrics.avg_cpc)}
            description={d.cpc.description}
            formula={d.cpc.formula}
          />
          <MetricCard
            label={d.cpm.label}
            value={fmtCurrency(metrics.avg_cpm)}
            description={d.cpm.description}
            formula={d.cpm.formula}
          />
        </div>
      </div>

      {/* ── Section 2: Reach & Awareness ──────────────── */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Reach & Awareness
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label={d.impressions.label}
            value={fmt(metrics.total_impressions)}
            description={d.impressions.description}
          />
          <MetricCard
            label={d.reach.label}
            value={fmt(metrics.total_reach)}
            description={d.reach.description}
          />
          <MetricCard
            label={d.frequency.label}
            value={
              metrics.total_reach > 0
                ? fmt(metrics.total_impressions / metrics.total_reach, 1)
                : "—"
            }
            description={d.frequency.description}
            formula={d.frequency.formula}
          />
          <MetricCard
            label={d.video_views.label}
            value={fmt(metrics.total_video_views)}
            description={d.video_views.description}
          />
        </div>
      </div>

      {/* ── Section 3: Engagement & Clicks ────────────── */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Engagement & Clicks
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label={d.clicks.label}
            value={fmt(metrics.total_clicks)}
            description={d.clicks.description}
          />
          <MetricCard
            label={d.link_clicks.label}
            value={fmt(metrics.total_link_clicks)}
            description={d.link_clicks.description}
          />
          <MetricCard
            label={d.ctr.label}
            value={`${fmt(metrics.avg_ctr, 2)}%`}
            description={d.ctr.description}
            formula={d.ctr.formula}
          />
          <MetricCard
            label={d.cpc.label}
            value={fmtCurrency(metrics.avg_cpc)}
            description={d.cpc.description}
            formula={d.cpc.formula}
          />
        </div>
      </div>

      {/* ── Section 4: Conversions & Results ──────────── */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Conversions & Results
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label={d.conversions.label}
            value={fmt(metrics.total_conversions)}
            description={d.conversions.description}
            size="large"
          />
          <MetricCard
            label={d.cost_per_conversion.label}
            value={
              metrics.avg_cost_per_conversion
                ? fmtCurrency(metrics.avg_cost_per_conversion)
                : "—"
            }
            description={d.cost_per_conversion.description}
            formula={d.cost_per_conversion.formula}
          />
          <MetricCard
            label={d.leads.label}
            value={fmt(metrics.total_leads)}
            description={d.leads.description}
          />
          <MetricCard
            label={d.roas.label}
            value={metrics.avg_roas ? `${fmt(metrics.avg_roas, 1)}x` : "—"}
            description={d.roas.description}
            formula={d.roas.formula}
          />
        </div>
      </div>

      {/* ── Charts ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Daily Spend & Clicks
          </h2>
          <DailySpendChart metrics={metrics.daily} />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Daily Conversions & Leads
          </h2>
          <ConversionsChart metrics={metrics.daily} />
        </div>
      </div>

      {/* ── Active Projects ───────────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Your Projects
        </h2>
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 text-center text-gray-400 text-sm">
            No active projects yet
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((campaign) => (
              <Link
                key={campaign.id}
                href={`/dashboard/campaigns/${campaign.id}`}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:border-red-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-gray-900 text-sm">
                    {campaign.name}
                  </h3>
                  <Badge variant={campaign.status}>{campaign.status}</Badge>
                </div>
                <div className="flex flex-wrap gap-1 mb-3">
                  {(campaign.services ?? []).map((s: CampaignService) => (
                    <span
                      key={s}
                      className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500"
                    >
                      {SERVICE_LABELS[s] ?? s}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-500">
                  {campaign.monthly_cost
                    ? `$${Number(campaign.monthly_cost).toLocaleString()}/mo`
                    : "—"}
                  {campaign.start_date &&
                    ` · Started ${new Date(campaign.start_date).toLocaleDateString()}`}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
