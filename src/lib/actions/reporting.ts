"use server";

import { getClientMetrics } from "@/lib/actions/metrics";
import {
  getDemographicsBreakdown,
  getPlacementBreakdown,
  getCampaignBreakdown as getMetaCampaignBreakdown,
  syncClientMetrics,
} from "@/lib/actions/meta";
import type { DailyMetrics } from "@/types";

// ---------------------------------------------------------------------------
// Types — match the chart component interfaces
// ---------------------------------------------------------------------------

interface ReportingKpiData {
  readonly spend: number;
  readonly impressions: number;
  readonly clicks: number;
  readonly ctr: number;
  readonly cpc: number;
  readonly cpm: number;
  readonly conversions: number;
  readonly roas: number | null;
  readonly leads: number;
}

interface CampaignRow {
  readonly name: string;
  readonly status: "draft" | "active" | "paused" | "completed";
  readonly spend: number;
  readonly impressions: number;
  readonly clicks: number;
  readonly ctr: number;
  readonly cpc: number;
  readonly conversions: number;
  readonly roas: number;
}

interface DemographicDataPoint {
  readonly age_range: string;
  readonly gender: string;
  readonly spend: number;
  readonly impressions: number;
  readonly clicks: number;
}

interface PlacementDataPoint {
  readonly platform: string;
  readonly spend: number;
  readonly impressions: number;
  readonly clicks: number;
  readonly conversions: number;
}

export interface ReportingSnapshot {
  readonly kpi: ReportingKpiData;
  readonly daily: readonly DailyMetrics[];
  readonly campaigns: readonly CampaignRow[];
  readonly demographics: readonly DemographicDataPoint[];
  readonly placements: readonly PlacementDataPoint[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildKpiFromDaily(daily: readonly DailyMetrics[]): ReportingKpiData {
  if (daily.length === 0) {
    return {
      spend: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      conversions: 0,
      roas: null,
      leads: 0,
    };
  }

  const spend = daily.reduce((s, m) => s + Number(m.spend), 0);
  const impressions = daily.reduce((s, m) => s + m.impressions, 0);
  const clicks = daily.reduce((s, m) => s + m.clicks, 0);
  const conversions = daily.reduce((s, m) => s + m.conversions, 0);
  const leads = daily.reduce((s, m) => s + m.leads, 0);

  const roasValues = daily.filter((m) => m.roas !== null && m.roas > 0);
  const avgRoas =
    roasValues.length > 0
      ? roasValues.reduce((s, m) => s + (m.roas ?? 0), 0) / roasValues.length
      : null;

  return {
    spend,
    impressions,
    clicks,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    conversions,
    roas: avgRoas,
    leads,
  };
}

// ---------------------------------------------------------------------------
// Public server action: fetch all reporting data for a date range
// ---------------------------------------------------------------------------

/**
 * Fetch a complete reporting snapshot for a client + date range.
 * Called client-side when the date range picker changes.
 */
export async function getReportingSnapshot(
  clientId: string,
  since: string,
  until: string
): Promise<ReportingSnapshot> {
  const [metrics, metaCampaigns, demoResult, placementResult] =
    await Promise.all([
      getClientMetrics(clientId, since, until),
      getMetaCampaignBreakdown(clientId, since, until),
      getDemographicsBreakdown(clientId, since, until),
      getPlacementBreakdown(clientId, since, until),
    ]);

  // Build KPI from daily_metrics
  const kpi = buildKpiFromDaily(metrics.daily);

  // Build campaign rows from Meta API data
  const campaigns: CampaignRow[] = buildCampaignRows(metaCampaigns.data);

  // Build demographics
  const demographics: DemographicDataPoint[] = buildDemographicPoints(
    demoResult.data
  );

  // Build placements
  const placements: PlacementDataPoint[] = buildPlacementPoints(
    placementResult.data
  );

  return {
    kpi,
    daily: metrics.daily,
    campaigns,
    demographics,
    placements,
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
// Public server action: fetch reporting data for a single campaign's ad account
// ---------------------------------------------------------------------------

/**
 * Fetch a complete reporting snapshot using a campaign's ad account ID directly.
 * Called client-side from the campaign detail page when the date range changes.
 */
export async function getCampaignReportingSnapshot(
  clientId: string,
  adAccountId: string,
  since: string,
  until: string
): Promise<ReportingSnapshot> {
  const [metrics, metaCampaigns, demoResult, placementResult] =
    await Promise.all([
      getClientMetrics(clientId, since, until),
      getMetaCampaignBreakdown(clientId, since, until, adAccountId),
      getDemographicsBreakdown(clientId, since, until, adAccountId),
      getPlacementBreakdown(clientId, since, until, adAccountId),
    ]);

  const kpi = buildKpiFromDaily(metrics.daily);
  const campaigns: CampaignRow[] = buildCampaignRows(metaCampaigns.data);
  const demographics: DemographicDataPoint[] = buildDemographicPoints(
    demoResult.data
  );
  const placements: PlacementDataPoint[] = buildPlacementPoints(
    placementResult.data
  );

  return {
    kpi,
    daily: metrics.daily,
    campaigns,
    demographics,
    placements,
  };
}

// ---------------------------------------------------------------------------
// Admin: trigger Meta sync
// ---------------------------------------------------------------------------

export interface SyncStatus {
  readonly success: boolean;
  readonly rowsSynced: number;
  readonly error: string | null;
}

/**
 * Trigger a Meta Ads data sync for a client.
 * Admin-only action.
 */
export async function triggerMetaSync(
  clientId: string,
  since?: string,
  until?: string
): Promise<SyncStatus> {
  return syncClientMetrics(clientId, since, until);
}

/**
 * Trigger a Meta Ads data sync for a specific campaign's ad account.
 * Admin-only action.
 */
export async function triggerCampaignMetaSync(
  clientId: string,
  adAccountId: string,
  since?: string,
  until?: string
): Promise<SyncStatus> {
  return syncClientMetrics(clientId, since, until, adAccountId);
}
