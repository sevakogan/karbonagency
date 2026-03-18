/**
 * /api/meta/clients
 * POST — create a new client, auto-generates slug, handles missing optional columns
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import type { SupabaseClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

async function auth(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return { err: NextResponse.json({ error: "Auth required" }, { status: 401 }), supabase: null };
  }
  const supabase = getAdminSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(header.replace("Bearer ", ""));
  if (error || !user) {
    return { err: NextResponse.json({ error: "Invalid session" }, { status: 401 }), supabase: null };
  }
  return { err: null, supabase };
}

function toSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

// Tries insert with full payload; if a column doesn't exist, strips it and retries
async function insertWithFallback(
  supabase: SupabaseClient,
  full: Record<string, unknown>
): Promise<{ id: string; name: string }> {
  const OPTIONAL = ["slug", "contact_email", "meta_pixel_id", "company_name", "logo_url", "meta_access_token", "meta_ad_account_id"];

  const tryInsert = async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase
      .from("clients")
      .insert(payload)
      .select("id, name")
      .single();
    return { data, error };
  };

  let payload = { ...full };
  let { data, error } = await tryInsert(payload);
  if (!error) return data as { id: string; name: string };

  // Strip optional columns one by one on column errors
  if (error.message?.includes("column") || error.code === "42703" || error.message?.includes("violates not-null")) {
    for (const col of OPTIONAL) {
      if (payload[col] !== undefined) {
        delete payload[col];
        const result = await tryInsert(payload);
        if (!result.error) return result.data as { id: string; name: string };
        error = result.error;
      }
    }
  }

  throw new Error(error.message ?? "Failed to create client");
}

export async function POST(request: NextRequest) {
  const { err, supabase } = await auth(request);
  if (err) return err;

  const body = await request.json() as Record<string, string | null>;

  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Client name is required" }, { status: 400 });

  const full: Record<string, unknown> = {
    name,
    slug: toSlug(name),
    is_active: true,
  };

  if (body.company_name?.trim())      full.company_name      = body.company_name.trim();
  if (body.contact_email?.trim())     full.contact_email     = body.contact_email.trim();
  if (body.logo_url?.trim())          full.logo_url          = body.logo_url.trim();
  if (body.meta_ad_account_id?.trim()) full.meta_ad_account_id = body.meta_ad_account_id.trim();
  if (body.meta_pixel_id?.trim())     full.meta_pixel_id     = body.meta_pixel_id.trim();
  if (body.meta_access_token?.trim()) full.meta_access_token = body.meta_access_token.trim();

  try {
    const data = await insertWithFallback(supabase!, full);
    return NextResponse.json({ data });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unknown error" }, { status: 500 });
  }
}
