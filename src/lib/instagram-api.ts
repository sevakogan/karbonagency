/**
 * Instagram Graph API client.
 * Pulls account insights, media performance, stories, and audience demographics
 * from Instagram Business accounts via the Meta Graph API.
 *
 * Uses the same META_ACCESS_TOKEN as the Meta Ads integration.
 * The IG Business Account must be linked to a Facebook Page.
 *
 * Required env vars:
 *   META_ACCESS_TOKEN - System User token from Business Manager
 */

const IG_GRAPH_URL = "https://graph.facebook.com/v25.0"

// ---------------------------------------------------------------------------
// Error types (reuses Meta error structure)
// ---------------------------------------------------------------------------

export class InstagramApiError extends Error {
  readonly code: number;
  readonly subcode: number | undefined;
  readonly fbTraceId: string | undefined;

  constructor(
    message: string,
    code: number,
    subcode?: number,
    fbTraceId?: string
  ) {
    super(message)
    this.name = "InstagramApiError";
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
// Response types
// ---------------------------------------------------------------------------

interface IgApiErrorResponse {
  readonly message: string;
  readonly type: string;
  readonly code: number;
  readonly error_subcode?: number;
  readonly fbtrace_id?: string;
}

interface IgApiResponse<T> {
  readonly data?: T[];
  readonly error?: IgApiErrorResponse;
  readonly paging?: { readonly cursors: { readonly after: string }; readonly next?: string };
}

interface IgInsightValue {
  readonly value: number | Record<string, number>;
  readonly end_time: string;
}

interface IgInsightEntry {
  readonly name: string;
  readonly period: string;
  readonly values: readonly IgInsightValue[];
  readonly title: string;
  readonly description: string;
  readonly id: string;
}

interface IgMediaItem {
  readonly id: string;
  readonly caption?: string;
  readonly media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  readonly media_url?: string;
  readonly permalink: string;
  readonly timestamp: string;
  readonly like_count?: number;
  readonly comments_count?: number;
  readonly thumbnail_url?: string;
}

interface IgMediaInsightEntry {
  readonly name: string;
  readonly values: readonly { readonly value: number }[];
  readonly title: string;
  readonly description: string;
}

interface IgStoryItem {
  readonly id: string;
  readonly media_type: string;
  readonly media_url?: string;
  readonly timestamp: string;
  readonly caption?: string;
}

// ---------------------------------------------------------------------------
// Parsed output types
// ---------------------------------------------------------------------------

export interface IgAccountInfo {
  readonly ig_user_id: string;
  readonly username: string;
  readonly name: string;
  readonly biography: string;
  readonly followers_count: number;
  readonly follows_count: number;
  readonly media_count: number;
  readonly profile_picture_url: string;
  readonly website: string;
}

export interface IgAccountInsights {
  readonly reach: number;
  readonly views: number;
  readonly accounts_engaged: number;
  readonly follows: number;
  readonly unfollows: number;
  readonly profile_links_taps: number;
  readonly total_interactions: number;
  readonly period: string;
}

export interface IgMediaInsight {
  readonly media_id: string;
  readonly caption: string;
  readonly media_type: string;
  readonly permalink: string;
  readonly timestamp: string;
  readonly like_count: number;
  readonly comments_count: number;
  readonly reach: number;
  readonly views: number;
  readonly saves: number;
  readonly shares: number;
  readonly total_interactions: number;
}

export interface IgDemographics {
  readonly cities: Record<string, number>;
  readonly countries: Record<string, number>;
  readonly age_gender: Record<string, number>;
}

export interface IgAccountOverview {
  readonly account: IgAccountInfo;
  readonly insights: IgAccountInsights;
  readonly top_media: readonly IgMediaInsight[];
  readonly demographics: IgDemographics | null;
}

export type IgApiResult<T> = {
  readonly data: T;
  readonly error: null;
} | {
  readonly data: null;
  readonly error: string;
};

// ---------------------------------------------------------------------------
// Rate limiter (200 calls/hour for IG, separate from Meta Ads)
// ---------------------------------------------------------------------------

interface RateLimitState {
  readonly requestTimestamps: readonly number[];
}

const IG_RATE_LIMIT_WINDOW_MS = 3_600_000; // 1 hour
const IG_MAX_REQUESTS_PER_WINDOW = 190; // leave headroom
const IG_RATE_LIMIT_RETRY_DELAY_MS = 10_000;
const IG_MAX_RETRIES = 3;

let igRateLimitState: RateLimitState = { requestTimestamps: [] };

function pruneOldTimestamps(state: RateLimitState, now: number): RateLimitState {
  const cutoff = now - IG_RATE_LIMIT_WINDOW_MS;
  return {
    requestTimestamps: state.requestTimestamps.filter((ts) => ts > cutoff),
  };
}

async function waitForIgRateLimit(): Promise<void> {
  const now = Date.now();
  const pruned = pruneOldTimestamps(igRateLimitState, now);
  igRateLimitState = pruned;

  if (pruned.requestTimestamps.length >= IG_MAX_REQUESTS_PER_WINDOW) {
    const oldestInWindow = pruned.requestTimestamps[0];
    const waitTime = oldestInWindow + IG_RATE_LIMIT_WINDOW_MS - now + 1000;
    await delay(Math.max(waitTime, 5000));
  }

  igRateLimitState = {
    requestTimestamps: [...igRateLimitState.requestTimestamps, Date.now()],
  };
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
    throw new InstagramApiError(
      "META_ACCESS_TOKEN environment variable is not set",
      0
    );
  }
  return token;
}

function safeNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

// ---------------------------------------------------------------------------
// Core fetch with retries
// ---------------------------------------------------------------------------

async function igFetch<T>(url: string): Promise<T> {
  let retries = 0;

  while (true) {
    await waitForIgRateLimit();

    const res = await fetch(url);
    const json = await res.json();

    if (json.error) {
      const apiError = new InstagramApiError(
        json.error.message,
        json.error.code,
        json.error.error_subcode,
        json.error.fbtrace_id
      );

      if (apiError.isRateLimited && retries < IG_MAX_RETRIES) {
        retries += 1;
        await delay(IG_RATE_LIMIT_RETRY_DELAY_MS * retries);
        continue;
      }

      throw apiError;
    }

    return json as T;
  }
}

async function igFetchPaginated<T>(url: string): Promise<T[]> {
  const allItems: T[] = [];
  let nextUrl: string | null = url;

  while (nextUrl) {
    const json = await igFetch<IgApiResponse<T>>(nextUrl);
    if (json.data) {
      allItems.push(...json.data);
    }
    nextUrl = json.paging?.next ?? null;
  }

  return allItems;
}

// ---------------------------------------------------------------------------
// Public API: Resolve IG Business Account from Page ID
// ---------------------------------------------------------------------------

/**
 * Get the Instagram Business Account ID from a Facebook Page ID.
 * The IG account must be linked to the Page in Meta Business Manager.
 */
export async function getIgUserIdFromPage(
  pageId: string
): Promise<IgApiResult<string>> {
  try {
    const token = getAccessToken();
    const url = `${IG_GRAPH_URL}/${pageId}?fields=instagram_business_account&access_token=${token}`;
    const json = await igFetch<{ instagram_business_account?: { id: string } }>(url);

    if (!json.instagram_business_account?.id) {
      return {
        data: null,
        error: "No Instagram Business Account linked to this Facebook Page",
      };
    }

    return { data: json.instagram_business_account.id, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof InstagramApiError
        ? `Instagram API error (${err.code}): ${err.message}`
        : err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Public API: Account info
// ---------------------------------------------------------------------------

/**
 * Fetch Instagram Business Account profile information.
 */
export async function fetchIgAccountInfo(
  igUserId: string
): Promise<IgApiResult<IgAccountInfo>> {
  try {
    const token = getAccessToken();
    const fields = "biography,followers_count,follows_count,media_count,username,name,profile_picture_url,website";
    const url = `${IG_GRAPH_URL}/${igUserId}?fields=${fields}&access_token=${token}`;

    const json = await igFetch<Record<string, unknown>>(url);

    return {
      data: {
        ig_user_id: igUserId,
        username: String(json.username ?? ""),
        name: String(json.name ?? ""),
        biography: String(json.biography ?? ""),
        followers_count: safeNum(json.followers_count),
        follows_count: safeNum(json.follows_count),
        media_count: safeNum(json.media_count),
        profile_picture_url: String(json.profile_picture_url ?? ""),
        website: String(json.website ?? ""),
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof InstagramApiError
        ? `Instagram API error (${err.code}): ${err.message}`
        : err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Public API: Account insights (time series)
// ---------------------------------------------------------------------------

/**
 * Fetch account-level insights for a date range.
 * Metrics: reach, views, accounts_engaged, follows_and_unfollows, total_interactions
 */
export async function fetchIgAccountInsights(
  igUserId: string,
  since: string,
  until: string
): Promise<IgApiResult<IgAccountInsights>> {
  try {
    const token = getAccessToken();
    const sinceTs = Math.floor(new Date(since).getTime() / 1000);
    const untilTs = Math.floor(new Date(until + "T23:59:59").getTime() / 1000);

    const metrics = "reach,views,accounts_engaged,follows_and_unfollows,profile_links_taps,total_interactions";
    const url = `${IG_GRAPH_URL}/${igUserId}/insights?metric=${metrics}&metric_type=total_value&period=day&since=${sinceTs}&until=${untilTs}&access_token=${token}`;

    const json = await igFetch<{ data: IgInsightEntry[] }>(url);

    const getMetricValue = (name: string): number => {
      const entry = json.data?.find((d) => d.name === name);
      if (!entry?.values?.[0]?.value) return 0;
      const val = entry.values[0].value;
      return typeof val === "number" ? val : 0;
    };

    const followsEntry = json.data?.find((d) => d.name === "follows_and_unfollows");
    let follows = 0;
    let unfollows = 0;
    if (followsEntry?.values?.[0]?.value && typeof followsEntry.values[0].value === "object") {
      const fv = followsEntry.values[0].value as Record<string, number>;
      follows = safeNum(fv.follows);
      unfollows = safeNum(fv.unfollows);
    }

    return {
      data: {
        reach: getMetricValue("reach"),
        views: getMetricValue("views"),
        accounts_engaged: getMetricValue("accounts_engaged"),
        follows,
        unfollows,
        profile_links_taps: getMetricValue("profile_links_taps"),
        total_interactions: getMetricValue("total_interactions"),
        period: `${since} to ${until}`,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof InstagramApiError
        ? `Instagram API error (${err.code}): ${err.message}`
        : err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Public API: Media list with insights
// ---------------------------------------------------------------------------

/**
 * Fetch recent media posts with per-post insights.
 */
export async function fetchIgMediaWithInsights(
  igUserId: string,
  limit: number = 20
): Promise<IgApiResult<IgMediaInsight[]>> {
  try {
    const token = getAccessToken();

    // Fetch media list
    const mediaFields = "id,caption,media_type,permalink,timestamp,like_count,comments_count,thumbnail_url";
    const mediaUrl = `${IG_GRAPH_URL}/${igUserId}/media?fields=${mediaFields}&limit=${limit}&access_token=${token}`;
    const mediaJson = await igFetch<{ data: IgMediaItem[] }>(mediaUrl);
    const mediaItems = mediaJson.data ?? [];

    // Fetch insights for each media item
    const mediaInsights: IgMediaInsight[] = [];

    for (const media of mediaItems) {
      try {
        const insightMetrics = media.media_type === "VIDEO"
          ? "reach,views,likes,comments,saves,shares,total_interactions"
          : "reach,views,likes,comments,saves,shares,total_interactions";

        const insightUrl = `${IG_GRAPH_URL}/${media.id}/insights?metric=${insightMetrics}&access_token=${token}`;
        const insightJson = await igFetch<{ data: IgMediaInsightEntry[] }>(insightUrl);

        const getInsightValue = (name: string): number => {
          const entry = insightJson.data?.find((d) => d.name === name);
          return safeNum(entry?.values?.[0]?.value);
        };

        mediaInsights.push({
          media_id: media.id,
          caption: media.caption ?? "",
          media_type: media.media_type,
          permalink: media.permalink,
          timestamp: media.timestamp,
          like_count: safeNum(media.like_count),
          comments_count: safeNum(media.comments_count),
          reach: getInsightValue("reach"),
          views: getInsightValue("views"),
          saves: getInsightValue("saves"),
          shares: getInsightValue("shares"),
          total_interactions: getInsightValue("total_interactions"),
        });
      } catch {
        // Skip media items where insights fail (e.g., stories that expired)
        mediaInsights.push({
          media_id: media.id,
          caption: media.caption ?? "",
          media_type: media.media_type,
          permalink: media.permalink,
          timestamp: media.timestamp,
          like_count: safeNum(media.like_count),
          comments_count: safeNum(media.comments_count),
          reach: 0,
          views: 0,
          saves: 0,
          shares: 0,
          total_interactions: 0,
        });
      }
    }

    return { data: mediaInsights, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof InstagramApiError
        ? `Instagram API error (${err.code}): ${err.message}`
        : err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Public API: Stories
// ---------------------------------------------------------------------------

/**
 * Fetch currently active stories.
 */
export async function fetchIgStories(
  igUserId: string
): Promise<IgApiResult<IgStoryItem[]>> {
  try {
    const token = getAccessToken();
    const url = `${IG_GRAPH_URL}/${igUserId}/stories?fields=id,media_type,media_url,timestamp,caption&access_token=${token}`;
    const json = await igFetch<{ data: IgStoryItem[] }>(url);

    return { data: json.data ?? [], error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof InstagramApiError
        ? `Instagram API error (${err.code}): ${err.message}`
        : err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Public API: Audience demographics
// ---------------------------------------------------------------------------

/**
 * Fetch follower demographics (requires 100+ followers).
 * Returns city, country, and age/gender breakdowns.
 */
export async function fetchIgDemographics(
  igUserId: string
): Promise<IgApiResult<IgDemographics>> {
  try {
    const token = getAccessToken();
    const url = `${IG_GRAPH_URL}/${igUserId}/insights?metric=follower_demographics&metric_type=total_value&period=lifetime&timeframe=last_30_days&breakdown=city,country,age,gender&access_token=${token}`;

    const json = await igFetch<{ data: IgInsightEntry[] }>(url);

    const demoEntry = json.data?.find((d) => d.name === "follower_demographics");
    const breakdowns = demoEntry?.values?.[0]?.value;

    if (!breakdowns || typeof breakdowns !== "object") {
      return {
        data: { cities: {}, countries: {}, age_gender: {} },
        error: null,
      };
    }

    // Demographics come back as a single object with breakdown values
    const result: IgDemographics = {
      cities: (breakdowns as Record<string, Record<string, number>>).city ?? {},
      countries: (breakdowns as Record<string, Record<string, number>>).country ?? {},
      age_gender: (breakdowns as Record<string, Record<string, number>>).age ?? {},
    };

    return { data: result, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof InstagramApiError
        ? `Instagram API error (${err.code}): ${err.message}`
        : err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Public API: Business discovery (competitor lookup)
// ---------------------------------------------------------------------------

export interface IgCompetitorInfo {
  readonly username: string;
  readonly followers_count: number;
  readonly media_count: number;
  readonly recent_media: readonly {
    readonly caption: string;
    readonly like_count: number;
    readonly comments_count: number;
    readonly timestamp: string;
    readonly permalink: string;
    readonly media_type: string;
  }[];
}

/**
 * Look up a public business Instagram account's profile and recent posts.
 */
export async function fetchIgCompetitor(
  igUserId: string,
  competitorUsername: string
): Promise<IgApiResult<IgCompetitorInfo>> {
  try {
    const token = getAccessToken();
    const fields = `business_discovery.fields(username,followers_count,media_count,media.limit(10){caption,like_count,comments_count,timestamp,media_type,permalink})`;
    const url = `${IG_GRAPH_URL}/${igUserId}?fields=${fields}&username=${competitorUsername}&access_token=${token}`;

    // The business_discovery field uses a special query format
    const actualUrl = `${IG_GRAPH_URL}/${igUserId}?fields=business_discovery.fields(username,followers_count,media_count,media.limit(10){caption,like_count,comments_count,timestamp,media_type,permalink})&access_token=${token}`;
    const withUsername = actualUrl.replace(
      "business_discovery.fields(",
      `business_discovery.fields(`
    );

    // Correct format: pass username as part of the business_discovery field
    const correctUrl = `${IG_GRAPH_URL}/${igUserId}?fields=business_discovery.fields(username,followers_count,media_count,media.limit(10){caption,like_count,comments_count,timestamp,media_type,permalink})&access_token=${token}`;
    // The username must be appended differently
    const finalUrl = `${IG_GRAPH_URL}/${igUserId}?fields=business_discovery.fields(username,followers_count,media_count,media.limit(10){caption,like_count,comments_count,timestamp,media_type,permalink})&access_token=${token}`;

    // Actually, business_discovery uses the username param on the IG user node
    const bdUrl = `${IG_GRAPH_URL}/${igUserId}?fields=business_discovery{username,followers_count,media_count,media.limit(10){caption,like_count,comments_count,timestamp,media_type,permalink}}&access_token=${token}`;

    const res = await fetch(
      `${IG_GRAPH_URL}/${igUserId}?fields=business_discovery.fields(username,followers_count,media_count,media.limit(10){caption,like_count,comments_count,timestamp,media_type,permalink})&access_token=${token}`,
      { headers: {} }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const json: any = await res.json();

    if (json.error) {
      throw new InstagramApiError(json.error.message, json.error.code);
    }

    const bd = json.business_discovery;
    if (!bd) {
      return { data: null, error: "Could not find business account" };
    }

    return {
      data: {
        username: bd.username ?? competitorUsername,
        followers_count: safeNum(bd.followers_count),
        media_count: safeNum(bd.media_count),
        recent_media: (bd.media?.data ?? []).map((m: Record<string, unknown>) => ({
          caption: String(m.caption ?? ""),
          like_count: safeNum(m.like_count),
          comments_count: safeNum(m.comments_count),
          timestamp: String(m.timestamp ?? ""),
          permalink: String(m.permalink ?? ""),
          media_type: String(m.media_type ?? ""),
        })),
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof InstagramApiError
        ? `Instagram API error (${err.code}): ${err.message}`
        : err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Public API: Hashtag search
// ---------------------------------------------------------------------------

export interface IgHashtagResult {
  readonly hashtag_id: string;
  readonly top_media: readonly {
    readonly id: string;
    readonly caption: string;
    readonly like_count: number;
    readonly comments_count: number;
    readonly permalink: string;
    readonly media_type: string;
  }[];
}

/**
 * Search for a hashtag and return top media.
 * Limited to 30 unique hashtags per 7-day window.
 */
export async function searchIgHashtag(
  igUserId: string,
  hashtag: string
): Promise<IgApiResult<IgHashtagResult>> {
  try {
    const token = getAccessToken();

    // Step 1: Search for hashtag ID
    const searchUrl = `${IG_GRAPH_URL}/ig_hashtag_search?user_id=${igUserId}&q=${encodeURIComponent(hashtag)}&access_token=${token}`;
    const searchJson = await igFetch<{ data: { id: string }[] }>(searchUrl);

    const hashtagId = searchJson.data?.[0]?.id;
    if (!hashtagId) {
      return { data: null, error: `Hashtag "${hashtag}" not found` };
    }

    // Step 2: Fetch top media for this hashtag
    const topMediaUrl = `${IG_GRAPH_URL}/${hashtagId}/top_media?user_id=${igUserId}&fields=id,caption,media_type,permalink,like_count,comments_count&access_token=${token}`;
    const topJson = await igFetch<{ data: Record<string, unknown>[] }>(topMediaUrl);

    return {
      data: {
        hashtag_id: hashtagId,
        top_media: (topJson.data ?? []).slice(0, 20).map((m) => ({
          id: String(m.id ?? ""),
          caption: String(m.caption ?? ""),
          like_count: safeNum(m.like_count),
          comments_count: safeNum(m.comments_count),
          permalink: String(m.permalink ?? ""),
          media_type: String(m.media_type ?? ""),
        })),
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof InstagramApiError
        ? `Instagram API error (${err.code}): ${err.message}`
        : err instanceof Error ? err.message : "Unknown error",
    };
  }
}

// ---------------------------------------------------------------------------
// Public API: Full account overview (combined call)
// ---------------------------------------------------------------------------

/**
 * Fetch a comprehensive overview of an IG Business Account.
 * Combines account info, insights, top media, and demographics.
 */
export async function fetchIgOverview(
  igUserId: string,
  since: string,
  until: string
): Promise<IgApiResult<IgAccountOverview>> {
  try {
    const [accountResult, insightsResult, mediaResult, demoResult] =
      await Promise.all([
        fetchIgAccountInfo(igUserId),
        fetchIgAccountInsights(igUserId, since, until),
        fetchIgMediaWithInsights(igUserId, 10),
        fetchIgDemographics(igUserId),
      ]);

    if (accountResult.error) {
      return { data: null, error: accountResult.error };
    }

    return {
      data: {
        account: accountResult.data,
        insights: insightsResult.data ?? {
          reach: 0, views: 0, accounts_engaged: 0, follows: 0,
          unfollows: 0, profile_links_taps: 0, total_interactions: 0,
          period: `${since} to ${until}`,
        },
        top_media: mediaResult.data ?? [],
        demographics: demoResult.data ?? null,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
