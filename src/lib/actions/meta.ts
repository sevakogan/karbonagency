"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  fetchAdAccountInsights,
  fetchAccountOverview,
  fetchCampaignBreakdown,
  fetchAgeGenderBreakdown,
  fetchPlatformBreakdown,
  validateAccessToken,
  type AccountOverview,
  type CampaignInsight,
  type DemographicInsight,
  type PlatformInsight,
  type TokenStatus,
} from "@/lib/meta-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MetaAccountStatus {
  readonly isConnected: boolean;
  readonly adAccountId: string | null;
  readonly tokenStatus: TokenStatus | null;
  readonly error: string | null;
}

interface SyncResult {
  readonly success: boolean;
  readonly rowsSynced: number;
  readonly error: string | null;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function getDefaultDateRange(): { since: string; until: string } {
  const now = new Date();
  const until = now.toISOString().split("T")[0];

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().split("T")[0];

  return { since, until };
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function getCurrentUserProfile(): Promise<{
  userId: string;
  role: string;
  clientId: string | null;
} | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    userId: user.id,
    role: profile.role,
    clientId: profile.client_id,
  };
}

async function getClientAdAccountId(
  clientId: string
): Promise<string | null> {
  const supabase = await createSupabaseServer();
  const { data } = await supabase
    .from("clients")
    .select("meta_ad_account_id")
    .eq("id", clientId)
    .single();

  return data?.meta_ad_account_id ?? null;
}

function canAccessClient(
  profile: { role: string; clientId: string | null },
  targetClientId: string
): boolean {
  if (profile.role === "admin") return true;
  return profile.clientId === targetClientId;
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Trigger a sync of Meta Ads metrics for a single client.
 * Fetches data from Meta API and upserts into daily_metrics table.
 * Only admins can trigger syncs.
 *
 * If `directAdAccountId` is provided, it is used directly instead of
 * looking up the ad account from the clients table.
 */
export async function syncClientMetrics(
  clientId: string,
  since?: string,
  until?: string,
  directAdAccountId?: string
): Promise<SyncResult> {
  if (!isValidUuid(clientId)) {
    return { success: false, rowsSynced: 0, error: "Invalid client ID format" };
  }

  const profile = await getCurrentUserProfile();
  if (!profile || profile.role !== "admin") {
    return { success: false, rowsSynced: 0, error: "Admin access required" };
  }

  const defaults = getDefaultDateRange();
  const effectiveSince =
    since && isValidDateString(since) ? since : defaults.since;
  const effectiveUntil =
    until && isValidDateString(until) ? until : defaults.until;

  const adAccountId = directAdAccountId ?? (await getClientAdAccountId(clientId));
  if (!adAccountId) {
    return {
      success: false,
      rowsSynced: 0,
      error: "No Meta Ad Account configured",
    };
  }

  const { data: insights, error: metaError } = await fetchAdAccountInsights(
    adAccountId,
    effectiveSince,
    effectiveUntil
  );

  if (metaError) {
    return { success: false, rowsSynced: 0, error: metaError };
  }

  if (!insights || insights.length === 0) {
    return { success: true, rowsSynced: 0, error: null };
  }

  const rows = insights.map((day) => ({
    client_id: clientId,
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

  const adminSupabase = getAdminSupabase();
  const { error: insertError } = await adminSupabase
    .from("daily_metrics")
    .upsert(rows, { onConflict: "client_id,date,platform" });

  if (insertError) {
    return {
      success: false,
      rowsSynced: 0,
      error: `Database error: ${insertError.message}`,
    };
  }

  return { success: true, rowsSynced: rows.length, error: null };
}

/**
 * Check if Meta is connected for a client and whether the token is valid.
 * Both admins and the client's own users can check status.
 *
 * If `directAdAccountId` is provided, it is used directly instead of
 * looking up the ad account from the clients table.
 */
export async function getMetaAccountStatus(
  clientId: string,
  directAdAccountId?: string
): Promise<MetaAccountStatus> {
  if (!isValidUuid(clientId)) {
    return {
      isConnected: false,
      adAccountId: null,
      tokenStatus: null,
      error: "Invalid client ID format",
    };
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return {
      isConnected: false,
      adAccountId: null,
      tokenStatus: null,
      error: "Authentication required",
    };
  }

  if (!canAccessClient(profile, clientId)) {
    return {
      isConnected: false,
      adAccountId: null,
      tokenStatus: null,
      error: "Access denied",
    };
  }

  const adAccountId = directAdAccountId ?? (await getClientAdAccountId(clientId));
  if (!adAccountId) {
    return {
      isConnected: false,
      adAccountId: null,
      tokenStatus: null,
      error: null,
    };
  }

  const tokenResult = await validateAccessToken();
  if (tokenResult.error) {
    return {
      isConnected: true,
      adAccountId,
      tokenStatus: null,
      error: tokenResult.error,
    };
  }

  return {
    isConnected: true,
    adAccountId,
    tokenStatus: tokenResult.data,
    error: null,
  };
}

/**
 * Fetch real-time account overview metrics directly from Meta API.
 * Does not read from database -- always returns fresh data.
 *
 * If `directAdAccountId` is provided, it is used directly instead of
 * looking up the ad account from the clients table.
 */
export async function getRealtimeMetrics(
  clientId: string,
  since: string,
  until: string,
  directAdAccountId?: string
): Promise<{ data: AccountOverview | null; error: string | null }> {
  if (!isValidUuid(clientId)) {
    return { data: null, error: "Invalid client ID format" };
  }

  if (!isValidDateString(since) || !isValidDateString(until)) {
    return { data: null, error: "Invalid date format. Expected YYYY-MM-DD." };
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return { data: null, error: "Authentication required" };
  }

  if (!canAccessClient(profile, clientId)) {
    return { data: null, error: "Access denied" };
  }

  const adAccountId = directAdAccountId ?? (await getClientAdAccountId(clientId));
  if (!adAccountId) {
    return { data: null, error: "No Meta Ad Account configured" };
  }

  const result = await fetchAccountOverview(adAccountId, since, until);
  if (result.error) {
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}

/**
 * Fetch real-time campaign-level breakdown directly from Meta API.
 * Returns per-campaign, per-day metrics for the given date range.
 *
 * If `directAdAccountId` is provided, it is used directly instead of
 * looking up the ad account from the clients table.
 */
export async function getCampaignBreakdown(
  clientId: string,
  since: string,
  until: string,
  directAdAccountId?: string
): Promise<{ data: readonly CampaignInsight[] | null; error: string | null }> {
  if (!isValidUuid(clientId)) {
    return { data: null, error: "Invalid client ID format" };
  }

  if (!isValidDateString(since) || !isValidDateString(until)) {
    return { data: null, error: "Invalid date format. Expected YYYY-MM-DD." };
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return { data: null, error: "Authentication required" };
  }

  if (!canAccessClient(profile, clientId)) {
    return { data: null, error: "Access denied" };
  }

  const adAccountId = directAdAccountId ?? (await getClientAdAccountId(clientId));
  if (!adAccountId) {
    return { data: null, error: "No Meta Ad Account configured" };
  }

  const result = await fetchCampaignBreakdown(adAccountId, since, until);
  if (result.error) {
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}

/**
 * Fetch real-time age/gender demographics breakdown from Meta API.
 * Returns metrics segmented by age range and gender.
 *
 * If `directAdAccountId` is provided, it is used directly instead of
 * looking up the ad account from the clients table.
 */
export async function getDemographicsBreakdown(
  clientId: string,
  since: string,
  until: string,
  directAdAccountId?: string
): Promise<{
  data: readonly DemographicInsight[] | null;
  error: string | null;
}> {
  if (!isValidUuid(clientId)) {
    return { data: null, error: "Invalid client ID format" };
  }

  if (!isValidDateString(since) || !isValidDateString(until)) {
    return { data: null, error: "Invalid date format. Expected YYYY-MM-DD." };
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return { data: null, error: "Authentication required" };
  }

  if (!canAccessClient(profile, clientId)) {
    return { data: null, error: "Access denied" };
  }

  const adAccountId = directAdAccountId ?? (await getClientAdAccountId(clientId));
  if (!adAccountId) {
    return { data: null, error: "No Meta Ad Account configured" };
  }

  const result = await fetchAgeGenderBreakdown(adAccountId, since, until);
  if (result.error) {
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}

/**
 * Fetch real-time platform placement breakdown from Meta API.
 * Returns metrics segmented by publisher platform (Facebook, Instagram, etc.).
 *
 * If `directAdAccountId` is provided, it is used directly instead of
 * looking up the ad account from the clients table.
 */
export async function getPlacementBreakdown(
  clientId: string,
  since: string,
  until: string,
  directAdAccountId?: string
): Promise<{
  data: readonly PlatformInsight[] | null;
  error: string | null;
}> {
  if (!isValidUuid(clientId)) {
    return { data: null, error: "Invalid client ID format" };
  }

  if (!isValidDateString(since) || !isValidDateString(until)) {
    return { data: null, error: "Invalid date format. Expected YYYY-MM-DD." };
  }

  const profile = await getCurrentUserProfile();
  if (!profile) {
    return { data: null, error: "Authentication required" };
  }

  if (!canAccessClient(profile, clientId)) {
    return { data: null, error: "Access denied" };
  }

  const adAccountId = directAdAccountId ?? (await getClientAdAccountId(clientId));
  if (!adAccountId) {
    return { data: null, error: "No Meta Ad Account configured" };
  }

  const result = await fetchPlatformBreakdown(adAccountId, since, until);
  if (result.error) {
    return { data: null, error: result.error };
  }

  return { data: result.data, error: null };
}
