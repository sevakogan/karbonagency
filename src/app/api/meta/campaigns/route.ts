/**
 * /api/meta/campaigns
 *
 * GET  — list all campaigns for a client's ad account
 * POST — create a new campaign (defaults to PAUSED)
 *
 * /api/meta/campaigns?campaign_id=xxx  (for single-resource ops)
 * PATCH  — update a campaign (status, budget, name)
 * DELETE — delete a campaign
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  listCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  toggleCampaignStatus,
  type CreateCampaignInput,
  type UpdateCampaignInput,
} from "@/lib/meta-api-write";

// ---------------------------------------------------------------------------
// Auth helpers (reused pattern from /api/meta/route.ts)
// ---------------------------------------------------------------------------

async function authenticateAndGetAccount(
  request: NextRequest
): Promise<
  | { userId: string; adAccountId: string; error: null }
  | { userId: null; adAccountId: null; error: NextResponse }
> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      userId: null,
      adAccountId: null,
      error: NextResponse.json({ error: "Authorization header required" }, { status: 401 }),
    };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdminSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      userId: null,
      adAccountId: null,
      error: NextResponse.json({ error: "Invalid or expired session" }, { status: 401 }),
    };
  }

  // Get client_id from query or body; fall back to user's own client
  const url = new URL(request.url);
  const clientId = url.searchParams.get("client_id");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return {
      userId: null,
      adAccountId: null,
      error: NextResponse.json({ error: "User profile not found" }, { status: 403 }),
    };
  }

  const resolvedClientId = clientId ?? profile.client_id;

  // Client users can only access their own data
  if (profile.role === "client" && profile.client_id !== resolvedClientId) {
    return {
      userId: null,
      adAccountId: null,
      error: NextResponse.json({ error: "Access denied" }, { status: 403 }),
    };
  }

  if (!resolvedClientId) {
    return {
      userId: null,
      adAccountId: null,
      error: NextResponse.json({ error: "client_id required" }, { status: 400 }),
    };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("meta_ad_account_id")
    .eq("id", resolvedClientId)
    .single();

  if (!client?.meta_ad_account_id) {
    return {
      userId: null,
      adAccountId: null,
      error: NextResponse.json({ error: "Client has no Meta Ad Account configured" }, { status: 404 }),
    };
  }

  return { userId: user.id, adAccountId: client.meta_ad_account_id, error: null };
}

// ---------------------------------------------------------------------------
// GET — list campaigns
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const auth = await authenticateAndGetAccount(request);
  if (auth.error) return auth.error;

  try {
    const campaigns = await listCampaigns(auth.adAccountId);
    return NextResponse.json({ data: campaigns, count: campaigns.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create campaign
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await authenticateAndGetAccount(request);
  if (auth.error) return auth.error;

  let body: CreateCampaignInput;
  try {
    body = (await request.json()) as CreateCampaignInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || !body.objective) {
    return NextResponse.json({ error: "name and objective are required" }, { status: 400 });
  }

  // Safety: always default to PAUSED — never auto-launch
  body.status = body.status ?? "PAUSED";

  try {
    const result = await createCampaign(auth.adAccountId, body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update campaign
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const auth = await authenticateAndGetAccount(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaign_id");

  if (!campaignId) {
    return NextResponse.json({ error: "campaign_id query parameter required" }, { status: 400 });
  }

  let body: UpdateCampaignInput & { action?: "toggle" };
  try {
    body = (await request.json()) as UpdateCampaignInput & { action?: "toggle" };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Special toggle action
    if (body.action === "toggle" && body.status) {
      const result = await toggleCampaignStatus(campaignId, body.status as "ACTIVE" | "PAUSED");
      return NextResponse.json({ data: result });
    }

    const result = await updateCampaign(campaignId, body);
    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete campaign
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const auth = await authenticateAndGetAccount(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const campaignId = url.searchParams.get("campaign_id");

  if (!campaignId) {
    return NextResponse.json({ error: "campaign_id query parameter required" }, { status: 400 });
  }

  try {
    const result = await deleteCampaign(campaignId);
    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
