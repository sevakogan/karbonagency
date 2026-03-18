/**
 * /api/meta/adsets
 *
 * GET    — list ad sets for a campaign (pass ?campaign_id=xxx) or account
 * POST   — create ad set (defaults to PAUSED)
 * PATCH  — update ad set (?adset_id=xxx)
 * DELETE — delete ad set (?adset_id=xxx)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  listAdSets,
  listAdSetsForAccount,
  createAdSet,
  updateAdSet,
  deleteAdSet,
  type CreateAdSetInput,
  type UpdateAdSetInput,
} from "@/lib/meta-api-write";

async function getAdAccountId(request: NextRequest): Promise<
  | { adAccountId: string; error: null }
  | { adAccountId: null; error: NextResponse }
> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { adAccountId: null, error: NextResponse.json({ error: "Authorization required" }, { status: 401 }) };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdminSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { adAccountId: null, error: NextResponse.json({ error: "Invalid session" }, { status: 401 }) };
  }

  const url = new URL(request.url);
  const clientId = url.searchParams.get("client_id");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", user.id)
    .single();

  const resolvedClientId = clientId ?? profile?.client_id;
  if (!resolvedClientId) {
    return { adAccountId: null, error: NextResponse.json({ error: "client_id required" }, { status: 400 }) };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("meta_ad_account_id")
    .eq("id", resolvedClientId)
    .single();

  if (!client?.meta_ad_account_id) {
    return { adAccountId: null, error: NextResponse.json({ error: "No Meta Ad Account configured" }, { status: 404 }) };
  }

  return { adAccountId: client.meta_ad_account_id, error: null };
}

export async function GET(request: NextRequest) {
  const auth = await getAdAccountId(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaign_id");

  try {
    const adSets = campaignId
      ? await listAdSets(campaignId)
      : await listAdSetsForAccount(auth.adAccountId);
    return NextResponse.json({ data: adSets, count: adSets.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAdAccountId(request);
  if (auth.error) return auth.error;

  let body: CreateAdSetInput;
  try {
    body = (await request.json()) as CreateAdSetInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.campaign_id || !body.name || !body.optimization_goal || !body.billing_event || !body.targeting) {
    return NextResponse.json(
      { error: "campaign_id, name, optimization_goal, billing_event, and targeting are required" },
      { status: 400 }
    );
  }

  // Safety: always default to PAUSED
  body.status = body.status ?? "PAUSED";

  try {
    const result = await createAdSet(auth.adAccountId, body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await getAdAccountId(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const adSetId = url.searchParams.get("adset_id");
  if (!adSetId) {
    return NextResponse.json({ error: "adset_id query parameter required" }, { status: 400 });
  }

  let body: UpdateAdSetInput;
  try {
    body = (await request.json()) as UpdateAdSetInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const result = await updateAdSet(adSetId, body);
    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await getAdAccountId(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const adSetId = url.searchParams.get("adset_id");
  if (!adSetId) {
    return NextResponse.json({ error: "adset_id query parameter required" }, { status: 400 });
  }

  try {
    const result = await deleteAdSet(adSetId);
    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
