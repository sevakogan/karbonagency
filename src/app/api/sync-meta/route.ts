import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { fetchAdAccountInsights, normalizeAdAccountId } from "@/lib/meta-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SyncResult {
  readonly campaign: string;
  readonly campaignId: string;
  readonly clientId: string;
  readonly rows: number;
  readonly error: string | null;
}

interface SyncResponse {
  readonly message: string;
  readonly since: string;
  readonly until: string;
  readonly results: readonly SyncResult[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateString(date: Date): string {
  return date.toISOString().split("T")[0];
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return formatDateString(yesterday);
}

function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function parseDateParams(
  searchParams: URLSearchParams
): { since: string; until: string } {
  const sinceParam = searchParams.get("since");
  const untilParam = searchParams.get("until");

  const yesterday = getYesterdayDateString();
  const since = sinceParam && isValidDateString(sinceParam) ? sinceParam : yesterday;
  const until = untilParam && isValidDateString(untilParam) ? untilParam : yesterday;

  return { since, until };
}

// ---------------------------------------------------------------------------
// Core sync logic (shared by GET and POST)
// ---------------------------------------------------------------------------

/**
 * Sync Meta metrics by iterating over campaigns that have a meta_ad_account_id.
 * Falls back to client-level meta_ad_account_id for backward compatibility
 * with clients that haven't migrated their ad account to campaigns yet.
 */
async function syncMetaMetrics(
  since: string,
  until: string,
  clientId?: string
): Promise<SyncResponse> {
  const supabase = getAdminSupabase();

  // First: query campaigns with meta_ad_account_id
  let campaignQuery = supabase
    .from("campaigns")
    .select("id, name, client_id, meta_ad_account_id")
    .not("meta_ad_account_id", "is", null);

  if (clientId) {
    campaignQuery = campaignQuery.eq("client_id", clientId);
  }

  const { data: campaigns, error: campaignError } = await campaignQuery;

  if (campaignError) {
    return {
      message: `Failed to fetch campaigns: ${campaignError.message}`,
      since,
      until,
      results: [],
    };
  }

  // Collect client IDs that are already covered by campaigns
  const coveredClientIds = new Set(
    (campaigns ?? []).map((c) => c.client_id)
  );

  // Fallback: query clients with meta_ad_account_id that are NOT covered by campaigns
  let clientQuery = supabase
    .from("clients")
    .select("id, name, meta_ad_account_id")
    .eq("is_active", true)
    .not("meta_ad_account_id", "is", null);

  if (clientId) {
    clientQuery = clientQuery.eq("id", clientId);
  }

  const { data: clients } = await clientQuery;

  const fallbackClients = (clients ?? []).filter(
    (c) => !coveredClientIds.has(c.id)
  );

  if (
    (!campaigns || campaigns.length === 0) &&
    fallbackClients.length === 0
  ) {
    return {
      message: clientId
        ? "No campaigns or clients found with Meta Ad Account"
        : "No campaigns or clients with Meta Ad Accounts",
      since,
      until,
      results: [],
    };
  }

  const results: SyncResult[] = [];

  // Sync campaign-level ad accounts
  for (const campaign of campaigns ?? []) {
    const result = await syncSingleCampaign(
      supabase,
      campaign.id,
      campaign.name,
      campaign.client_id,
      campaign.id,
      campaign.meta_ad_account_id,
      since,
      until
    );
    results.push(result);
  }

  // Sync fallback client-level ad accounts (no campaign_id)
  for (const client of fallbackClients) {
    const result = await syncSingleCampaign(
      supabase,
      client.id,
      client.name,
      client.id,
      null,
      client.meta_ad_account_id,
      since,
      until
    );
    results.push(result);
  }

  const successCount = results.filter((r) => r.error === null).length;
  const failCount = results.filter((r) => r.error !== null).length;

  return {
    message: `Sync complete: ${successCount} succeeded, ${failCount} failed`,
    since,
    until,
    results,
  };
}

async function syncSingleCampaign(
  supabase: ReturnType<typeof getAdminSupabase>,
  campaignId: string,
  campaignName: string,
  clientId: string,
  dbCampaignId: string | null,
  metaAdAccountId: string,
  since: string,
  until: string
): Promise<SyncResult> {
  const normalizedId = normalizeAdAccountId(metaAdAccountId);
  const { data: insights, error: metaError } = await fetchAdAccountInsights(
    normalizedId,
    since,
    until
  );

  if (metaError) {
    return {
      campaign: campaignName,
      campaignId,
      clientId,
      rows: 0,
      error: metaError,
    };
  }

  if (!insights || insights.length === 0) {
    return {
      campaign: campaignName,
      campaignId,
      clientId,
      rows: 0,
      error: null,
    };
  }

  const rows = insights.map((day) => ({
    client_id: clientId,
    campaign_id: dbCampaignId,
    date: day.date,
    platform: "meta" as const,
    spend: day.spend,
    impressions: day.impressions,
    reach: day.reach,
    clicks: day.clicks,
    ctr: day.ctr,
    cpc: day.cpc,
    cpm: day.cpm,
    conversions: day.conversions,
    cost_per_conversion: day.cost_per_conversion,
    roas: day.roas,
    video_views: day.video_views,
    leads: day.leads,
    link_clicks: day.link_clicks,
  }));

  // Delete existing rows for this client+campaign+date range, then insert fresh.
  let deleteQuery = supabase
    .from("daily_metrics")
    .delete()
    .eq("client_id", clientId)
    .eq("platform", "meta")
    .gte("date", since)
    .lte("date", until);

  if (dbCampaignId !== null) {
    deleteQuery = deleteQuery.eq("campaign_id", dbCampaignId);
  } else {
    deleteQuery = deleteQuery.is("campaign_id", null);
  }

  await deleteQuery;

  const { error: insertError } = await supabase
    .from("daily_metrics")
    .insert(rows);

  if (insertError) {
    return {
      campaign: campaignName,
      campaignId,
      clientId,
      rows: 0,
      error: `Database error: ${insertError.message}`,
    };
  }

  return {
    campaign: campaignName,
    campaignId,
    clientId,
    rows: rows.length,
    error: null,
  };
}

// ---------------------------------------------------------------------------
// POST /api/sync-meta — Automated sync (CRON_SECRET protected)
// ---------------------------------------------------------------------------

/**
 * POST /api/sync-meta
 *
 * Pulls Meta Ads insights for all clients (or a specific client) and
 * upserts into the daily_metrics table.
 *
 * Body (optional JSON):
 *   - since: string (YYYY-MM-DD, defaults to yesterday)
 *   - until: string (YYYY-MM-DD, defaults to yesterday)
 *   - clientId: string (UUID, sync only this client)
 *
 * Protected by CRON_SECRET header for automated calls.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let bodyParams: {
    since?: string;
    until?: string;
    clientId?: string;
  } = {};

  try {
    const contentType = request.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      bodyParams = await request.json();
    }
  } catch {
    // No body or invalid JSON - use defaults
  }

  const yesterday = getYesterdayDateString();
  const since =
    bodyParams.since && isValidDateString(bodyParams.since)
      ? bodyParams.since
      : yesterday;
  const until =
    bodyParams.until && isValidDateString(bodyParams.until)
      ? bodyParams.until
      : yesterday;

  const clientId = bodyParams.clientId;
  if (clientId && !isValidUuid(clientId)) {
    return NextResponse.json(
      { error: "Invalid clientId format. Expected a UUID." },
      { status: 400 }
    );
  }

  const response = await syncMetaMetrics(since, until, clientId);
  return NextResponse.json(response);
}

// ---------------------------------------------------------------------------
// GET /api/sync-meta — Manual trigger from dashboard
// ---------------------------------------------------------------------------

/**
 * GET /api/sync-meta?since=YYYY-MM-DD&until=YYYY-MM-DD&clientId=UUID
 *
 * Manual sync trigger or Vercel Cron invocation.
 * Accepts either:
 *   - CRON_SECRET via Authorization header (for Vercel Cron)
 *   - Valid Supabase session with admin role (for dashboard trigger)
 * All query params are optional (defaults to yesterday for all clients).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Check if this is a Vercel Cron invocation
  const isCronCall = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isCronCall) {
    // Verify admin session via Supabase
    const supabase = getAdminSupabase();

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }
  }

  const searchParams = request.nextUrl.searchParams;
  const { since, until } = parseDateParams(searchParams);

  const clientIdParam = searchParams.get("clientId");
  if (clientIdParam && !isValidUuid(clientIdParam)) {
    return NextResponse.json(
      { error: "Invalid clientId format. Expected a UUID." },
      { status: 400 }
    );
  }

  const response = await syncMetaMetrics(
    since,
    until,
    clientIdParam ?? undefined
  );
  return NextResponse.json(response);
}
