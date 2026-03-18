/**
 * /api/meta/drafts
 *
 * GET — return pre-built draft campaign templates for Shift Arcade Miami
 *       (and any client with similar entertainment/experience profiles)
 *
 * POST — "launch" a draft into Meta as a PAUSED campaign structure
 *         (creates campaign + ad set in Meta — everything stays PAUSED)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  SHIFT_ARCADE_DRAFT_CAMPAIGNS,
  createCampaign,
  createAdSet,
} from "@/lib/meta-api-write";

async function authenticateRequest(request: NextRequest): Promise<
  | { userId: string; adAccountId: string; pixelId: string | null; pageId: string | null; error: null }
  | { userId: null; adAccountId: null; pixelId: null; pageId: null; error: NextResponse }
> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { userId: null, adAccountId: null, pixelId: null, pageId: null, error: NextResponse.json({ error: "Authorization required" }, { status: 401 }) };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdminSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { userId: null, adAccountId: null, pixelId: null, pageId: null, error: NextResponse.json({ error: "Invalid session" }, { status: 401 }) };
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
    return { userId: null, adAccountId: null, pixelId: null, pageId: null, error: NextResponse.json({ error: "client_id required" }, { status: 400 }) };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("meta_ad_account_id, meta_pixel_id, meta_page_id")
    .eq("id", resolvedClientId)
    .single();

  if (!client?.meta_ad_account_id) {
    return { userId: null, adAccountId: null, pixelId: null, pageId: null, error: NextResponse.json({ error: "No Meta Ad Account configured" }, { status: 404 }) };
  }

  return {
    userId: user.id,
    adAccountId: client.meta_ad_account_id,
    pixelId: client.meta_pixel_id ?? null,
    pageId: client.meta_page_id ?? null,
    error: null,
  };
}

// ---------------------------------------------------------------------------
// GET — list draft templates
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const draftId = url.searchParams.get("draft_id");

  if (draftId) {
    const draft = SHIFT_ARCADE_DRAFT_CAMPAIGNS.find((d) => d.id === draftId);
    if (!draft) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }
    return NextResponse.json({ data: draft });
  }

  return NextResponse.json({
    data: SHIFT_ARCADE_DRAFT_CAMPAIGNS,
    count: SHIFT_ARCADE_DRAFT_CAMPAIGNS.length,
    meta: {
      note: "All campaigns are PAUSED by default. Nothing launches automatically.",
      best_first_campaign: "draft-north-miami-beach-conversions",
      total_daily_budget_if_all_launched: "$45/day ($10 starter + $35 supporting)",
    },
  });
}

// ---------------------------------------------------------------------------
// POST — push draft to Meta as PAUSED campaign structure
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (auth.error) return auth.error;

  let body: { draft_id: string; override_budget?: number; override_name?: string };
  try {
    body = (await request.json()) as { draft_id: string; override_budget?: number; override_name?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.draft_id) {
    return NextResponse.json({ error: "draft_id required" }, { status: 400 });
  }

  const draft = SHIFT_ARCADE_DRAFT_CAMPAIGNS.find((d) => d.id === body.draft_id);
  if (!draft) {
    return NextResponse.json({ error: `Draft '${body.draft_id}' not found` }, { status: 404 });
  }

  try {
    // 1. Create campaign (PAUSED)
    const campaignInput = {
      ...draft.campaign,
      status: "PAUSED" as const, // Always PAUSED — explicit safety
      name: body.override_name ?? draft.campaign.name,
      daily_budget: body.override_budget ?? draft.campaign.daily_budget,
    };

    const campaignResult = await createCampaign(auth.adAccountId, campaignInput);

    // 2. Create ad set (PAUSED), inject campaign_id and pixel_id
    const adSetInput = {
      ...draft.adSet,
      campaign_id: campaignResult.id,
      status: "PAUSED" as const,
      promoted_object: auth.pixelId
        ? { ...draft.adSet.promoted_object, pixel_id: auth.pixelId }
        : draft.adSet.promoted_object,
    };

    const adSetResult = await createAdSet(auth.adAccountId, adSetInput);

    return NextResponse.json({
      data: {
        campaign_id: campaignResult.id,
        adset_id: adSetResult.id,
        status: "PAUSED",
        draft_id: draft.id,
        name: campaignInput.name,
        creative_spec: draft.creativeSpec,
        next_steps: [
          "Upload creative assets (image or video)",
          "Create ad creative using /api/meta/creatives",
          "Create ad using /api/meta/ads (will also be PAUSED)",
          "Review everything in Meta Ads Manager",
          "When ready to launch: PATCH /api/meta/campaigns?campaign_id=" + campaignResult.id + " with status=ACTIVE",
        ],
        notes: draft.notes,
      },
      message: `Draft campaign and ad set created in Meta as PAUSED. Campaign ID: ${campaignResult.id}`,
    }, { status: 201 });

  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
