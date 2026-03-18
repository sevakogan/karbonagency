/**
 * /api/meta/clients-overview
 *
 * GET — Returns all clients with their Meta ad status for the agency dashboard.
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdminSupabase();

  // Validate session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  // Fetch all clients
  const { data: clients, error: clientsError } = await supabase
    .from("clients")
    .select(
      "id, name, company_name, logo_url, is_active, meta_ad_account_id, contact_email, contact_phone"
    )
    .order("name");

  if (clientsError) {
    return NextResponse.json({ error: clientsError.message }, { status: 500 });
  }

  // For each client, get campaign counts from the DB (fast — no Meta API calls)
  const clientIds = (clients ?? []).map((c) => c.id);

  const { data: campaignStats } = await supabase
    .from("campaigns")
    .select("client_id, status")
    .in("client_id", clientIds);

  // Build a map: clientId → { total, active }
  const statsMap: Record<string, { total: number; active: number }> = {};
  for (const row of campaignStats ?? []) {
    if (!statsMap[row.client_id]) statsMap[row.client_id] = { total: 0, active: 0 };
    statsMap[row.client_id].total += 1;
    if (row.status === "active") statsMap[row.client_id].active += 1;
  }

  const overview = (clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    company_name: c.company_name ?? null,
    logo_url: c.logo_url ?? null,
    is_active: c.is_active ?? true,
    meta_connected: Boolean(c.meta_ad_account_id),
    meta_ad_account_id: c.meta_ad_account_id ?? null,
    active_campaigns: statsMap[c.id]?.active ?? 0,
    total_campaigns: statsMap[c.id]?.total ?? 0,
    contact_email: c.contact_email ?? null,
    contact_phone: c.contact_phone ?? null,
  }));

  return NextResponse.json({ data: overview });
}
