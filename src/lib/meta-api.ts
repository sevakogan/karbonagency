/**
 * Meta Marketing API client.
 * Pulls campaign insights from Meta Ads for client ad accounts.
 *
 * Required env vars:
 *   META_ACCESS_TOKEN  - System User token from Business Manager
 *
 * Usage:
 *   const insights = await fetchAdAccountInsights("act_123456", "2025-01-01", "2025-01-31");
 */

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class MetaApiError extends Error {
  readonly code: number;
  readonly subcode: number | undefined;
  readonly fbTraceId: string | undefined;

  constructor(
    message: string,
    code: number,
    subcode?: number,
    fbTraceId?: string
  ) {
    super(message);
    this.name = "MetaApiError";
    this.code = code;
    this.subcode = subcode;
    this.fbTraceId = fbTraceId;
  }

  get isRateLimited(): boolean {
    return this.code === 32 || this.code === 4;
  }

  get isTokenExpired(): boolean {
    return this.code === 190;
  }

  get isPermissionError(): boolean {
    return this.code === 10 || this.code === 200;
  }
}

// ---------------------------------------------------------------------------
// Response types from Meta Graph API
// ---------------------------------------------------------------------------

interface MetaInsightRow {
  date_start: string;
  date_stop: string;
  spend: string;
  impressions: string;
  reach: string;
  clicks: string;
  ctr: string;
  cpc: string;
  cpm: string;
  actions?: ReadonlyArray<{ action_type: string; value: string }>;
  video_avg_time_watched_actions?: ReadonlyArray<{
    action_type: string;
    value: string;
  }>;
  cost_per_action_type?: ReadonlyArray<{
    action_type: string;
    value: string;
  }>;
  action_values?: ReadonlyArray<{ action_type: string; value: string }>;
}

interface MetaCampaignInsightRow extends MetaInsightRow {
  campaign_id: string;
  campaign_name: string;
}

interface MetaAdSetInsightRow extends MetaInsightRow {
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
}

interface MetaDemographicRow extends MetaInsightRow {
  age: string;
  gender: string;
}

interface MetaPlatformRow extends MetaInsightRow {
  publisher_platform: string;
  platform_position?: string;
}

interface MetaApiErrorResponse {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

interface MetaApiResponse<T> {
  data: T[];
  paging?: { cursors: { after: string }; next?: string };
  error?: MetaApiErrorResponse;
}

interface MetaTokenDebugResponse {
  data: {
    app_id: string;
    type: string;
    is_valid: boolean;
    scopes: string[];
    expires_at: number;
    error?: { message: string; code: number };
  };
}

// ---------------------------------------------------------------------------
// Parsed output types
// ---------------------------------------------------------------------------

export interface ParsedDailyMetric {
  readonly date: string;
  readonly spend: number;
  readonly impressions: number;
  readonly reach: number;
  readonly clicks: number;
  readonly ctr: number;
  readonly cpc: number;
  readonly cpm: number;
  readonly conversions: number;
  readonly cost_per_conversion: number | null;
  readonly roas: number | null;
  readonly video_views: number;
  readonly leads: number;
  readonly link_clicks: number;
}

export interface CampaignInsight extends ParsedDailyMetric {
  readonly campaign_id: string;
  readonly campaign_name: string;
}

export interface AdSetInsight extends ParsedDailyMetric {
  readonly adset_id: string;
  readonly adset_name: string;
  readonly campaign_id: string;
  readonly campaign_name: string;
}

export interface DemographicInsight extends ParsedDailyMetric {
  readonly age: string;
  readonly gender: string;
}

export interface PlatformInsight extends ParsedDailyMetric {
  readonly publisher_platform: string;
  readonly platform_position: string;
}

export interface AccountOverview {
  readonly total_spend: number;
  readonly total_impressions: number;
  readonly total_reach: number;
  readonly total_clicks: number;
  readonly total_conversions: number;
  readonly total_leads: number;
  readonly total_link_clicks: number;
  readonly total_video_views: number;
  readonly avg_ctr: number;
  readonly avg_cpc: number;
  readonly avg_cpm: number;
  readonly roas: number | null;
}

export interface TokenStatus {
  readonly isValid: boolean;
  readonly appId: string;
  readonly type: string;
  readonly scopes: readonly string[];
  readonly expiresAt: number | null;
  readonly error: string | null;
}

export type MetaApiResult<T> = {
  readonly data: T;
  readonly error: null;
} | {
  readonly data: null;
  readonly error: string;
};

// ---------------------------------------------------------------------------
// Rate limiter
// ---------------------------------------------------------------------------

interface RateLimitState {
  readonly requestTimestamps: readonly number[];
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 200;
const RATE_LIMIT_RETRY_DELAY_MS = 5_000;
const MAX_RATE_LIMIT_RETRIES = 3;

let rateLimitState: RateLimitState = { requestTimestamps: [] };

function pruneOldTimestamps(state: RateLimitState, now: number): RateLimitState {
  const cutoff = now - RATE_LIMIT_WINDOW_MS;
  return {
    requestTimestamps: state.requestTimestamps.filter((ts) => ts > cutoff),
  };
}

function recordRequest(state: RateLimitState, now: number): RateLimitState {
  return {
    requestTimestamps: [...state.requestTimestamps, now],
  };
}

async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const pruned = pruneOldTimestamps(rateLimitState, now);
  rateLimitState = pruned;

  if (pruned.requestTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldestInWindow = pruned.requestTimestamps[0];
    const waitTime = oldestInWindow + RATE_LIMIT_WINDOW_MS - now + 100;
    await delay(Math.max(waitTime, 1000));
  }

  rateLimitState = recordRequest(rateLimitState, Date.now());
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAccessToken(): string {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new MetaApiError(
      "META_ACCESS_TOKEN environment variable is not set",
      0
    );
  }
  return token;
}

function extractAction(
  actions: ReadonlyArray<{ action_type: string; value: string }> | undefined,
  actionType: string
): number {
  if (!actions) return 0;
  const match = actions.find((a) => a.action_type === actionType);
  return match ? Number(match.value) : 0;
}

function extractActionValue(
  actionValues:
    | ReadonlyArray<{ action_type: string; value: string }>
    | undefined,
  actionType: string
): number {
  if (!actionValues) return 0;
  const match = actionValues.find((a) => a.action_type === actionType);
  return match ? Number(match.value) : 0;
}

function parseInsightRow(row: MetaInsightRow): ParsedDailyMetric {
  const spend = Number(row.spend);
  const conversions =
    extractAction(row.actions, "offsite_conversion.fb_pixel_purchase") +
    extractAction(row.actions, "offsite_conversion.fb_pixel_lead") +
    extractAction(
      row.actions,
      "offsite_conversion.fb_pixel_complete_registration"
    ) +
    extractAction(row.actions, "offsite_conversion.fb_pixel_schedule");

  const purchaseRevenue = extractActionValue(
    row.action_values,
    "offsite_conversion.fb_pixel_purchase"
  );
  const roas = spend > 0 && purchaseRevenue > 0 ? purchaseRevenue / spend : null;

  return {
    date: row.date_start,
    spend,
    impressions: Number(row.impressions),
    reach: Number(row.reach),
    clicks: Number(row.clicks),
    ctr: Number(row.ctr),
    cpc: Number(row.cpc),
    cpm: Number(row.cpm),
    conversions,
    cost_per_conversion: conversions > 0 ? spend / conversions : null,
    roas,
    video_views: extractAction(row.actions, "video_view"),
    leads: extractAction(row.actions, "lead"),
    link_clicks: extractAction(row.actions, "link_click"),
  };
}

function buildInsightFields(extra: readonly string[] = []): string {
  const base = [
    "spend",
    "impressions",
    "reach",
    "clicks",
    "ctr",
    "cpc",
    "cpm",
    "actions",
    "action_values",
    "cost_per_action_type",
    "video_avg_time_watched_actions",
  ];
  return [...base, ...extra].join(",");
}

function validateDateString(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function validateAdAccountId(id: string): boolean {
  return /^act_\d+$/.test(id);
}

function validateInputs(adAccountId: string, since: string, until: string): void {
  if (!validateAdAccountId(adAccountId)) {
    throw new MetaApiError(
      `Invalid ad account ID format: "${adAccountId}". Expected "act_" prefix followed by digits.`,
      0
    );
  }
  if (!validateDateString(since)) {
    throw new MetaApiError(
      `Invalid "since" date format: "${since}". Expected YYYY-MM-DD.`,
      0
    );
  }
  if (!validateDateString(until)) {
    throw new MetaApiError(
      `Invalid "until" date format: "${until}". Expected YYYY-MM-DD.`,
      0
    );
  }
}

// ---------------------------------------------------------------------------
// Core fetch with pagination, rate limiting, and retries
// ---------------------------------------------------------------------------

async function fetchAllPages<T>(url: string): Promise<T[]> {
  const allRows: T[] = [];
  let nextUrl: string | null = url;
  let retries = 0;

  while (nextUrl) {
    await waitForRateLimit();

    const res = await fetch(nextUrl);
    const json = (await res.json()) as MetaApiResponse<T>;

    if (json.error) {
      const apiError = new MetaApiError(
        json.error.message,
        json.error.code,
        json.error.error_subcode,
        json.error.fbtrace_id
      );

      if (apiError.isRateLimited && retries < MAX_RATE_LIMIT_RETRIES) {
        retries += 1;
        await delay(RATE_LIMIT_RETRY_DELAY_MS * retries);
        continue;
      }

      throw apiError;
    }

    retries = 0;
    allRows.push(...json.data);
    nextUrl = json.paging?.next ?? null;
  }

  return allRows;
}

function buildInsightsUrl(
  adAccountId: string,
  params: Record<string, string>
): string {
  const token = getAccessToken();
  const searchParams = new URLSearchParams({
    ...params,
    access_token: token,
  });
  return `${META_GRAPH_URL}/${adAccountId}/insights?${searchParams}`;
}

// ---------------------------------------------------------------------------
// Public API: Daily account insights
// ---------------------------------------------------------------------------

/**
 * Fetch daily insights for a Meta Ad Account.
 * Returns one ParsedDailyMetric per day in the requested range.
 */
export async function fetchAdAccountInsights(
  adAccountId: string,
  since: string,
  until: string
): Promise<MetaApiResult<ParsedDailyMetric[]>> {
  try {
    validateInputs(adAccountId, since, until);

    const url = buildInsightsUrl(adAccountId, {
      fields: buildInsightFields(),
      time_range: JSON.stringify({ since, until }),
      time_increment: "1",
    });

    const rows = await fetchAllPages<MetaInsightRow>(url);
    const parsed = rows.map(parseInsightRow);
    return { data: parsed, error: null };
  } catch (err) {
    const message =
      err instanceof MetaApiError
        ? `Meta API error (${err.code}): ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown Meta API error";
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// Public API: Account overview (aggregated)
// ---------------------------------------------------------------------------

/**
 * Fetch account-level summary metrics for a date range.
 * Returns totals and averages across the entire account.
 */
export async function fetchAccountOverview(
  adAccountId: string,
  since: string,
  until: string
): Promise<MetaApiResult<AccountOverview>> {
  try {
    validateInputs(adAccountId, since, until);

    const url = buildInsightsUrl(adAccountId, {
      fields: buildInsightFields(),
      time_range: JSON.stringify({ since, until }),
    });

    const rows = await fetchAllPages<MetaInsightRow>(url);

    if (rows.length === 0) {
      return {
        data: {
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
          roas: null,
        },
        error: null,
      };
    }

    const parsed = rows.map(parseInsightRow);
    const totalSpend = parsed.reduce((sum, r) => sum + r.spend, 0);
    const totalImpressions = parsed.reduce(
      (sum, r) => sum + r.impressions,
      0
    );
    const totalClicks = parsed.reduce((sum, r) => sum + r.clicks, 0);
    const totalConversions = parsed.reduce(
      (sum, r) => sum + r.conversions,
      0
    );

    const roasValues = parsed.filter(
      (r) => r.roas !== null && r.roas > 0
    );
    const avgRoas =
      roasValues.length > 0
        ? roasValues.reduce((sum, r) => sum + (r.roas ?? 0), 0) /
          roasValues.length
        : null;

    return {
      data: {
        total_spend: totalSpend,
        total_impressions: totalImpressions,
        total_reach: parsed.reduce((sum, r) => sum + r.reach, 0),
        total_clicks: totalClicks,
        total_conversions: totalConversions,
        total_leads: parsed.reduce((sum, r) => sum + r.leads, 0),
        total_link_clicks: parsed.reduce(
          (sum, r) => sum + r.link_clicks,
          0
        ),
        total_video_views: parsed.reduce(
          (sum, r) => sum + r.video_views,
          0
        ),
        avg_ctr:
          totalImpressions > 0
            ? (totalClicks / totalImpressions) * 100
            : 0,
        avg_cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
        avg_cpm:
          totalImpressions > 0
            ? (totalSpend / totalImpressions) * 1000
            : 0,
        roas: avgRoas,
      },
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof MetaApiError
        ? `Meta API error (${err.code}): ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown Meta API error";
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// Public API: Campaign breakdown
// ---------------------------------------------------------------------------

/**
 * Fetch campaign-level breakdown for a Meta Ad Account.
 * Returns one entry per campaign per day.
 */
export async function fetchCampaignBreakdown(
  adAccountId: string,
  since: string,
  until: string
): Promise<MetaApiResult<CampaignInsight[]>> {
  try {
    validateInputs(adAccountId, since, until);

    const url = buildInsightsUrl(adAccountId, {
      fields: buildInsightFields(["campaign_id", "campaign_name"]),
      time_range: JSON.stringify({ since, until }),
      time_increment: "1",
      level: "campaign",
    });

    const rows = await fetchAllPages<MetaCampaignInsightRow>(url);
    const parsed = rows.map((row) => ({
      ...parseInsightRow(row),
      campaign_id: row.campaign_id,
      campaign_name: row.campaign_name,
    }));

    return { data: parsed, error: null };
  } catch (err) {
    const message =
      err instanceof MetaApiError
        ? `Meta API error (${err.code}): ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown Meta API error";
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// Public API: Single campaign insights
// ---------------------------------------------------------------------------

/**
 * Fetch detailed insights for a single campaign.
 * Returns daily metrics for the specified campaign.
 */
export async function fetchCampaignInsights(
  adAccountId: string,
  campaignId: string,
  since: string,
  until: string
): Promise<MetaApiResult<ParsedDailyMetric[]>> {
  try {
    validateInputs(adAccountId, since, until);

    if (!campaignId || campaignId.trim().length === 0) {
      throw new MetaApiError("Campaign ID is required", 0);
    }

    const token = getAccessToken();
    const searchParams = new URLSearchParams({
      fields: buildInsightFields(),
      time_range: JSON.stringify({ since, until }),
      time_increment: "1",
      access_token: token,
    });

    const url = `${META_GRAPH_URL}/${campaignId}/insights?${searchParams}`;
    const rows = await fetchAllPages<MetaInsightRow>(url);
    const parsed = rows.map(parseInsightRow);

    return { data: parsed, error: null };
  } catch (err) {
    const message =
      err instanceof MetaApiError
        ? `Meta API error (${err.code}): ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown Meta API error";
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// Public API: Ad Set insights
// ---------------------------------------------------------------------------

/**
 * Fetch ad-set-level breakdown for a Meta Ad Account.
 * Returns one entry per ad set per day.
 */
export async function fetchAdSetInsights(
  adAccountId: string,
  since: string,
  until: string
): Promise<MetaApiResult<AdSetInsight[]>> {
  try {
    validateInputs(adAccountId, since, until);

    const url = buildInsightsUrl(adAccountId, {
      fields: buildInsightFields([
        "adset_id",
        "adset_name",
        "campaign_id",
        "campaign_name",
      ]),
      time_range: JSON.stringify({ since, until }),
      time_increment: "1",
      level: "adset",
    });

    const rows = await fetchAllPages<MetaAdSetInsightRow>(url);
    const parsed = rows.map((row) => ({
      ...parseInsightRow(row),
      adset_id: row.adset_id,
      adset_name: row.adset_name,
      campaign_id: row.campaign_id,
      campaign_name: row.campaign_name,
    }));

    return { data: parsed, error: null };
  } catch (err) {
    const message =
      err instanceof MetaApiError
        ? `Meta API error (${err.code}): ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown Meta API error";
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// Public API: Demographics breakdown
// ---------------------------------------------------------------------------

/**
 * Fetch age/gender demographic breakdown for a Meta Ad Account.
 * Returns metrics broken down by age range and gender.
 */
export async function fetchAgeGenderBreakdown(
  adAccountId: string,
  since: string,
  until: string
): Promise<MetaApiResult<DemographicInsight[]>> {
  try {
    validateInputs(adAccountId, since, until);

    const url = buildInsightsUrl(adAccountId, {
      fields: buildInsightFields(),
      time_range: JSON.stringify({ since, until }),
      breakdowns: "age,gender",
    });

    const rows = await fetchAllPages<MetaDemographicRow>(url);
    const parsed = rows.map((row) => ({
      ...parseInsightRow(row),
      age: row.age,
      gender: row.gender,
    }));

    return { data: parsed, error: null };
  } catch (err) {
    const message =
      err instanceof MetaApiError
        ? `Meta API error (${err.code}): ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown Meta API error";
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// Public API: Platform / placement breakdown
// ---------------------------------------------------------------------------

/**
 * Fetch platform placement breakdown for a Meta Ad Account.
 * Returns metrics broken down by publisher platform (Facebook, Instagram, etc.).
 */
export async function fetchPlatformBreakdown(
  adAccountId: string,
  since: string,
  until: string
): Promise<MetaApiResult<PlatformInsight[]>> {
  try {
    validateInputs(adAccountId, since, until);

    const url = buildInsightsUrl(adAccountId, {
      fields: buildInsightFields(),
      time_range: JSON.stringify({ since, until }),
      breakdowns: "publisher_platform,platform_position",
    });

    const rows = await fetchAllPages<MetaPlatformRow>(url);
    const parsed = rows.map((row) => ({
      ...parseInsightRow(row),
      publisher_platform: row.publisher_platform,
      platform_position: row.platform_position ?? "unknown",
    }));

    return { data: parsed, error: null };
  } catch (err) {
    const message =
      err instanceof MetaApiError
        ? `Meta API error (${err.code}): ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown Meta API error";
    return { data: null, error: message };
  }
}

// ---------------------------------------------------------------------------
// Public API: Token validation
// ---------------------------------------------------------------------------

/**
 * Validate the current Meta access token.
 * Returns token status including validity, scopes, and expiration.
 */
export async function validateAccessToken(): Promise<
  MetaApiResult<TokenStatus>
> {
  try {
    const token = getAccessToken();

    await waitForRateLimit();

    const params = new URLSearchParams({
      input_token: token,
      access_token: token,
    });

    const res = await fetch(
      `${META_GRAPH_URL}/debug_token?${params}`
    );
    const json = (await res.json()) as MetaTokenDebugResponse;

    if (json.data.error) {
      return {
        data: {
          isValid: false,
          appId: json.data.app_id ?? "",
          type: json.data.type ?? "",
          scopes: [],
          expiresAt: null,
          error: json.data.error.message,
        },
        error: null,
      };
    }

    return {
      data: {
        isValid: json.data.is_valid,
        appId: json.data.app_id,
        type: json.data.type,
        scopes: json.data.scopes,
        expiresAt:
          json.data.expires_at === 0 ? null : json.data.expires_at,
        error: null,
      },
      error: null,
    };
  } catch (err) {
    const message =
      err instanceof MetaApiError
        ? `Meta API error (${err.code}): ${err.message}`
        : err instanceof Error
          ? err.message
          : "Unknown Meta API error";
    return { data: null, error: message };
  }
}
