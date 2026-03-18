/**
 * /api/meta/insights
 *
 * GET — Campaign-level insights from Meta Ads Insights API.
 *   Returns spend, impressions, clicks, CTR, CPC, CPM, reach,
 *   frequency, conversions, and CPA per campaign.
 *
 * Query params:
 *   client_id  — client UUID (optional, admin fallback picks first client)
 *   date_preset — last_7d | last_14d | last_30d | last_90d (default: last_30d)
 *   campaign_id — (optional) single campaign ID for per-campaign deep dive
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

const META_GRAPH_URL = "https://graph.facebook.com/v25.0";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Auth (same pattern as other routes)
// ---------------------------------------------------------------------------

async function getAdAccountAndToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Authorization required" }, { status: 401 }), adAccountId: null, accessToken: null };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdminSupabase();

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { error: NextResponse.json({ error: "Invalid session" }, { status: 401 }), adAccountId: null, accessToken: null };
  }

  const url = new URL(request.url);
  const clientIdParam = url.searchParams.get("client_id");
  const { data: profile } = await supabase.from("profiles").select("client_id, role").eq("id", user.id).single();

  let clientId = clientIdParam ?? profile?.client_id ?? null;
  if (!clientId) {
    const { data: first } = await supabase.from("clients").select("id").not("meta_ad_account_id", "is", null).limit(1).single();
    clientId = first?.id ?? null;
  }
  if (!clientId) return { error: NextResponse.json({ error: "No client" }, { status: 400 }), adAccountId: null, accessToken: null };

  const { data: client } = await supabase.from("clients").select("meta_ad_account_id, meta_access_token").eq("id", clientId).single();
  if (!client?.meta_ad_account_id) return { error: NextResponse.json({ error: "No Meta Ad Account" }, { status: 404 }), adAccountId: null, accessToken: null };

  const accessToken = client.meta_access_token ?? process.env.META_ACCESS_TOKEN ?? "";
  return { error: null, adAccountId: client.meta_ad_account_id as string, accessToken };
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MetaInsightAction {
  action_type: string;
  value: string;
}

interface MetaInsightRow {
  campaign_id?: string;
  campaign_name?: string;
  adset_id?: string;
  adset_name?: string;
  spend?: string;
  impressions?: string;
  clicks?: string;
  reach?: string;
  frequency?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  cpp?: string;
  actions?: MetaInsightAction[];
  cost_per_action_type?: MetaInsightAction[];
  video_p25_watched_actions?: MetaInsightAction[];
  video_p75_watched_actions?: MetaInsightAction[];
  video_p100_watched_actions?: MetaInsightAction[];
  date_start?: string;
  date_stop?: string;
}

// ---------------------------------------------------------------------------
// Helper: extract conversion count from actions array
// ---------------------------------------------------------------------------

function extractConversions(actions?: MetaInsightAction[]): number {
  if (!actions) return 0;
  const conversionTypes = ["offsite_conversion.fb_pixel_purchase", "purchase", "omni_purchase",
    "offsite_conversion.fb_pixel_lead", "lead", "contact", "complete_registration",
    "offsite_conversion.fb_pixel_complete_registration"];
  let total = 0;
  for (const a of actions) {
    if (conversionTypes.some((t) => a.action_type.includes(t))) {
      total += parseFloat(a.value) || 0;
    }
  }
  // Fallback: any website conversion
  if (total === 0) {
    for (const a of actions) {
      if (a.action_type.includes("offsite_conversion") || a.action_type === "website_purchase") {
        total += parseFloat(a.value) || 0;
      }
    }
  }
  return total;
}

function extractCPA(costPerAction?: MetaInsightAction[]): number {
  if (!costPerAction) return 0;
  const conversionTypes = ["offsite_conversion.fb_pixel_purchase", "purchase", "omni_purchase",
    "offsite_conversion.fb_pixel_lead", "lead"];
  for (const a of costPerAction) {
    if (conversionTypes.some((t) => a.action_type.includes(t))) {
      return parseFloat(a.value) || 0;
    }
  }
  return 0;
}

// ---------------------------------------------------------------------------
// Performance score (0–100)
// ---------------------------------------------------------------------------

function computePerformanceScore(row: {
  spend: number; conversions: number; cpa: number;
  ctr: number; cpc: number; cpm: number;
}): number {
  let score = 50; // baseline
  if (row.ctr > 2) score += 15;
  else if (row.ctr > 1) score += 8;
  else if (row.ctr < 0.5) score -= 10;

  if (row.conversions > 0 && row.spend > 0) {
    // CPA quality: lower is better; normalize against $20 target
    const cpaNorm = Math.max(0, 1 - (row.cpa / 20));
    score += cpaNorm * 25;
  }

  if (row.cpc < 0.8) score += 10;
  else if (row.cpc > 3) score -= 10;

  return Math.min(100, Math.max(0, Math.round(score)));
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { error, adAccountId, accessToken } = await getAdAccountAndToken(request);
  if (error) return error;

  const url = new URL(request.url);
  const datePreset = url.searchParams.get("date_preset") ?? "last_30d";
  const since = url.searchParams.get("since") ?? null;
  const until = url.searchParams.get("until") ?? null;
  const campaignId = url.searchParams.get("campaign_id") ?? null;

  // Map date preset to Meta API format
  // Meta API uses its own preset format — pass through directly
  const VALID_PRESETS = new Set([
    "today","yesterday","last_3d","last_7d","last_14d","last_28d",
    "last_30d","last_90d","last_month","last_quarter","last_year",
    "this_month","this_quarter","this_year","lifetime",
  ]);
  const metaPreset = VALID_PRESETS.has(datePreset) ? datePreset : "last_30d";

  // For custom date range, build time_range param instead of date_preset
  const isCustom = datePreset === "custom" && since && until;
  const dateParam = isCustom
    ? `&time_range=${encodeURIComponent(JSON.stringify({ since, until }))}`
    : `&date_preset=${metaPreset}`;

  const accountId = adAccountId!.replace(/^act_/, "");
  const baseFields = "campaign_id,campaign_name,spend,impressions,clicks,reach,ctr,cpc,cpm,cpp,frequency,actions,cost_per_action_type";

  try {
    let insightsUrl: string;

    if (campaignId) {
      // Single campaign deep-dive with adset breakdown
      insightsUrl =
        `${META_GRAPH_URL}/${campaignId}/insights` +
        `?fields=${baseFields},adset_id,adset_name` +
        dateParam +
        `&level=adset` +
        `&limit=100` +
        `&access_token=${encodeURIComponent(accessToken!)}`;
    } else {
      // All campaigns overview
      insightsUrl =
        `${META_GRAPH_URL}/act_${accountId}/insights` +
        `?fields=${baseFields}` +
        dateParam +
        `&level=campaign` +
        `&limit=100` +
        `&access_token=${encodeURIComponent(accessToken!)}`;
    }

    const res = await fetch(insightsUrl);
    const json = await res.json() as { data?: MetaInsightRow[]; error?: { message: string } };

    if (!res.ok || json.error) {
      return NextResponse.json({
        data: [],
        error: json.error?.message ?? `Meta API error ${res.status}`,
        note: "Could not fetch insights. Ensure the access token has ads_read permission.",
      });
    }

    const rows = json.data ?? [];

    const enriched = rows.map((row) => {
      const spend = parseFloat(row.spend ?? "0");
      const impressions = parseInt(row.impressions ?? "0", 10);
      const clicks = parseInt(row.clicks ?? "0", 10);
      const reach = parseInt(row.reach ?? "0", 10);
      const ctr = parseFloat(row.ctr ?? "0");
      const cpc = parseFloat(row.cpc ?? "0");
      const cpm = parseFloat(row.cpm ?? "0");
      const frequency = parseFloat(row.frequency ?? "0");
      const conversions = extractConversions(row.actions);
      const cpa = extractCPA(row.cost_per_action_type);
      const roas = conversions > 0 && spend > 0 ? (conversions * 60) / spend : 0; // est. $60 avg order

      return {
        campaign_id: row.campaign_id ?? "",
        campaign_name: row.campaign_name ?? "",
        adset_id: row.adset_id ?? null,
        adset_name: row.adset_name ?? null,
        spend,
        impressions,
        clicks,
        reach,
        ctr,
        cpc,
        cpm,
        frequency,
        conversions,
        cpa,
        roas,
        performance_score: computePerformanceScore({ spend, conversions, cpa, ctr, cpc, cpm }),
        date_start: row.date_start,
        date_stop: row.date_stop,
      };
    });

    // Sort by spend descending
    enriched.sort((a, b) => b.spend - a.spend);

    return NextResponse.json({ data: enriched, date_preset: metaPreset });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
