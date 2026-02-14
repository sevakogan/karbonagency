"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import type { Client } from "@/types";

export async function getClients(): Promise<Client[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name");

  if (error) {
    console.error("Failed to fetch clients:", error.message);
    return [];
  }
  return data as Client[];
}

export async function getClientById(id: string): Promise<Client | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Failed to fetch client:", error.message);
    return null;
  }
  return data as Client;
}

export async function createClient(data: {
  name: string;
  slug: string;
  contact_email?: string;
  contact_phone?: string;
  ghl_location_id?: string;
}): Promise<{ id: string | null; error: string | null }> {
  const supabase = await createSupabaseServer();
  const { data: row, error } = await supabase
    .from("clients")
    .insert({
      name: data.name,
      slug: data.slug,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      ghl_location_id: data.ghl_location_id || null,
    })
    .select("id")
    .single();

  if (error) {
    return { id: null, error: error.message };
  }
  return { id: row!.id, error: null };
}

export async function updateClient(
  id: string,
  data: Partial<Pick<Client, "name" | "slug" | "contact_email" | "contact_phone" | "ghl_location_id" | "is_active" | "meta_ad_account_id" | "meta_pixel_id" | "meta_page_id" | "company_name" | "instagram_url" | "facebook_url" | "logo_url">>
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("clients")
    .update(data)
    .eq("id", id);

  return { error: error?.message ?? null };
}
