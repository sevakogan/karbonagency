/**
 * /api/meta/client-settings
 * GET  — fetch client settings (tokens masked)
 * PATCH — update client settings
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

async function auth(request: NextRequest) {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    return { err: NextResponse.json({ error: "Auth required" }, { status: 401 }), user: null };
  }
  const supabase = getAdminSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(header.replace("Bearer ", ""));
  if (error || !user) {
    return { err: NextResponse.json({ error: "Invalid session" }, { status: 401 }), user: null };
  }
  return { err: null, user, supabase };
}

export async function GET(request: NextRequest) {
  const { err, supabase } = await auth(request);
  if (err) return err;

  const clientId = new URL(request.url).searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const { data, error } = await supabase!
    .from("clients")
    .select("id, name, company_name, logo_url, contact_email, meta_ad_account_id, meta_pixel_id, meta_access_token, is_active")
    .eq("id", clientId)
    .single();

  if (error || !data) return NextResponse.json({ error: "Client not found" }, { status: 404 });

  // Mask token for display
  const token = data.meta_access_token as string | null;
  return NextResponse.json({
    data: {
      ...data,
      meta_access_token_set: !!token,
      meta_access_token: token ? `${token.slice(0, 10)}${"•".repeat(18)}` : "",
    },
  });
}

export async function PATCH(request: NextRequest) {
  const { err, supabase } = await auth(request);
  if (err) return err;

  const clientId = new URL(request.url).searchParams.get("client_id");
  if (!clientId) return NextResponse.json({ error: "client_id required" }, { status: 400 });

  const body = await request.json() as Record<string, string | null>;

  const updates: Record<string, unknown> = {};
  const ALLOWED = ["name", "company_name", "logo_url", "contact_email", "meta_ad_account_id", "meta_pixel_id"];
  for (const key of ALLOWED) {
    if (body[key] !== undefined) updates[key] = body[key];
  }
  // Only update token if it's a real new value (not the masked placeholder)
  if (body.meta_access_token && !body.meta_access_token.includes("•")) {
    updates.meta_access_token = body.meta_access_token;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { error } = await supabase!.from("clients").update(updates).eq("id", clientId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data: { success: true } });
}
