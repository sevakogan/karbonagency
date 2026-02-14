export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getCampaignById, getCampaignMetrics } from "@/lib/actions/campaigns";
import { getClientById } from "@/lib/actions/clients";
import { getClientMetrics } from "@/lib/actions/metrics";
import {
  getDemographicsBreakdown,
  getPlacementBreakdown,
  getCampaignBreakdown as getMetaCampaignBreakdown,
} from "@/lib/actions/meta";
import { createSupabaseServer } from "@/lib/supabase-server";
import Breadcrumb from "@/components/ui/breadcrumb";
import Badge from "@/components/ui/badge";
import StatCard from "@/components/dashboard/stat-card";
import CampaignMetricsChart from "@/components/dashboard/campaign-metrics-chart";
import CampaignReporting from "@/components/dashboard/reporting/campaign-reporting";
import RenameCampaignName from "@/components/dashboard/rename-campaign-name";
import MetaConnectCard from "@/components/dashboard/meta-connect-card";
import { SERVICE_LABELS } from "@/types";
import type { CampaignService } from "@/types";
import type { ReportingKpiData } from "@/components/dashboard/reporting/reporting-kpi-grid";
import type { CampaignRow } from "@/components/dashboard/reporting/campaign-breakdown-table";
import type { DemographicDataPoint } from "@/components/dashboard/reporting/demographics-chart";
import type { PlacementDataPoint } from "@/components/dashboard/reporting/placement-chart";

interface Props {
  params: Promise<{ id: string }>;
}

// ---------------------------------------------------------------------------
// Helpers for building initial reporting data
// ---------------------------------------------------------------------------

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

function buildCampaignRows(
  data: readonly {
    campaign_id: string;
    campaign_name: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }[] | null
): CampaignRow[] {
  if (!data || data.length === 0) return [];

  const campaignMap = new Map<
    string,
    { name: string; spend: number; impressions: number; clicks: number; conversions: number }
  >();

  for (const row of data) {
    const existing = campaignMap.get(row.campaign_id) ?? {
      name: row.campaign_name,
      spend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };
    campaignMap.set(row.campaign_id, {
      name: row.campaign_name,
      spend: existing.spend + row.spend,
      impressions: existing.impressions + row.impressions,
      clicks: existing.clicks + row.clicks,
      conversions: existing.conversions + row.conversions,
    });
  }

  return [...campaignMap.values()].map((m) => {
    const ctr = m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0;
    const cpc = m.clicks > 0 ? m.spend / m.clicks : 0;
    const roas = m.spend > 0 && m.conversions > 0 ? m.conversions / m.spend : 0;

    return {
      name: m.name,
      status: "active" as const,
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

function buildDemographicPoints(
  data: readonly { age: string; gender: string; spend: number; impressions: number; clicks: number }[] | null
): DemographicDataPoint[] {
  if (!data || data.length === 0) return [];

  const groupMap = new Map<string, DemographicDataPoint>();

  for (const row of data) {
    const key = `${row.age}__${row.gender}`;
    const existing = groupMap.get(key);
    if (existing) {
      groupMap.set(key, {
        age_range: row.age,
        gender: row.gender,
        spend: existing.spend + row.spend,
        impressions: existing.impressions + row.impressions,
        clicks: existing.clicks + row.clicks,
      });
    } else {
      groupMap.set(key, {
        age_range: row.age,
        gender: row.gender,
        spend: row.spend,
        impressions: row.impressions,
        clicks: row.clicks,
      });
    }
  }

  return [...groupMap.values()];
}

function buildPlacementPoints(
  data: readonly {
    publisher_platform: string;
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
  }[] | null
): PlacementDataPoint[] {
  if (!data || data.length === 0) return [];

  const platformMap = new Map<string, PlacementDataPoint>();

  for (const row of data) {
    const platform = row.publisher_platform;
    const existing = platformMap.get(platform);
    if (existing) {
      platformMap.set(platform, {
        platform,
        spend: existing.spend + row.spend,
        impressions: existing.impressions + row.impressions,
        clicks: existing.clicks + row.clicks,
        conversions: existing.conversions + row.conversions,
      });
    } else {
      platformMap.set(platform, {
        platform,
        spend: row.spend,
        impressions: row.impressions,
        clicks: row.clicks,
        conversions: row.conversions,
      });
    }
  }

  return [...platformMap.values()];
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default async function CampaignDetailPage({ params }: Props) {
  const { id } = await params;
  const campaign = await getCampaignById(id);
  if (!campaign) notFound();

  const [metrics, client] = await Promise.all([
    getCampaignMetrics(id),
    getClientById(campaign.client_id),
  ]);

  // Determine user role
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()
    : { data: null };
  const isAdmin = profile?.role === "admin";

  const totalSpend = metrics.reduce((sum, m) => sum + Number(m.spend), 0);
  const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
  const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
  const totalBookings = metrics.reduce((sum, m) => sum + m.bookings, 0);
  const avgCPB = totalBookings > 0 ? totalSpend / totalBookings : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

  // Fetch initial reporting data if this campaign has a Meta ad account
  const adAccountId = campaign.meta_ad_account_id;
  let reportingData: {
    kpi: ReportingKpiData;
    daily: Awaited<ReturnType<typeof getClientMetrics>>["daily"];
    campaigns: CampaignRow[];
    demographics: DemographicDataPoint[];
    placements: PlacementDataPoint[];
  } | null = null;

  if (adAccountId) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    const since = thirtyDaysAgo.toISOString().split("T")[0];
    const until = now.toISOString().split("T")[0];

    const [dailyMetrics, metaCampaigns, demoResult, placementResult] =
      await Promise.all([
        getClientMetrics(campaign.client_id, since, until),
        getMetaCampaignBreakdown(campaign.client_id, since, until, adAccountId),
        getDemographicsBreakdown(campaign.client_id, since, until, adAccountId),
        getPlacementBreakdown(campaign.client_id, since, until, adAccountId),
      ]);

    reportingData = {
      kpi: buildInitialKpi(dailyMetrics),
      daily: dailyMetrics.daily,
      campaigns: buildCampaignRows(metaCampaigns.data),
      demographics: buildDemographicPoints(demoResult.data),
      placements: buildPlacementPoints(placementResult.data),
    };
  }

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Clients", href: "/dashboard/campaigns" },
          ...(client ? [{ label: client.name, href: `/dashboard/clients/${client.id}` }] : []),
          { label: campaign.name },
        ]}
      />
      <div className="flex items-center justify-between mt-2 mb-1">
        <div className="flex items-center gap-3">
          <RenameCampaignName campaignId={id} initialName={campaign.name} />
          <Badge variant={campaign.status}>{campaign.status}</Badge>
        </div>
        <MetaConnectCard
          campaignId={id}
          currentAdAccountId={campaign.meta_ad_account_id ?? null}
          isAdmin={isAdmin}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {(campaign.services ?? []).map((s: CampaignService) => (
          <span key={s} className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
            {SERVICE_LABELS[s] ?? s}
          </span>
        ))}
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Monthly Cost: {campaign.monthly_cost ? `$${Number(campaign.monthly_cost).toLocaleString()}` : "\u2014"}
        {campaign.start_date && ` | Started ${new Date(campaign.start_date).toLocaleDateString()}`}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <StatCard label="Total Spend" value={`$${totalSpend.toLocaleString()}`} />
        <StatCard label="Impressions" value={totalImpressions.toLocaleString()} />
        <StatCard label="Clicks" value={totalClicks.toLocaleString()} />
        <StatCard label="CTR" value={`${ctr.toFixed(2)}%`} />
        <StatCard label="Bookings" value={totalBookings.toLocaleString()} />
        <StatCard label="Avg CPB" value={avgCPB > 0 ? `$${avgCPB.toFixed(2)}` : "\u2014"} />
      </div>

      <CampaignMetricsChart metrics={metrics} />

      <div className="mt-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Performance by Period</h2>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {metrics.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              No metrics recorded yet
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
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
                    <tr key={m.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">
                        {new Date(m.period_start).toLocaleDateString()} {"\u2014"} {new Date(m.period_end).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-900">${Number(m.spend).toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{m.impressions.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{m.clicks.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{mCtr.toFixed(2)}%</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{m.bookings.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">
                        {m.cost_per_booking ? `$${Number(m.cost_per_booking).toFixed(2)}` : "\u2014"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Meta Reporting section -- only rendered when the campaign has an ad account */}
      {adAccountId && reportingData && (
        <div className="mt-12 pt-8 border-t border-gray-200">
          <CampaignReporting
            campaignId={id}
            clientId={campaign.client_id}
            adAccountId={adAccountId}
            isAdmin={isAdmin}
            initialKpi={reportingData.kpi}
            initialDaily={reportingData.daily}
            initialCampaigns={reportingData.campaigns}
            initialDemographics={reportingData.demographics}
            initialPlacements={reportingData.placements}
          />
        </div>
      )}
    </div>
  );
}
