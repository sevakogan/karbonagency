"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import type { Lead, LeadStatus } from "@/types";

interface LeadFilters {
  clientId?: string;
  status?: LeadStatus;
  search?: string;
}

export async function getLeads(filters?: LeadFilters): Promise<Lead[]> {
  const supabase = await createSupabaseServer();
  let query = supabase
    .from("agency_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.clientId) {
    query = query.eq("client_id", filters.clientId);
  }
  if (filters?.status) {
    query = query.eq("status", filters.status);
  }
  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,company.ilike.%${filters.search}%`
    );
  }

  const { data, error } = await query;
  if (error) {
    console.error("Failed to fetch leads:", error.message);
    return [];
  }
  return data as Lead[];
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("agency_leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch lead:", error.message);
    return null;
  }
  return data as Lead;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("agency_leads")
    .update({ status })
    .eq("id", id);

  return { error: error?.message ?? null };
}
