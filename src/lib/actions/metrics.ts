"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import type { DailyMetrics } from "@/types";

interface MetricsSummary {
  total_spend: number;
  total_impressions: number;
  total_reach: number;
  total_clicks: number;
  total_conversions: number;
  total_leads: number;
  total_link_clicks: number;
  total_video_views: number;
  avg_ctr: number;
  avg_cpc: number;
  avg_cpm: number;
  avg_cost_per_conversion: number | null;
  avg_roas: number | null;
  daily: DailyMetrics[];
}

const EMPTY_SUMMARY: MetricsSummary = {
  total_spend: 0,
  total_impressions: 0,
  total_reach: 0,
  total_clicks: 0,
  total_conversions: 0,
  total_leads: 0,
  total_link_clicks: 0,
  total_video_views: 0,
  avg_ctr: 0,
  avg_cpc: 0,
  avg_cpm: 0,
  avg_cost_per_conversion: null,
  avg_roas: null,
  daily: [],
};

/**
 * Fetch aggregated metrics for a client over a date range.
 * RLS ensures clients only see their own data.
 */
export async function getClientMetrics(
  clientId: string,
  since?: string,
  until?: string
): Promise<MetricsSummary> {
  const supabase = await createSupabaseServer();

  let query = supabase
    .from("daily_metrics")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: true });

  if (since) query = query.gte("date", since);
  if (until) query = query.lte("date", until);

  const { data, error } = await query;

  if (error || !data || data.length === 0) {
    if (error) console.error("Failed to fetch daily metrics:", error.message);
    return EMPTY_SUMMARY;
  }

  const metrics = data as DailyMetrics[];

  const totalSpend = metrics.reduce((s, m) => s + Number(m.spend), 0);
  const totalImpressions = metrics.reduce((s, m) => s + m.impressions, 0);
  const totalReach = metrics.reduce((s, m) => s + m.reach, 0);
  const totalClicks = metrics.reduce((s, m) => s + m.clicks, 0);
  const totalConversions = metrics.reduce((s, m) => s + m.conversions, 0);
  const totalLeads = metrics.reduce((s, m) => s + m.leads, 0);
  const totalLinkClicks = metrics.reduce((s, m) => s + m.link_clicks, 0);
  const totalVideoViews = metrics.reduce((s, m) => s + m.video_views, 0);

  const roasValues = metrics.filter((m) => m.roas !== null && m.roas > 0);
  const avgRoas =
    roasValues.length > 0
      ? roasValues.reduce((s, m) => s + (m.roas ?? 0), 0) / roasValues.length
      : null;

  return {
    total_spend: totalSpend,
    total_impressions: totalImpressions,
    total_reach: totalReach,
    total_clicks: totalClicks,
    total_conversions: totalConversions,
    total_leads: totalLeads,
    total_link_clicks: totalLinkClicks,
    total_video_views: totalVideoViews,
    avg_ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
    avg_cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
    avg_cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
    avg_cost_per_conversion: totalConversions > 0 ? totalSpend / totalConversions : null,
    avg_roas: avgRoas,
    daily: metrics,
  };
}
