"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import type { Campaign, CampaignMetrics, CampaignStatus } from "@/types";

interface CampaignFilters {
  clientId?: string;
  status?: CampaignStatus;
}

export async function getCampaigns(filters?: CampaignFilters): Promise<Campaign[]> {
  const supabase = await createSupabaseServer();
  let query = supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to fetch campaigns:", error.message);
    return [];
  }
  return data as Campaign[];
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch campaign:", error.message);
    return null;
  }
  return data as Campaign;
}

export async function createCampaign(data: {
  client_id: string;
  name: string;
  platform?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  budget?: number;
  notes?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createSupabaseServer();
  const { data: row, error } = await supabase
    .from("campaigns")
    .insert({
      client_id: data.client_id,
      name: data.name,
      platform: data.platform || "meta",
      status: data.status || "draft",
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      budget: data.budget || null,
      notes: data.notes || "",
    })
    .select("id")
    .single();

  if (error) {
    return { id: null, error: error.message };
  }
  return { id: row!.id, error: null };
}

export async function updateCampaign(
  id: string,
  data: Partial<Pick<Campaign, "name" | "platform" | "status" | "start_date" | "end_date" | "budget" | "notes">>
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("campaigns")
    .update(data)
    .eq("id", id);

  return { error: error?.message ?? null };
}

export async function getCampaignMetrics(campaignId: string): Promise<CampaignMetrics[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("campaign_metrics")
    .select("*")
    .eq("campaign_id", campaignId)
    .order("period_start", { ascending: false });

  if (error) {
    console.error("Failed to fetch campaign metrics:", error.message);
    return [];
  }
  return data as CampaignMetrics[];
}

export async function addCampaignMetrics(data: {
  campaign_id: string;
  client_id: string;
  period_start: string;
  period_end: string;
  spend: number;
  impressions: number;
  clicks: number;
  bookings: number;
}): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("campaign_metrics")
    .insert(data);

  return { error: error?.message ?? null };
}
