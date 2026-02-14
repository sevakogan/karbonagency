export const dynamic = "force-dynamic";

import { createSupabaseServer } from "@/lib/supabase-server";
import { getClientMetrics } from "@/lib/actions/metrics";
import ReportingClient from "@/components/dashboard/reporting/reporting-client";
import type { ReportingKpiData } from "@/components/dashboard/reporting/reporting-kpi-grid";
import type { CampaignRow } from "@/components/dashboard/reporting/campaign-breakdown-table";
import type { DemographicDataPoint } from "@/components/dashboard/reporting/demographics-chart";
import type { PlacementDataPoint } from "@/components/dashboard/reporting/placement-chart";

/**
 * Build KPI summary from daily metrics for initial server render.
 */
function buildInitialKpi(metrics: {
  total_spend: number;
  total_impressions: number;
  total_clicks: number;
  total_conversions: number;
  total_leads: number;
  avg_ctr: number;
  avg_cpc: number;
  avg_cpm: number;
  avg_roas: number | null;
}): ReportingKpiData {
  return {
    spend: metrics.total_spend,
    impressions: metrics.total_impressions,
    clicks: metrics.total_clicks,
    ctr: metrics.avg_ctr,
    cpc: metrics.avg_cpc,
    cpm: metrics.avg_cpm,
    conversions: metrics.total_conversions,
    roas: metrics.avg_roas,
    leads: metrics.total_leads,
  };
}

/**
 * Fetch campaign-level breakdown for the reporting table.
 * This builds rows from the campaigns + campaign_metrics tables.
 */
async function fetchCampaignBreakdown(
  clientId: string,
  supabase: Awaited<ReturnType<typeof createSupabaseServer>>
): Promise<CampaignRow[]> {
  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, name, status")
    .eq("client_id", clientId);

  if (error || !campaigns) return [];

  const { data: metricsRows } = await supabase
    .from("campaign_metrics")
    .select("campaign_id, spend, impressions, clicks, bookings, cost_per_booking")
    .eq("client_id", clientId);

  const metricsByCampaign = new Map<
    string,
    { spend: number; impressions: number; clicks: number; conversions: number }
  >();

  for (const row of metricsRows ?? []) {
    const existing = metricsByCampaign.get(row.campaign_id) ?? {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };
    metricsByCampaign.set(row.campaign_id, {
      spend: existing.spend + Number(row.spend),
      impressions: existing.impressions + Number(row.impressions),
      clicks: existing.clicks + Number(row.clicks),
      conversions: existing.conversions + Number(row.bookings),
    });
  }

  return campaigns.map((c) => {
    const m = metricsByCampaign.get(c.id) ?? {
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };
    const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
    const cpc = m.clicks > 0 ? m.spend / m.clicks : 0;
    const roas = m.spend > 0 && m.conversions > 0 ? m.conversions / m.spend : 0;

    return {
      name: c.name,
      status: c.status as CampaignRow["status"],
      spend: m.spend,
      impressions: m.impressions,
      clicks: m.clicks,
      ctr,
      cpc,
      conversions: m.conversions,
      roas,
    };
  });
}

/**
 * Build placeholder demographics data from daily_metrics.
 * The real demographics breakdown will come from the Meta API agent later.
 * For now we provide sample structure so the UI renders correctly.
 */
function buildPlaceholderDemographics(): DemographicDataPoint[] {
  return [];
}

/**
 * Build placeholder placement data.
 * The real breakdown will come from the Meta API agent later.
 */
function buildPlaceholderPlacements(): PlacementDataPoint[] {
  return [];
}

export default async function ReportingPage() {
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

  // Determine which client to show
  const isAdmin = profile?.role === "admin";
  let clientId = profile?.client_id;

  // Admin users: show the first active client (or empty state)
  if (isAdmin && !clientId) {
    const { data: firstClient } = await supabase
      .from("clients")
      .select("id")
      .eq("is_active", true)
      .order("name")
      .limit(1)
      .single();

    clientId = firstClient?.id ?? null;
  }

  if (!clientId) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-lg font-medium">No client data to display</p>
        <p className="text-sm mt-1">
          {isAdmin
            ? "Create a client account first to see reporting data."
            : "Contact your account manager to get set up."}
        </p>
      </div>
    );
  }

  // Fetch last 30 days of data for initial render
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().split("T")[0];
  const until = now.toISOString().split("T")[0];

  const [metrics, campaignRows] = await Promise.all([
    getClientMetrics(clientId, since, until),
    fetchCampaignBreakdown(clientId, supabase),
  ]);

  const initialKpi = buildInitialKpi(metrics);
  const demographics = buildPlaceholderDemographics();
  const placements = buildPlaceholderPlacements();

  return (
    <ReportingClient
      clientId={clientId}
      initialKpi={initialKpi}
      initialDaily={metrics.daily}
      initialCampaigns={campaignRows}
      initialDemographics={demographics}
      initialPlacements={placements}
    />
  );
}
