import { getAdminSupabase } from "@/lib/supabase-admin";
import type { Lead, LeadInput, LeadStatus } from "./types";

/** Normalize a DB row to ensure all UI-expected fields are present */
function normalizeLead(row: Record<string, unknown>): Lead {
  // Map legacy DB status values to current LeadStatus enum
  const rawStatus = row.status as string;
  const status = rawStatus === "new" ? "incoming"
    : rawStatus === "contacted" ? "followed_up"
    : rawStatus === "converted" ? "won"
    : rawStatus;

  return {
    ...row,
    status,
    address: row.address ?? null,
    company: row.company ?? null,
    notes: row.notes ?? row.message ?? null,
    assigned_campaigns: (row.assigned_campaigns as string[] | null) ?? [],
    assigned_pipelines: (row.assigned_pipelines as string[] | null) ?? [],
  } as unknown as Lead;
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone,
      message: input.message ?? null,
      project_interest: input.projectInterest ?? null,
      source: input.source ?? "website",
      sms_consent: input.smsConsent,
      email_consent: input.emailConsent,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create lead: ${error.message}`);
  }

  return normalizeLead(data);
}

export async function getLeads(): Promise<readonly Lead[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch leads: ${error.message}`);
  }

  return (data ?? []).map(normalizeLead);
}

export async function updateLead(
  id: string,
  fields: Partial<Omit<Lead, "id" | "created_at">>
): Promise<Lead> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leads")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lead: ${error.message}`);
  }

  return normalizeLead(data);
}

export async function deleteLead(id: string): Promise<void> {
  const supabase = getAdminSupabase();
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to delete lead: ${error.message}`);
  }
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<Lead> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from("leads")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update lead: ${error.message}`);
  }

  return normalizeLead(data);
}

export async function unsubscribeLead(
  id: string,
  channel: "sms" | "email"
): Promise<void> {
  const supabase = getAdminSupabase();
  const field = channel === "sms" ? "sms_consent" : "email_consent";
  const { error } = await supabase
    .from("leads")
    .update({ [field]: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to unsubscribe lead: ${error.message}`);
  }
}
