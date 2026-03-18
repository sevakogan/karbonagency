/**
 * /api/meta/reach-estimate
 *
 * POST — get reach estimate for a targeting spec
 *
 * Body: { targeting: {...}, optimization_goal?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import { getReachEstimate, type OptimizationGoal } from "@/lib/meta-api-write";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdminSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  const url = new URL(request.url);
  const clientId = url.searchParams.get("client_id");

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  const resolvedClientId = clientId ?? profile?.client_id;

  const { data: client } = await supabase
    .from("clients")
    .select("meta_ad_account_id")
    .eq("id", resolvedClientId)
    .single();

  if (!client?.meta_ad_account_id) {
    return NextResponse.json({ error: "No Meta Ad Account configured" }, { status: 404 });
  }

  let body: { targeting: Record<string, unknown>; optimization_goal?: OptimizationGoal };
  try {
    body = (await request.json()) as { targeting: Record<string, unknown>; optimization_goal?: OptimizationGoal };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.targeting) {
    return NextResponse.json({ error: "targeting spec required" }, { status: 400 });
  }

  try {
    const estimate = await getReachEstimate(
      client.meta_ad_account_id,
      body.targeting,
      body.optimization_goal ?? "OFFSITE_CONVERSIONS"
    );
    return NextResponse.json({ data: estimate });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
