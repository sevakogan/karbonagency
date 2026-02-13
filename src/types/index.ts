export interface Client {
  id: string;
  name: string;
  slug: string;
  contact_email: string | null;
  contact_phone: string | null;
  ghl_location_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
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

export type CampaignPlatform = "meta" | "instagram" | "both";
export type CampaignStatus = "draft" | "active" | "paused" | "completed";

export interface Campaign {
  id: string;
  client_id: string;
  name: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  budget: number | null;
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
