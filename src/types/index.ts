export interface Client {
  id: string;
  name: string;
  slug: string;
  company_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  ghl_location_id: string | null;
  meta_ad_account_id: string | null;
  meta_pixel_id: string | null;
  meta_page_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  role: "admin" | "client";
  client_id: string | null;
  is_active: boolean;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadStatus = "new" | "contacted" | "qualified" | "converted" | "lost";

export interface Lead {
  id: string;
  client_id: string | null;
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  status: LeadStatus;
  ghl_contact_id: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type CampaignService = "meta_ads" | "google_ads" | "tiktok_ads" | "seo" | "email_marketing" | "social_media" | "web_design" | "branding";
export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export const SERVICE_LABELS: Record<CampaignService, string> = {
  meta_ads: "Meta Ads",
  google_ads: "Google Ads",
  tiktok_ads: "TikTok Ads",
  seo: "SEO",
  email_marketing: "Email Marketing",
  social_media: "Social Media",
  web_design: "Web Design",
  branding: "Branding",
};

export const ALL_SERVICES: CampaignService[] = [
  "meta_ads",
  "google_ads",
  "tiktok_ads",
  "seo",
  "email_marketing",
  "social_media",
  "web_design",
  "branding",
];

export interface Campaign {
  id: string;
  client_id: string;
  name: string;
  services: CampaignService[];
  status: CampaignStatus;
  monthly_cost: number | null;
  ad_budgets: Record<string, number> | null;
  meta_ad_account_id: string | null;
  start_date: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignMetrics {
  id: string;
  campaign_id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  spend: number;
  impressions: number;
  clicks: number;
  bookings: number;
  cost_per_booking: number | null;
  created_at: string;
}

/** Aggregated daily metrics pulled from Meta Ads API (or entered manually) */
export interface DailyMetrics {
  id: string;
  client_id: string;
  campaign_id: string | null;
  date: string;
  platform: "meta" | "google" | "tiktok" | "instagram";
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  cost_per_conversion: number | null;
  roas: number | null;
  video_views: number;
  leads: number;
  link_clicks: number;
  created_at: string;
}

/** Metric definition for tooltips on the client dashboard */
export interface MetricInfo {
  label: string;
  description: string;
  formula?: string;
}

// ============================================================
// Platform Integration Types (Redesign)
// ============================================================

export type PlatformSlug =
  | 'meta_ads'
  | 'instagram'
  | 'google_analytics'
  | 'google_ads'
  | 'google_business'
  | 'google_search_console'
  | 'tiktok_ads'
  | 'x_ads'
  | 'pinterest_ads'
  | 'linkedin_ads'
  | 'yelp'
  | 'bing_ads'
  | 'snapchat_ads';

export type PlatformCategory = 'ads' | 'analytics' | 'reviews' | 'seo';

export type IntegrationStatus = 'disconnected' | 'connected' | 'error' | 'syncing';

export interface CredentialFieldWalkthrough {
  title: string;
  steps: string[];
  direct_link?: string;
}

export interface CredentialField {
  key: string;
  label: string;
  type: 'text' | 'secret';
  required: boolean;
  placeholder?: string;
  help?: string;
  walkthrough?: CredentialFieldWalkthrough;
}

export interface PlatformCatalogEntry {
  id: string;
  slug: PlatformSlug;
  display_name: string;
  category: PlatformCategory;
  credential_fields: CredentialField[];
  test_connection_endpoint: string | null;
  icon_url: string | null;
  can_run_ads: boolean;
  sync_enabled: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface CompanyIntegration {
  id: string;
  company_id: string;
  platform_slug: PlatformSlug;
  credentials: Record<string, string>;
  is_enabled: boolean;
  status: IntegrationStatus;
  status_detail: string | null;
  last_synced_at: string | null;
  last_sync_duration_ms: number | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
  // Joined from platform_catalog
  platform?: PlatformCatalogEntry;
}

export interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string[];
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

// ============================================================
// Company Wizard Types
// ============================================================

export interface WizardSetupData {
  selected_platforms?: PlatformSlug[];
  partial_credentials?: Record<PlatformSlug, Record<string, string>>;
}

// Extended Client type for redesign
export interface Company extends Client {
  website_url: string | null;
  description: string | null;
  setup_step: number | null;
  setup_data: WizardSetupData;
}

// ============================================================
// Sync Types
// ============================================================

export interface SyncResult {
  success: boolean;
  rowsUpserted: number;
  error?: string;
  durationMs: number;
}

export interface TestConnectionResult {
  success: boolean;
  accountName?: string;
  error?: string;
}

// ============================================================
// Dashboard Aggregation Types
// ============================================================

export interface CompanyKpiSummary {
  companyId: string;
  companyName: string;
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgCtr: number;
  avgCpc: number;
  avgRoas: number;
  connectedPlatforms: number;
  totalPlatforms: number;
  lastSyncedAt: string | null;
  syncStatus: IntegrationStatus;
  sparklineData: number[];
}

export interface GlobalKpiData {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  avgRoas: number;
  avgCpc: number;
  spendDelta: number;
  impressionsDelta: number;
  clicksDelta: number;
  conversionsDelta: number;
}
