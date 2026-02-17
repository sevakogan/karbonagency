export const dynamic = "force-dynamic";

import Link from "next/link";
import Breadcrumb from "@/components/ui/breadcrumb";
import { createSupabaseServer } from "@/lib/supabase-server";
import { getClientMetrics } from "@/lib/actions/metrics";
import { getCampaigns } from "@/lib/actions/campaigns";
import MetricCard from "@/components/dashboard/metric-card";
import DailySpendChart from "@/components/dashboard/daily-spend-chart";
import ConversionsChart from "@/components/dashboard/conversions-chart";
import DateRangeSelector from "@/components/dashboard/date-range-selector";
import SyncMetaButton from "@/components/dashboard/sync-meta-button";
import StatCard from "@/components/dashboard/stat-card";
import Badge from "@/components/ui/badge";
import { METRIC_DEFINITIONS } from "@/lib/metric-definitions";
import { SERVICE_LABELS } from "@/types";
import type { CampaignService } from "@/types";

const RANGE_OPTIONS = [
  { label: "30 days", days: 30 },
  { label: "60 days", days: 60 },
  { label: "90 days", days: 90 },
] as const;

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtCurrency(n: number): string {
  return `$${fmt(n, 2)}`;
}

export default async function DashboardOverview({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const rangeDays = [30, 60, 90].includes(Number(params.range))
    ? Number(params.range)
    : 90;
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
        <Breadcrumb items={[{ label: "Overview" }]} />
        <h1 className="text-2xl font-black text-gray-900 mt-2 mb-1">
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

        {/* Meta Sync */}
        <div className="mt-8">
          <SyncMetaButton />
        </div>
      </div>
    );
  }

  // ── Client view — full metrics dashboard ──────────────
  const clientId = profile?.client_id;
  if (!clientId) {
    return (
      <div className="max-w-md mx-auto py-16">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
              </svg>
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Your account is being set up
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Your agency team is connecting your ad accounts. Once linked, you&apos;ll
            see all your campaign performance data here.
          </p>
          <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-left space-y-2">
            <p className="text-xs font-semibold text-gray-700 mb-2">
              What you can do to speed things up:
            </p>
            <div className="flex gap-2 text-xs text-gray-600">
              <span className="text-gray-400 mt-0.5">1.</span>
              <p>
                Make sure your agency has{" "}
                <span className="font-medium text-gray-900">
                  Partner access
                </span>{" "}
                to your Facebook Ad Account and Page in{" "}
                <a
                  href="https://business.facebook.com/settings"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Business Settings
                </a>
              </p>
            </div>
            <div className="flex gap-2 text-xs text-gray-600">
              <span className="text-gray-400 mt-0.5">2.</span>
              <p>
                Send your{" "}
                <span className="font-medium text-gray-900">
                  Ad Account ID, Page ID,
                </span>{" "}
                and{" "}
                <span className="font-medium text-gray-900">Pixel ID</span> to your
                account manager
              </p>
            </div>
            <div className="flex gap-2 text-xs text-gray-600">
              <span className="text-gray-400 mt-0.5">3.</span>
              <p>
                Check your{" "}
                <Link
                  href="/dashboard/profile"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  profile
                </Link>{" "}
                to make sure your contact info is up to date
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const now = new Date();
  const rangeStart = new Date(now);
  rangeStart.setDate(now.getDate() - rangeDays);
  const since = rangeStart.toISOString().split("T")[0];
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
        <Breadcrumb items={[{ label: "Overview" }]} />
        <div className="flex items-center justify-between mt-2 mb-1">
          <h1 className="text-2xl font-black text-gray-900">Dashboard</h1>
          <DateRangeSelector
            options={RANGE_OPTIONS}
            currentDays={rangeDays}
          />
        </div>
        <p className="text-sm text-gray-500">
          Welcome back
          {profile?.full_name ? `, ${profile.full_name}` : ""} —
          here&apos;s your advertising performance for the last {rangeDays} days.
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
        <DailySpendChart metrics={metrics.daily} />
        <ConversionsChart metrics={metrics.daily} />
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
