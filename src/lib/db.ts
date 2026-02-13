import { getAdminSupabase } from "./supabase-admin";

export async function createContactSubmission(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<number> {
  const supabase = getAdminSupabase();
  const { data: row } = await supabase
    .from("karbon_contact_submissions")
    .insert(data)
    .select("id")
    .single();
  return row!.id;
}

export async function createLead(data: {
  client_id?: string | null;
  name: string;
  email: string;
  phone: string;
  company?: string;
  source?: string;
  notes?: string;
}): Promise<string> {
  const supabase = getAdminSupabase();
  const { data: row, error } = await supabase
    .from("agency_leads")
    .insert({
      client_id: data.client_id || null,
      name: data.name,
      email: data.email,
      phone: data.phone,
      company: data.company || "",
      source: data.source || "website",
      notes: data.notes || "",
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create lead:", error.message);
    throw new Error("Failed to create lead");
  }
  return row!.id;
}
