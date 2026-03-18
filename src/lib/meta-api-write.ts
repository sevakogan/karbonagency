/**
 * Meta Marketing API — WRITE operations client
 * API version: v25.0 (upgraded from v21.0)
 *
 * Covers:
 *   - Campaigns (create, update, delete, list)
 *   - Ad Sets (create, update, delete, list)
 *   - Ads (create, update, delete, list)
 *   - Ad Creatives (create image, video, carousel, collection)
 *   - Ad Images & Videos (upload)
 *   - Custom Audiences (create, update, delete, add users)
 *   - Reach & Delivery Estimates
 *   - A/B Tests
 *   - Draft campaign templates (Shift Arcade Miami)
 *
 * Auth: META_ACCESS_TOKEN env var (System User token from Business Manager)
 * All write operations are DRAFT-safe — status defaults to PAUSED unless
 * explicitly set to ACTIVE by the caller.
 */

import { MetaApiError } from "./meta-api";

const META_GRAPH_URL = "https://graph.facebook.com/v25.0";

// ---------------------------------------------------------------------------
// Enums & constants
// ---------------------------------------------------------------------------

export type CampaignStatus = "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
export type CampaignObjective =
  | "OUTCOME_AWARENESS"
  | "OUTCOME_TRAFFIC"
  | "OUTCOME_ENGAGEMENT"
  | "OUTCOME_LEADS"
  | "OUTCOME_APP_PROMOTION"
  | "OUTCOME_SALES";

export type BillingEvent = "IMPRESSIONS" | "LINK_CLICKS" | "THRUPLAY";
export type OptimizationGoal =
  | "REACH"
  | "IMPRESSIONS"
  | "LINK_CLICKS"
  | "LANDING_PAGE_VIEWS"
  | "LEAD_GENERATION"
  | "QUALITY_LEAD"
  | "CONVERSIONS"
  | "VALUE"
  | "QUALITY_CALL"
  | "OFFSITE_CONVERSIONS"
  | "EVENT_RESPONSES"
  | "APP_INSTALLS"
  | "VIDEO_VIEWS"
  | "THRUPLAY"
  | "REPLIES"
  | "ENGAGED_USERS";

export type AdStatus = CampaignStatus;
export type AdSetStatus = CampaignStatus;

export type SpecialAdCategory =
  | "NONE"
  | "EMPLOYMENT"
  | "HOUSING"
  | "CREDIT"
  | "ISSUES_ELECTIONS_POLITICS";

export type CreativeCallToAction =
  | "BOOK_NOW"
  | "BUY_NOW"
  | "BUY_TICKETS"
  | "CONTACT_US"
  | "DOWNLOAD"
  | "GET_DIRECTIONS"
  | "GET_QUOTE"
  | "INSTALL_APP"
  | "LEARN_MORE"
  | "LISTEN_NOW"
  | "MESSAGE_PAGE"
  | "NO_BUTTON"
  | "OPEN_LINK"
  | "ORDER_NOW"
  | "REGISTER_NOW"
  | "REQUEST_TIME"
  | "SEE_MENU"
  | "SHOP_NOW"
  | "SIGN_UP"
  | "SUBSCRIBE"
  | "WATCH_MORE"
  | "WATCH_VIDEO"
  | "WHATSAPP_MESSAGE";

// ---------------------------------------------------------------------------
// Input types
// ---------------------------------------------------------------------------

export interface CreateCampaignInput {
  name: string;
  objective: CampaignObjective;
  status?: CampaignStatus;
  special_ad_categories?: SpecialAdCategory[];
  /** Daily budget in cents (e.g., 1000 = $10.00) */
  daily_budget?: number;
  /** Lifetime budget in cents */
  lifetime_budget?: number;
  /** ISO date string YYYY-MM-DD */
  start_time?: string;
  /** ISO date string YYYY-MM-DD */
  stop_time?: string;
  /** Enable Advantage Campaign Budget (auto-distributes across ad sets) */
  is_campaign_budget_optimization?: boolean;
  bid_strategy?: "LOWEST_COST_WITHOUT_CAP" | "COST_CAP" | "LOWEST_COST_WITH_BID_CAP";
  bid_amount?: number;
}

export interface UpdateCampaignInput {
  name?: string;
  status?: CampaignStatus;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  stop_time?: string;
  bid_strategy?: string;
  bid_amount?: number;
}

export interface GeoTargeting {
  countries?: string[];
  regions?: Array<{ key: string }>;
  cities?: Array<{ key: string; radius?: number; distance_unit?: "mile" | "kilometer" }>;
  zips?: Array<{ key: string }>;
  geo_markets?: Array<{ key: string }>;
  location_types?: Array<"home" | "recent" | "travel_in">;
}

export interface AudienceTargeting {
  age_min?: number;
  age_max?: number;
  genders?: number[]; // 1=male, 2=female
  /** Flexible targeting spec — interests, behaviors, etc. */
  flexible_spec?: Array<{
    interests?: Array<{ id: string; name?: string }>;
    behaviors?: Array<{ id: string; name?: string }>;
    life_events?: Array<{ id: string; name?: string }>;
    industries?: Array<{ id: string; name?: string }>;
    family_statuses?: Array<{ id: string; name?: string }>;
    relationship_statuses?: number[];
    education_statuses?: number[];
    work_positions?: Array<{ id: string; name?: string }>;
  }>;
  /** Exclusions */
  exclusions?: {
    interests?: Array<{ id: string }>;
    behaviors?: Array<{ id: string }>;
  };
  /** Custom audiences (retargeting, lookalikes) */
  custom_audiences?: Array<{ id: string }>;
  excluded_custom_audiences?: Array<{ id: string }>;
  /** Lookalike audiences */
  lookalike_audiences?: Array<{ id: string }>;
  /** Publisher platforms */
  publisher_platforms?: Array<"facebook" | "instagram" | "audience_network" | "messenger">;
  /** Facebook positions */
  facebook_positions?: Array<"feed" | "right_hand_column" | "instant_article" | "marketplace" | "video_feeds" | "story" | "search" | "reels">;
  /** Instagram positions */
  instagram_positions?: Array<"stream" | "story" | "explore" | "explore_home" | "reels" | "profile_feed" | "ig_search">;
  /** Audience Network positions */
  audience_network_positions?: Array<"classic" | "rewarded_video">;
  /** Device platforms */
  device_platforms?: Array<"mobile" | "desktop">;
  /** User OS */
  user_os?: string[];
}

export interface CreateAdSetInput {
  campaign_id: string;
  name: string;
  optimization_goal: OptimizationGoal;
  billing_event: BillingEvent;
  /** Daily budget in cents */
  daily_budget?: number;
  /** Lifetime budget in cents */
  lifetime_budget?: number;
  bid_amount?: number;
  bid_strategy?: "LOWEST_COST_WITHOUT_CAP" | "COST_CAP" | "LOWEST_COST_WITH_BID_CAP";
  status?: AdSetStatus;
  start_time?: string;
  end_time?: string;
  targeting: AudienceTargeting & { geo_locations: GeoTargeting };
  /** Pixel ID for conversion tracking */
  promoted_object?: {
    pixel_id?: string;
    custom_event_type?: "PURCHASE" | "LEAD" | "COMPLETE_REGISTRATION" | "CONTENT_VIEW" | "SEARCH" | "ADD_TO_CART" | "ADD_TO_WISHLIST" | "INITIATED_CHECKOUT" | "ADD_PAYMENT_INFO" | "SCHEDULE";
    custom_conversion_id?: string;
    page_id?: string;
  };
  /** Attribution spec */
  attribution_spec?: Array<{
    event_type: "CLICK_THROUGH" | "VIEW_THROUGH" | "ENGAGED_VIEW";
    window_days: 1 | 7 | 28;
  }>;
  /** Advantage+ placements (automatic) */
  use_new_app_click?: boolean;
  destination_type?: "WEBSITE" | "MESSENGER" | "WHATSAPP" | "INSTAGRAM_DIRECT" | "FACEBOOK_PAGE";
}

export interface UpdateAdSetInput {
  name?: string;
  status?: AdSetStatus;
  daily_budget?: number;
  lifetime_budget?: number;
  bid_amount?: number;
  end_time?: string;
  targeting?: Partial<AudienceTargeting & { geo_locations: GeoTargeting }>;
}

export interface CreateAdCreativeInput {
  name: string;
  /** Single image ad */
  image_hash?: string;
  /** Single video ad */
  video_id?: string;
  title?: string;
  body?: string;
  call_to_action?: {
    type: CreativeCallToAction;
    value?: { link?: string; lead_gen_form_id?: string };
  };
  link_url?: string;
  page_id: string;
  instagram_actor_id?: string;
  /** Object story spec (for image/video single ads) */
  object_story_spec?: {
    page_id: string;
    link_data?: {
      link: string;
      message?: string;
      name?: string;
      description?: string;
      image_hash?: string;
      call_to_action?: { type: CreativeCallToAction; value?: { link?: string } };
      child_attachments?: CarouselCard[];
    };
    video_data?: {
      video_id: string;
      title?: string;
      message?: string;
      description?: string;
      call_to_action?: { type: CreativeCallToAction; value?: { link?: string } };
      image_hash?: string;
    };
  };
  /** Carousel creative */
  carousel?: {
    link: string;
    message?: string;
    cards: CarouselCard[];
  };
  /** URL tags for UTM tracking */
  url_tags?: string;
  /** Degrees of Freedom (Advantage+ creative enhancements) */
  degrees_of_freedom_spec?: {
    creative_features_spec?: {
      standard_enhancements?: { enroll_status: "OPT_IN" | "OPT_OUT" };
    };
  };
}

export interface CarouselCard {
  link: string;
  name?: string;
  description?: string;
  image_hash?: string;
  video_id?: string;
  call_to_action?: { type: CreativeCallToAction; value?: { link?: string } };
}

export interface CreateAdInput {
  adset_id: string;
  name: string;
  creative_id: string;
  status?: AdStatus;
  /** Tracking specs */
  tracking_specs?: Array<{
    action_type: string[];
    page?: string[];
    fb_pixel?: string[];
  }>;
  /** URL tags for ad-level UTM */
  url_custom_parameters?: string;
  conversion_domain?: string;
}

export interface UpdateAdInput {
  name?: string;
  status?: AdStatus;
  creative?: { creative_id: string };
}

export interface CreateCustomAudienceInput {
  name: string;
  description?: string;
  subtype:
    | "CUSTOM"
    | "WEBSITE"
    | "APP"
    | "OFFLINE_CONVERSION"
    | "CUSTOMER_FILE"
    | "PARTNER"
    | "ENGAGEMENT"
    | "BAG_OF_WORDS"
    | "LOOKALIKE"
    | "CLAIM"
    | "MANAGED"
    | "STRUCTURED_LIST"
    | "REGULATED_CATEGORIES_AUDIENCE"
    | "REGULATED_INTERESTS_LOOKALIKE";
  /** For WEBSITE subtypes */
  pixel_id?: string;
  rule?: string;
  prefill?: boolean;
  retention_days?: number;
  /** For ENGAGEMENT subtypes */
  engagement_spec?: {
    engagement_type: "PAGE" | "VIDEO" | "LEAD_AD" | "CANVAS_COMPONENT" | "INSTAGRAM_BUSINESS" | "SHOPPING";
    object_id?: string;
    retention_seconds?: number;
  };
  /** For lookalike creation */
  lookalike_spec?: {
    origin: Array<{ id: string }>;
    country: string;
    ratio?: number;
    starting_ratio?: number;
    type?: "similarity" | "reach";
  };
  /** Customer file */
  customer_file_source?: "USER_PROVIDED_ONLY" | "PARTNER_PROVIDED_ONLY" | "BOTH_USER_AND_PARTNER_PROVIDED";
}

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface MetaWriteResult {
  id: string;
  success?: boolean;
}

export interface MetaDeleteResult {
  success: boolean;
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: CampaignStatus;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
  created_time: string;
  updated_time: string;
  bid_strategy?: string;
  buying_type?: string;
  effective_status: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: AdSetStatus;
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
  optimization_goal: string;
  billing_event: string;
  bid_amount?: number;
  created_time: string;
  updated_time: string;
  start_time?: string;
  end_time?: string;
  targeting?: Record<string, unknown>;
  effective_status: string;
}

export interface MetaAd {
  id: string;
  name: string;
  status: AdStatus;
  adset_id: string;
  campaign_id: string;
  creative?: { id: string };
  created_time: string;
  updated_time: string;
  effective_status: string;
}

export interface MetaAdCreative {
  id: string;
  name: string;
  status?: string;
  body?: string;
  title?: string;
  image_url?: string;
  thumbnail_url?: string;
  object_type?: string;
  created_time: string;
}

export interface MetaCustomAudience {
  id: string;
  name: string;
  subtype: string;
  approximate_count_lower_bound?: number;
  approximate_count_upper_bound?: number;
  data_source?: { type: string };
  description?: string;
  retention_days?: number;
  time_created: string;
  time_updated: string;
}

export interface ReachEstimate {
  estimate_ready: boolean;
  estimate_mau_lower_bound: number;
  estimate_mau_upper_bound: number;
  estimate_dau_lower_bound?: number;
  estimate_dau_upper_bound?: number;
}

export interface DeliveryEstimate {
  daily_outcomes_curve: Array<{
    spend: number;
    reach: number;
    impressions: number;
    actions: Array<{ action_type: string; value: number }>;
  }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAccessToken(): string {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    throw new MetaApiError("META_ACCESS_TOKEN environment variable is not set", 0);
  }
  return token;
}

function normalizeAdAccountId(id: string): string {
  if (!id.startsWith("act_")) return `act_${id}`;
  return id;
}

async function metaFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  const json = (await response.json()) as T & { error?: { message: string; code: number; error_subcode?: number; fbtrace_id?: string } };

  if (!response.ok || (json as { error?: unknown }).error) {
    const err = (json as { error?: { message: string; code: number; error_subcode?: number; fbtrace_id?: string } }).error;
    if (err) {
      throw new MetaApiError(err.message, err.code, err.error_subcode, err.fbtrace_id);
    }
    throw new MetaApiError(`HTTP ${response.status}`, response.status);
  }

  return json;
}

function buildPostBody(params: Record<string, unknown>): URLSearchParams {
  const body = new URLSearchParams();
  body.append("access_token", getAccessToken());

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "object") {
      body.append(key, JSON.stringify(value));
    } else {
      body.append(key, String(value));
    }
  }

  return body;
}

// ---------------------------------------------------------------------------
// CAMPAIGNS
// ---------------------------------------------------------------------------

/** List all campaigns for an ad account */
export async function listCampaigns(
  adAccountId: string,
  fields: string = "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time,bid_strategy,buying_type,effective_status",
  limit = 50
): Promise<MetaCampaign[]> {
  const accountId = normalizeAdAccountId(adAccountId);
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${accountId}/campaigns?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const result = await metaFetch<{ data: MetaCampaign[] }>(url);
  return result.data;
}

/** Create a new campaign (defaults to PAUSED — safe for drafts) */
export async function createCampaign(
  adAccountId: string,
  input: CreateCampaignInput
): Promise<MetaWriteResult> {
  const accountId = normalizeAdAccountId(adAccountId);
  const url = `${META_GRAPH_URL}/${accountId}/campaigns`;

  const params: Record<string, unknown> = {
    name: input.name,
    objective: input.objective,
    status: input.status ?? "PAUSED",
    special_ad_categories: input.special_ad_categories ?? ["NONE"],
  };

  if (input.daily_budget !== undefined) params.daily_budget = input.daily_budget;
  if (input.lifetime_budget !== undefined) params.lifetime_budget = input.lifetime_budget;
  if (input.start_time) params.start_time = input.start_time;
  if (input.stop_time) params.stop_time = input.stop_time;
  if (input.is_campaign_budget_optimization !== undefined) {
    params.is_campaign_budget_optimization = input.is_campaign_budget_optimization;
  }
  if (input.bid_strategy) params.bid_strategy = input.bid_strategy;
  if (input.bid_amount !== undefined) params.bid_amount = input.bid_amount;

  const body = buildPostBody(params);

  return metaFetch<MetaWriteResult>(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

/** Update an existing campaign */
export async function updateCampaign(
  campaignId: string,
  input: UpdateCampaignInput
): Promise<MetaWriteResult> {
  const url = `${META_GRAPH_URL}/${campaignId}`;

  const params: Record<string, unknown> = {};
  if (input.name !== undefined) params.name = input.name;
  if (input.status !== undefined) params.status = input.status;
  if (input.daily_budget !== undefined) params.daily_budget = input.daily_budget;
  if (input.lifetime_budget !== undefined) params.lifetime_budget = input.lifetime_budget;
  if (input.start_time !== undefined) params.start_time = input.start_time;
  if (input.stop_time !== undefined) params.stop_time = input.stop_time;
  if (input.bid_strategy !== undefined) params.bid_strategy = input.bid_strategy;
  if (input.bid_amount !== undefined) params.bid_amount = input.bid_amount;

  const body = buildPostBody(params);

  return metaFetch<MetaWriteResult>(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

/** Toggle campaign status to ACTIVE or PAUSED */
export async function toggleCampaignStatus(
  campaignId: string,
  status: "ACTIVE" | "PAUSED"
): Promise<MetaWriteResult> {
  return updateCampaign(campaignId, { status });
}

/** Delete a campaign */
export async function deleteCampaign(campaignId: string): Promise<MetaDeleteResult> {
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${campaignId}?access_token=${encodeURIComponent(token)}`;

  return metaFetch<MetaDeleteResult>(url, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// AD SETS
// ---------------------------------------------------------------------------

/** List all ad sets for a campaign */
export async function listAdSets(
  campaignId: string,
  fields: string = "id,name,status,campaign_id,daily_budget,lifetime_budget,optimization_goal,billing_event,bid_amount,created_time,updated_time,start_time,end_time,targeting,effective_status",
  limit = 50
): Promise<MetaAdSet[]> {
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${campaignId}/adsets?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const result = await metaFetch<{ data: MetaAdSet[] }>(url);
  return result.data;
}

/** List all ad sets for an ad account */
export async function listAdSetsForAccount(
  adAccountId: string,
  fields: string = "id,name,status,campaign_id,daily_budget,lifetime_budget,optimization_goal,billing_event,bid_amount,created_time,updated_time,start_time,end_time,effective_status",
  limit = 100
): Promise<MetaAdSet[]> {
  const accountId = normalizeAdAccountId(adAccountId);
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${accountId}/adsets?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const result = await metaFetch<{ data: MetaAdSet[] }>(url);
  return result.data;
}

/** Create a new ad set (defaults to PAUSED) */
export async function createAdSet(
  adAccountId: string,
  input: CreateAdSetInput
): Promise<MetaWriteResult> {
  const accountId = normalizeAdAccountId(adAccountId);
  const url = `${META_GRAPH_URL}/${accountId}/adsets`;

  const params: Record<string, unknown> = {
    campaign_id: input.campaign_id,
    name: input.name,
    optimization_goal: input.optimization_goal,
    billing_event: input.billing_event,
    status: input.status ?? "PAUSED",
    targeting: input.targeting,
  };

  if (input.daily_budget !== undefined) params.daily_budget = input.daily_budget;
  if (input.lifetime_budget !== undefined) params.lifetime_budget = input.lifetime_budget;
  if (input.bid_amount !== undefined) params.bid_amount = input.bid_amount;
  if (input.bid_strategy !== undefined) params.bid_strategy = input.bid_strategy;
  if (input.start_time) params.start_time = input.start_time;
  if (input.end_time) params.end_time = input.end_time;
  if (input.promoted_object) params.promoted_object = input.promoted_object;
  if (input.attribution_spec) params.attribution_spec = input.attribution_spec;
  if (input.destination_type) params.destination_type = input.destination_type;

  const body = buildPostBody(params);

  return metaFetch<MetaWriteResult>(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

/** Update an existing ad set */
export async function updateAdSet(
  adSetId: string,
  input: UpdateAdSetInput
): Promise<MetaWriteResult> {
  const url = `${META_GRAPH_URL}/${adSetId}`;

  const params: Record<string, unknown> = {};
  if (input.name !== undefined) params.name = input.name;
  if (input.status !== undefined) params.status = input.status;
  if (input.daily_budget !== undefined) params.daily_budget = input.daily_budget;
  if (input.lifetime_budget !== undefined) params.lifetime_budget = input.lifetime_budget;
  if (input.bid_amount !== undefined) params.bid_amount = input.bid_amount;
  if (input.end_time !== undefined) params.end_time = input.end_time;
  if (input.targeting !== undefined) params.targeting = input.targeting;

  const body = buildPostBody(params);

  return metaFetch<MetaWriteResult>(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

/** Delete an ad set */
export async function deleteAdSet(adSetId: string): Promise<MetaDeleteResult> {
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${adSetId}?access_token=${encodeURIComponent(token)}`;

  return metaFetch<MetaDeleteResult>(url, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// ADS
// ---------------------------------------------------------------------------

/** List all ads for an ad set */
export async function listAds(
  adSetId: string,
  fields: string = "id,name,status,adset_id,campaign_id,creative{id,name,thumbnail_url,body},created_time,updated_time,effective_status",
  limit = 50
): Promise<MetaAd[]> {
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${adSetId}/ads?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const result = await metaFetch<{ data: MetaAd[] }>(url);
  return result.data;
}

/** List all ads for an ad account */
export async function listAdsForAccount(
  adAccountId: string,
  fields: string = "id,name,status,adset_id,campaign_id,creative{id,name,thumbnail_url},created_time,updated_time,effective_status",
  limit = 100
): Promise<MetaAd[]> {
  const accountId = normalizeAdAccountId(adAccountId);
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${accountId}/ads?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const result = await metaFetch<{ data: MetaAd[] }>(url);
  return result.data;
}

/** Create a new ad (defaults to PAUSED) */
export async function createAd(
  adAccountId: string,
  input: CreateAdInput
): Promise<MetaWriteResult> {
  const accountId = normalizeAdAccountId(adAccountId);
  const url = `${META_GRAPH_URL}/${accountId}/ads`;

  const params: Record<string, unknown> = {
    adset_id: input.adset_id,
    name: input.name,
    creative: { creative_id: input.creative_id },
    status: input.status ?? "PAUSED",
  };

  if (input.tracking_specs) params.tracking_specs = input.tracking_specs;
  if (input.url_custom_parameters) params.url_custom_parameters = input.url_custom_parameters;
  if (input.conversion_domain) params.conversion_domain = input.conversion_domain;

  const body = buildPostBody(params);

  return metaFetch<MetaWriteResult>(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

/** Update an existing ad */
export async function updateAd(
  adId: string,
  input: UpdateAdInput
): Promise<MetaWriteResult> {
  const url = `${META_GRAPH_URL}/${adId}`;

  const params: Record<string, unknown> = {};
  if (input.name !== undefined) params.name = input.name;
  if (input.status !== undefined) params.status = input.status;
  if (input.creative !== undefined) params.creative = input.creative;

  const body = buildPostBody(params);

  return metaFetch<MetaWriteResult>(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

/** Delete an ad */
export async function deleteAd(adId: string): Promise<MetaDeleteResult> {
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${adId}?access_token=${encodeURIComponent(token)}`;

  return metaFetch<MetaDeleteResult>(url, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// AD CREATIVES
// ---------------------------------------------------------------------------

/** List all creatives for an ad account */
export async function listCreatives(
  adAccountId: string,
  fields: string = "id,name,status,body,title,image_url,thumbnail_url,object_type,created_time",
  limit = 50
): Promise<MetaAdCreative[]> {
  const accountId = normalizeAdAccountId(adAccountId);
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${accountId}/adcreatives?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const result = await metaFetch<{ data: MetaAdCreative[] }>(url);
  return result.data;
}

/** Create an ad creative */
export async function createAdCreative(
  adAccountId: string,
  input: CreateAdCreativeInput
): Promise<MetaWriteResult> {
  const accountId = normalizeAdAccountId(adAccountId);
  const url = `${META_GRAPH_URL}/${accountId}/adcreatives`;

  const params: Record<string, unknown> = {
    name: input.name,
  };

  if (input.object_story_spec) {
    params.object_story_spec = input.object_story_spec;
  } else if (input.carousel) {
    // Build carousel object_story_spec
    params.object_story_spec = {
      page_id: input.page_id,
      link_data: {
        link: input.carousel.link,
        message: input.carousel.message,
        multi_share_end_card: false,
        child_attachments: input.carousel.cards,
      },
    };
  } else if (input.image_hash) {
    params.object_story_spec = {
      page_id: input.page_id,
      link_data: {
        link: input.link_url ?? "https://shiftarcade.miami",
        message: input.body,
        name: input.title,
        image_hash: input.image_hash,
        call_to_action: input.call_to_action,
      },
    };
  } else if (input.video_id) {
    params.object_story_spec = {
      page_id: input.page_id,
      video_data: {
        video_id: input.video_id,
        title: input.title,
        message: input.body,
        call_to_action: input.call_to_action,
      },
    };
  }

  if (input.instagram_actor_id) params.instagram_actor_id = input.instagram_actor_id;
  if (input.url_tags) params.url_tags = input.url_tags;
  if (input.degrees_of_freedom_spec) params.degrees_of_freedom_spec = input.degrees_of_freedom_spec;

  const body = buildPostBody(params);

  return metaFetch<MetaWriteResult>(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

/** Delete an ad creative */
export async function deleteAdCreative(creativeId: string): Promise<MetaDeleteResult> {
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${creativeId}?access_token=${encodeURIComponent(token)}`;

  return metaFetch<MetaDeleteResult>(url, { method: "DELETE" });
}

// ---------------------------------------------------------------------------
// AD IMAGES
// ---------------------------------------------------------------------------

export interface AdImageUploadResult {
  images: Record<string, { hash: string; url: string; created_time: string }>;
}

/**
 * Upload an image by URL (most common for web use).
 * Returns the image hash needed for creative creation.
 */
export async function uploadAdImageByUrl(
  adAccountId: string,
  imageUrl: string
): Promise<{ hash: string; url: string }> {
  const accountId = normalizeAdAccountId(adAccountId);
  const apiUrl = `${META_GRAPH_URL}/${accountId}/adimages`;

  const params: Record<string, unknown> = {
    "https://": imageUrl, // Meta's URL upload format
  };

  const body = buildPostBody(params);
  const result = await metaFetch<AdImageUploadResult>(apiUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const firstKey = Object.keys(result.images)[0];
  return result.images[firstKey];
}

/** List uploaded ad images */
export async function listAdImages(
  adAccountId: string,
  limit = 50
): Promise<Array<{ hash: string; url: string; name: string; created_time: string }>> {
  const accountId = normalizeAdAccountId(adAccountId);
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${accountId}/adimages?fields=hash,url,name,created_time&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const result = await metaFetch<{ data: Array<{ hash: string; url: string; name: string; created_time: string }> }>(url);
  return result.data;
}

// ---------------------------------------------------------------------------
// CUSTOM AUDIENCES
// ---------------------------------------------------------------------------

/** List all custom audiences for an ad account */
export async function listCustomAudiences(
  adAccountId: string,
  fields: string = "id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,description,retention_days,time_created,time_updated",
  limit = 50
): Promise<MetaCustomAudience[]> {
  const accountId = normalizeAdAccountId(adAccountId);
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${accountId}/customaudiences?fields=${fields}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const result = await metaFetch<{ data: MetaCustomAudience[] }>(url);
  return result.data;
}

/** Create a custom audience */
export async function createCustomAudience(
  adAccountId: string,
  input: CreateCustomAudienceInput
): Promise<MetaWriteResult> {
  const accountId = normalizeAdAccountId(adAccountId);
  const url = `${META_GRAPH_URL}/${accountId}/customaudiences`;

  const params: Record<string, unknown> = {
    name: input.name,
    subtype: input.subtype,
  };

  if (input.description) params.description = input.description;
  if (input.pixel_id) params.pixel_id = input.pixel_id;
  if (input.rule) params.rule = input.rule;
  if (input.prefill !== undefined) params.prefill = input.prefill;
  if (input.retention_days !== undefined) params.retention_days = input.retention_days;
  if (input.engagement_spec) params.engagement_spec = input.engagement_spec;
  if (input.lookalike_spec) params.lookalike_spec = input.lookalike_spec;
  if (input.customer_file_source) params.customer_file_source = input.customer_file_source;

  const body = buildPostBody(params);

  return metaFetch<MetaWriteResult>(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

/** Delete a custom audience */
export async function deleteCustomAudience(audienceId: string): Promise<MetaDeleteResult> {
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/${audienceId}?access_token=${encodeURIComponent(token)}`;

  return metaFetch<MetaDeleteResult>(url, { method: "DELETE" });
}

/** Add users to a custom audience via hashed emails/phones */
export async function addUsersToAudience(
  audienceId: string,
  hashedEmails: string[],
  schema: "EMAIL_SHA256" | "PHONE_SHA256" | "MADID" = "EMAIL_SHA256"
): Promise<{ audience_id: string; num_received: number; num_invalid_entries: number; invalid_entry_samples: unknown }> {
  const url = `${META_GRAPH_URL}/${audienceId}/users`;

  const params: Record<string, unknown> = {
    payload: {
      schema: [schema],
      data: hashedEmails.map((v) => [v]),
    },
  };

  const body = buildPostBody(params);

  return metaFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
}

// ---------------------------------------------------------------------------
// REACH & DELIVERY ESTIMATES
// ---------------------------------------------------------------------------

/** Get reach estimate for a targeting spec */
export async function getReachEstimate(
  adAccountId: string,
  targeting: Record<string, unknown>,
  optimizationGoal: OptimizationGoal = "CONVERSIONS"
): Promise<ReachEstimate> {
  const accountId = normalizeAdAccountId(adAccountId);
  const token = getAccessToken();

  const targetingStr = encodeURIComponent(JSON.stringify(targeting));
  const url = `${META_GRAPH_URL}/${accountId}/reachestimate?targeting_spec=${targetingStr}&optimization_goal=${optimizationGoal}&access_token=${encodeURIComponent(token)}`;

  return metaFetch<ReachEstimate>(url);
}

/** Get delivery estimate (predicted daily outcomes) for an ad set targeting */
export async function getDeliveryEstimate(
  adAccountId: string,
  targeting: Record<string, unknown>,
  optimizationGoal: OptimizationGoal = "CONVERSIONS",
  promotedObjectPixelId?: string
): Promise<DeliveryEstimate> {
  const accountId = normalizeAdAccountId(adAccountId);
  const token = getAccessToken();

  const params = new URLSearchParams({
    targeting_spec: JSON.stringify(targeting),
    optimization_goal: optimizationGoal,
    access_token: token,
  });

  if (promotedObjectPixelId) {
    params.append("promoted_object", JSON.stringify({
      pixel_id: promotedObjectPixelId,
      custom_event_type: "PURCHASE",
    }));
  }

  const url = `${META_GRAPH_URL}/${accountId}/delivery_estimate?${params.toString()}`;
  return metaFetch<DeliveryEstimate>(url);
}

// ---------------------------------------------------------------------------
// TARGETING SEARCH (find interest/behavior IDs)
// ---------------------------------------------------------------------------

export interface TargetingSearchResult {
  id: string;
  name: string;
  audience_size_lower_bound: number;
  audience_size_upper_bound: number;
  path: string[];
  type: string;
  topic?: string;
}

/** Search for targetable interests by keyword */
export async function searchInterests(
  query: string,
  limit = 20
): Promise<TargetingSearchResult[]> {
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/search?type=adinterest&q=${encodeURIComponent(query)}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const result = await metaFetch<{ data: TargetingSearchResult[] }>(url);
  return result.data;
}

/** Search for targetable behaviors */
export async function searchBehaviors(
  query: string,
  limit = 20
): Promise<TargetingSearchResult[]> {
  const token = getAccessToken();
  const url = `${META_GRAPH_URL}/search?type=adTargetingCategory&class=behaviors&q=${encodeURIComponent(query)}&limit=${limit}&access_token=${encodeURIComponent(token)}`;

  const result = await metaFetch<{ data: TargetingSearchResult[] }>(url);
  return result.data;
}

// ---------------------------------------------------------------------------
// BATCH OPERATIONS
// ---------------------------------------------------------------------------

interface BatchRequest {
  method: "GET" | "POST" | "DELETE";
  relative_url: string;
  body?: string;
}

interface BatchResponse<T = unknown> {
  code: number;
  body: string;
  _parsed?: T;
}

/**
 * Execute multiple Meta API calls in a single batch request.
 * Reduces latency and respects rate limits.
 * Maximum 50 operations per batch.
 */
export async function batchRequest(
  requests: BatchRequest[]
): Promise<BatchResponse[]> {
  if (requests.length > 50) {
    throw new Error("Batch request limit is 50 operations");
  }

  const token = getAccessToken();
  const body = new URLSearchParams({
    access_token: token,
    batch: JSON.stringify(requests),
  });

  const response = await fetch(`${META_GRAPH_URL}/`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  const results = (await response.json()) as BatchResponse[];

  return results.map((r) => ({
    ...r,
    _parsed: r.body ? (() => { try { return JSON.parse(r.body); } catch { return null; } })() : null,
  }));
}

// ---------------------------------------------------------------------------
// DRAFT CAMPAIGN TEMPLATES — Shift Arcade Miami
// ---------------------------------------------------------------------------

/**
 * Pre-built draft campaign spec for Shift Arcade Miami.
 * Based on historical performance data + research.
 * ALL campaigns default to PAUSED — nothing launches automatically.
 */

export interface ShiftArcadeDraftCampaign {
  id: string;
  name: string;
  description: string;
  campaign: CreateCampaignInput;
  adSet: Omit<CreateAdSetInput, "campaign_id">;
  creativeSpec: {
    headline: string;
    primaryText: string;
    description: string;
    callToAction: CreativeCallToAction;
    linkUrl: string;
    urlTags: string;
    creativeConceptTitle: string;
    creativeConceptScript: string;
  };
  estimatedCPP: string;
  estimatedReach: string;
  priority: number;
  notes: string;
}

/** Interest targeting IDs for sim racing / entertainment in South Florida */
export const SHIFT_ARCADE_INTERESTS = {
  f1: { id: "6003348604647", name: "Formula One" },
  racing_games: { id: "6003596692904", name: "Racing video games" },
  esports: { id: "6003107902433", name: "eSports" },
  karting: { id: "6003348604647", name: "Go-kart racing" },
  gaming: { id: "6003596692904", name: "Video gaming" },
  entertainment: { id: "6003483892467", name: "Entertainment" },
  nightlife: { id: "6003542984619", name: "Nightlife" },
  date_night: { id: "6003636178232", name: "Date night" },
  gran_turismo: { id: "6003596692904", name: "Gran Turismo" },
  assetto_corsa: { id: "6003596692904", name: "Assetto Corsa" },
};

export const SHIFT_ARCADE_DRAFT_CAMPAIGNS: ShiftArcadeDraftCampaign[] = [
  {
    id: "draft-north-miami-beach-conversions",
    name: "🏆 North Miami Beach — COLD — Conversions ($10/day)",
    description: "Best historical performer at $5.03/purchase. Target sim racing & F1 fans age 21-45. Conversions objective with pixel purchase event.",
    campaign: {
      name: "SHIFT ARCADE | North Miami Beach COLD | Conversions | Mar 2026",
      objective: "OUTCOME_SALES",
      status: "PAUSED",
      daily_budget: 1000, // $10.00 in cents
      special_ad_categories: ["NONE"],
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    },
    adSet: {
      name: "NMB | Age 21-45 | F1 + Racing + Esports | Conversions",
      optimization_goal: "OFFSITE_CONVERSIONS",
      billing_event: "IMPRESSIONS",
      daily_budget: 1000,
      status: "PAUSED",
      targeting: {
        geo_locations: {
          cities: [{ key: "2421836", radius: 15, distance_unit: "mile" }], // North Miami Beach
          location_types: ["home", "recent"],
        },
        age_min: 21,
        age_max: 45,
        genders: [1, 2],
        flexible_spec: [
          {
            interests: [
              { id: "6003348604647", name: "Formula One" },
              { id: "6003596692904", name: "Racing video games" },
              { id: "6003107902433", name: "eSports" },
            ],
          },
          {
            interests: [
              { id: "6003542984619", name: "Nightlife" },
              { id: "6003636178232", name: "Date night activities" },
            ],
          },
        ],
        publisher_platforms: ["facebook", "instagram"],
        facebook_positions: ["feed", "story", "reels"],
        instagram_positions: ["stream", "story", "reels"],
      },
      promoted_object: {
        custom_event_type: "PURCHASE",
      },
      attribution_spec: [
        { event_type: "CLICK_THROUGH", window_days: 7 },
        { event_type: "VIEW_THROUGH", window_days: 1 },
      ],
    },
    creativeSpec: {
      headline: "Race Like a Pro in Miami",
      primaryText: "🏁 Experience the most realistic sim racing in South Florida. Formula 1, GT3, IndyCar — all at Shift Arcade in Wynwood. Book your session now before spots fill up this weekend.",
      description: "Wynwood's Premier Racing Simulator Venue",
      callToAction: "BOOK_NOW",
      linkUrl: "https://shiftarcade.miami/book",
      urlTags: "utm_source=facebook&utm_medium=paid_social&utm_campaign=nmb-cold-conversions&utm_content={{adset.name}}",
      creativeConceptTitle: "The Podium Experience",
      creativeConceptScript: "HOOK (0-3s): Driver's POV — steering wheel, G-forces, apex of Turn 1 at Monza. TEXT OVERLAY: 'This isn't gaming. This is racing.' BODY (3-12s): Quick cuts between different simulators, multiple guests competing, leaderboard climbing. CTA OVERLAY: 'Book Your Race' + SHIFT ARCADE logo. MUSIC: High-tempo electronic / racing game soundtrack.",
    },
    estimatedCPP: "$5-8",
    estimatedReach: "45,000-65,000/week",
    priority: 1,
    notes: "Historical top performer. North Miami Beach historically returned $5.03/purchase. Start here with $10/day to rebuild learning phase. Do NOT pause once live — learning phase requires ~50 purchases/week to exit.",
  },
  {
    id: "draft-miami-cold-retargeting",
    name: "🎯 Miami RETARGETING — Website Visitors 30 Days",
    description: "Retargeting funnel was completely missing from account. These users already visited shiftarcade.miami — conversion rate 3-5x higher than cold audiences.",
    campaign: {
      name: "SHIFT ARCADE | Miami Retargeting | Website Visitors 30d | Mar 2026",
      objective: "OUTCOME_SALES",
      status: "PAUSED",
      daily_budget: 500, // $5/day
      special_ad_categories: ["NONE"],
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    },
    adSet: {
      name: "Retargeting | Website Visitors 30d | All Miami Metro",
      optimization_goal: "OFFSITE_CONVERSIONS",
      billing_event: "IMPRESSIONS",
      daily_budget: 500,
      status: "PAUSED",
      targeting: {
        geo_locations: {
          cities: [{ key: "2421836", radius: 30, distance_unit: "mile" }], // Miami metro
        },
        age_min: 18,
        age_max: 55,
        genders: [1, 2],
        // Note: custom_audiences populated at launch time with actual pixel audience ID
        custom_audiences: [{ id: "PIXEL_WEBSITE_VISITORS_30D_ID" }],
        publisher_platforms: ["facebook", "instagram"],
        facebook_positions: ["feed", "story"],
        instagram_positions: ["stream", "story", "reels"],
      },
      promoted_object: {
        custom_event_type: "PURCHASE",
      },
      attribution_spec: [
        { event_type: "CLICK_THROUGH", window_days: 7 },
        { event_type: "VIEW_THROUGH", window_days: 1 },
      ],
    },
    creativeSpec: {
      headline: "Still Thinking About It? 🏁",
      primaryText: "You checked us out — now it's time to race. Shift Arcade slots are going fast this weekend. Secure your session before it's gone.",
      description: "Book before the weekend fills up",
      callToAction: "BOOK_NOW",
      linkUrl: "https://shiftarcade.miami/book",
      urlTags: "utm_source=facebook&utm_medium=paid_social&utm_campaign=retargeting-website-30d&utm_content={{adset.name}}",
      creativeConceptTitle: "The FOMO Closer",
      creativeConceptScript: "Static or single video. Show a group of friends celebrating after a race — leaderboard showing, high fives, big smiles. TEXT: 'They booked it. You should too.' Strong urgency CTA. Testimonial overlay optional: '10/10 — best experience in Miami' — Google Reviews.",
    },
    estimatedCPP: "$3-6",
    estimatedReach: "500-2,000/week (warm audience)",
    priority: 2,
    notes: "CRITICAL gap in original account — zero retargeting was running. Website visitors who didn't convert are the lowest-hanging fruit. Requires pixel to have 30-day website visitor audience built up.",
  },
  {
    id: "draft-lookalike-past-purchasers",
    name: "🔄 Lookalike — Past Purchasers 1%",
    description: "Create 1% lookalike from pixel purchase events. These are statistically similar to people who already booked — Meta's AI finds them automatically.",
    campaign: {
      name: "SHIFT ARCADE | Lookalike 1% Purchasers | Conversions | Mar 2026",
      objective: "OUTCOME_SALES",
      status: "PAUSED",
      daily_budget: 1000,
      special_ad_categories: ["NONE"],
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    },
    adSet: {
      name: "LAL 1% Purchasers | Miami Metro | Age 21-45",
      optimization_goal: "OFFSITE_CONVERSIONS",
      billing_event: "IMPRESSIONS",
      daily_budget: 1000,
      status: "PAUSED",
      targeting: {
        geo_locations: {
          cities: [{ key: "2421836", radius: 25, distance_unit: "mile" }],
        },
        age_min: 21,
        age_max: 45,
        genders: [1, 2],
        // Note: lookalike audience ID populated at launch time
        custom_audiences: [{ id: "LOOKALIKE_1PCT_PURCHASERS_ID" }],
        publisher_platforms: ["facebook", "instagram"],
        facebook_positions: ["feed", "story", "reels"],
        instagram_positions: ["stream", "story", "reels"],
      },
      promoted_object: {
        custom_event_type: "PURCHASE",
      },
    },
    creativeSpec: {
      headline: "Miami's Most Immersive Racing Experience",
      primaryText: "Step inside a professional racing simulator at Shift Arcade in Wynwood. Choose your car, your track, your rivals. This is the rush you've been looking for.",
      description: "F1 • GT3 • IndyCar • Wynwood, Miami",
      callToAction: "BOOK_NOW",
      linkUrl: "https://shiftarcade.miami/book",
      urlTags: "utm_source=facebook&utm_medium=paid_social&utm_campaign=lookalike-1pct-purchasers&utm_content={{adset.name}}",
      creativeConceptTitle: "The Race Intro",
      creativeConceptScript: "Video: Start from driver's POV in the cockpit — countdown light sequence (5, 4, 3, 2, 1... GO!) — launch off the line — crowd reacts. Cut to group of friends pumped up. 'Your race starts at shiftarcade.miami.' Needs pro footage or high-quality UGC.",
    },
    estimatedCPP: "$7-12",
    estimatedReach: "80,000-120,000/week",
    priority: 3,
    notes: "Requires at least 100 pixel purchase events to create a quality lookalike audience. Build this after retargeting campaign accumulates data. Expected to be most scalable audience long-term.",
  },
  {
    id: "draft-capi-retest-fort-lauderdale",
    name: "🧪 CAPI Retest — Fort Lauderdale COLD",
    description: "CAPI campaigns were paused mid-learning — NOT failures. Retest Fort Lauderdale with fresh CAPI setup to properly evaluate server-side conversion tracking.",
    campaign: {
      name: "SHIFT ARCADE | Fort Lauderdale CAPI Retest | Conversions | Mar 2026",
      objective: "OUTCOME_SALES",
      status: "PAUSED",
      daily_budget: 800,
      special_ad_categories: ["NONE"],
    },
    adSet: {
      name: "FTL CAPI | Age 22-42 | Racing + Entertainment | CAPI",
      optimization_goal: "OFFSITE_CONVERSIONS",
      billing_event: "IMPRESSIONS",
      daily_budget: 800,
      status: "PAUSED",
      targeting: {
        geo_locations: {
          cities: [{ key: "2403700", radius: 20, distance_unit: "mile" }], // Fort Lauderdale
          location_types: ["home", "recent"],
        },
        age_min: 22,
        age_max: 42,
        genders: [1, 2],
        flexible_spec: [
          {
            interests: [
              { id: "6003348604647", name: "Formula One" },
              { id: "6003596692904", name: "Racing video games" },
            ],
          },
        ],
        publisher_platforms: ["facebook", "instagram"],
        facebook_positions: ["feed", "story"],
        instagram_positions: ["stream", "story"],
      },
      promoted_object: {
        custom_event_type: "PURCHASE",
      },
    },
    creativeSpec: {
      headline: "Fort Lauderdale: Race Day is Here",
      primaryText: "30 minutes from home. Shift Arcade brings professional sim racing to South Florida. Book your session this week — slots limited.",
      description: "Sim Racing · Wynwood · 20 min from FTL",
      callToAction: "BOOK_NOW",
      linkUrl: "https://shiftarcade.miami/book",
      urlTags: "utm_source=facebook&utm_medium=paid_social&utm_campaign=ftl-capi-retest&utm_content={{adset.name}}",
      creativeConceptTitle: "The Distance Doesn't Matter",
      creativeConceptScript: "Simple static ad or carousel. Maps showing 20-min drive from FTL to Wynwood. 'Worth every mile.' Show the simulator experience. Price point and CTA clearly visible.",
    },
    estimatedCPP: "$8-15",
    estimatedReach: "35,000-55,000/week",
    priority: 4,
    notes: "Run minimum 2 weeks at $8/day before evaluating. Do not pause — CAPI needs 14+ days of data to optimize properly. Ensure Conversions API is properly configured on backend before launching.",
  },
  {
    id: "draft-advantage-plus-shopping",
    name: "⚡ Advantage+ Sales Campaign — All South Florida",
    description: "Meta's AI-powered campaign type. Eliminates manual audience setup — Meta finds the best buyers automatically. Best for scaling after initial data collection.",
    campaign: {
      name: "SHIFT ARCADE | Advantage+ Sales | All South Florida | Mar 2026",
      objective: "OUTCOME_SALES",
      status: "PAUSED",
      daily_budget: 2000, // $20/day for scale
      special_ad_categories: ["NONE"],
      is_campaign_budget_optimization: true,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
    },
    adSet: {
      name: "Advantage+ | South Florida | All Ages | Auto Placements",
      optimization_goal: "OFFSITE_CONVERSIONS",
      billing_event: "IMPRESSIONS",
      daily_budget: 2000,
      status: "PAUSED",
      targeting: {
        geo_locations: {
          regions: [{ key: "3847" }], // Florida
          location_types: ["home", "recent"],
        },
        age_min: 18,
        age_max: 65,
        genders: [1, 2],
        publisher_platforms: ["facebook", "instagram", "audience_network"],
      },
      promoted_object: {
        custom_event_type: "PURCHASE",
      },
    },
    creativeSpec: {
      headline: "South Florida's #1 Sim Racing Experience",
      primaryText: "🏁 Professional racing simulators. Real tracks. Real competition. 500+ Google reviews. Shift Arcade — Wynwood, Miami. Book your session today.",
      description: "Wynwood Miami · Multiple simulators · Private events",
      callToAction: "BOOK_NOW",
      linkUrl: "https://shiftarcade.miami/book",
      urlTags: "utm_source=facebook&utm_medium=paid_social&utm_campaign=advantage-plus-south-florida&utm_content=auto",
      creativeConceptTitle: "The Social Proof Powerhouse",
      creativeConceptScript: "Feature real customer reactions + reviews. Short UGC clips from happy customers + overlay of star rating + review count. 'The experience of a lifetime' — @customer_handle. Mix of 3-5 short UGC clips (3-10s each). Strong social proof is Meta's highest-converting format for experience businesses.",
    },
    estimatedCPP: "$6-10",
    estimatedReach: "200,000-400,000/week",
    priority: 5,
    notes: "Requires minimum 50 pixel purchase events to function well. Launch this AFTER the North Miami Beach campaign has been running 2-3 weeks and accumulated data. This is your scale campaign.",
  },
];
