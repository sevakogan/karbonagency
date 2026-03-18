/**
 * /api/meta/chat
 *
 * POST — AI chat using Claude Sonnet 4.6 with Meta Ads management tools.
 * The model can list campaigns, update statuses/budgets, push drafts, etc.
 *
 * Body: { messages: [{role: "user"|"assistant", content: string}] }
 * Headers: Authorization: Bearer <supabase-token>
 * Query: ?client_id=<uuid>  (optional — auto-resolved for admins)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  listCampaigns,
  listAdSetsForAccount,
  updateCampaign,
  createCampaign,
  createAdSet,
  SHIFT_ARCADE_DRAFT_CAMPAIGNS,
} from "@/lib/meta-api-write";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-6";

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert Meta Ads Manager AI for Karbon Agency — specifically managing paid social campaigns for Shift Arcade Miami, a premium sim racing simulator venue in Wynwood, Miami.

You have direct tool access to Meta Marketing API v25.0 to read and manage this account in real time.

## About Shift Arcade Miami
- Premium Formula 1 / GT3 / IndyCar simulator experiences in Wynwood
- Target: enthusiasts aged 21–45, within 15–25 miles of Miami
- Best historical performer: North Miami Beach cold audience → $5.03/purchase
- Critical account gap: ZERO retargeting campaigns have ever run
- Optimal objective: OUTCOME_SALES (conversions), not awareness
- High-intent windows: Friday–Sunday (weekend venue)
- Booking URL: https://shiftarcade.miami/book

## Available Draft Campaigns (5 pre-built, ready to push)
1. **draft-north-miami-beach-conversions** — $10/day · Best historical performer · F1/racing fans · North Miami Beach 15mi
2. **draft-miami-cold-retargeting** — $5/day · CRITICAL missing funnel · Website visitors 30 days · All Miami metro
3. **draft-lookalike-past-purchasers** — $10/day · 1% LAL from pixel purchasers · Scale via Meta AI
4. **draft-capi-retest-fort-lauderdale** — $8/day · Expand geo · CAPI server-side tracking
5. **draft-wynwood-awareness-video** — $12/day · Brand video · Broad local audience

## Your Capabilities
- List and review live campaigns and ad sets
- Pause campaigns (safe)
- Activate campaigns (REQUIRE explicit user confirmation — state spend implications)
- Update daily budgets (state dollar impact)
- Push draft campaigns to Meta as PAUSED structures
- Provide strategic recommendations

## Safety Rules
- NEVER activate (ACTIVE status) a campaign without first explaining what will happen and asking for confirmation
- When updating a budget, always quote both the old and new $ amount
- When pushing a draft, confirm it will be PAUSED and state the budget
- Budget is in CENTS: 1000 = $10.00, 500 = $5.00, 2000 = $20.00
- Be specific, concise, and strategic — you're talking to a media buyer

Format campaign IDs clearly. Use markdown formatting (bold, lists) for readability. Keep responses focused and actionable.`;

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: "list_campaigns",
    description:
      "List all Meta campaigns for this ad account. Returns campaign IDs, names, status, daily budget, objective, and effective status.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list_adsets",
    description:
      "List all ad sets across the account. Returns ad set IDs, names, status, campaign IDs, optimization goal, and targeting summary.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "get_account_summary",
    description:
      "Get a high-level summary: total campaigns, active vs paused count, total active daily spend, and a strategic assessment.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "update_campaign_status",
    description:
      "Update a campaign's status to PAUSED or ACTIVE. For ACTIVE, this will start spending — only use when user has explicitly confirmed.",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: {
          type: "string",
          description: "Meta campaign ID (numeric string like '120213...')",
        },
        status: {
          type: "string",
          enum: ["PAUSED", "ACTIVE"],
          description: "New status",
        },
      },
      required: ["campaign_id", "status"],
    },
  },
  {
    name: "update_campaign_budget",
    description:
      "Update the daily budget of a campaign. Budget must be in cents (1000 = $10.00). State the old and new amounts when responding.",
    input_schema: {
      type: "object",
      properties: {
        campaign_id: {
          type: "string",
          description: "Meta campaign ID",
        },
        daily_budget_cents: {
          type: "number",
          description: "New daily budget in cents (e.g. 2000 for $20.00)",
        },
      },
      required: ["campaign_id", "daily_budget_cents"],
    },
  },
  {
    name: "push_draft_campaign",
    description:
      "Push one of the 5 pre-built Shift Arcade draft campaigns to Meta Ads Manager as a PAUSED campaign + ad set structure. Nothing spends until manually activated.",
    input_schema: {
      type: "object",
      properties: {
        draft_id: {
          type: "string",
          enum: [
            "draft-north-miami-beach-conversions",
            "draft-miami-cold-retargeting",
            "draft-lookalike-past-purchasers",
            "draft-capi-retest-fort-lauderdale",
            "draft-wynwood-awareness-video",
          ],
          description: "Draft campaign ID to push",
        },
        override_budget_cents: {
          type: "number",
          description:
            "Optional: override the default daily budget in cents",
        },
        override_name: {
          type: "string",
          description: "Optional: override the default campaign name",
        },
      },
      required: ["draft_id"],
    },
  },
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> };

interface AnthropicResponse {
  stop_reason: "end_turn" | "tool_use" | string;
  content: ContentBlock[];
}

type Message = {
  role: "user" | "assistant";
  content: string | ContentBlock[] | Array<{ type: "tool_result"; tool_use_id: string; content: string }>;
};

// ---------------------------------------------------------------------------
// Tool executor
// ---------------------------------------------------------------------------

async function executeTool(
  name: string,
  input: Record<string, unknown>,
  adAccountId: string,
  pixelId: string | null
): Promise<string> {
  switch (name) {
    case "list_campaigns": {
      const campaigns = await listCampaigns(adAccountId);
      return JSON.stringify(campaigns, null, 2);
    }

    case "list_adsets": {
      const adsets = await listAdSetsForAccount(adAccountId);
      return JSON.stringify(adsets, null, 2);
    }

    case "get_account_summary": {
      const campaigns = await listCampaigns(adAccountId);
      const active = campaigns.filter(
        (c) => c.status === "ACTIVE" || c.effective_status === "ACTIVE"
      );
      const paused = campaigns.filter((c) => c.status === "PAUSED");
      const totalBudgetCents = active.reduce(
        (sum, c) => sum + (Number(c.daily_budget) || 0),
        0
      );
      return JSON.stringify(
        {
          total_campaigns: campaigns.length,
          active: active.length,
          paused: paused.length,
          total_active_daily_spend: `$${(totalBudgetCents / 100).toFixed(2)}/day`,
          campaigns: campaigns.map((c) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            effective_status: c.effective_status,
            daily_budget: c.daily_budget
              ? `$${(Number(c.daily_budget) / 100).toFixed(2)}`
              : "N/A",
            objective: c.objective,
          })),
        },
        null,
        2
      );
    }

    case "update_campaign_status": {
      const result = await updateCampaign(input.campaign_id as string, {
        status: input.status as "PAUSED" | "ACTIVE",
      });
      return JSON.stringify(result, null, 2);
    }

    case "update_campaign_budget": {
      const result = await updateCampaign(input.campaign_id as string, {
        daily_budget: input.daily_budget_cents as number,
      });
      return JSON.stringify(result, null, 2);
    }

    case "push_draft_campaign": {
      const draft = SHIFT_ARCADE_DRAFT_CAMPAIGNS.find(
        (d) => d.id === input.draft_id
      );
      if (!draft) {
        return JSON.stringify({ error: `Draft '${input.draft_id}' not found` });
      }

      const campaignInput = {
        ...draft.campaign,
        status: "PAUSED" as const,
        ...(input.override_budget_cents
          ? { daily_budget: input.override_budget_cents as number }
          : {}),
        ...(input.override_name ? { name: input.override_name as string } : {}),
      };

      const campaignResult = await createCampaign(adAccountId, campaignInput);

      const adSetInput = {
        ...draft.adSet,
        campaign_id: campaignResult.id,
        status: "PAUSED" as const,
        promoted_object:
          pixelId && draft.adSet.promoted_object
            ? { ...draft.adSet.promoted_object, pixel_id: pixelId }
            : draft.adSet.promoted_object,
      };

      const adSetResult = await createAdSet(adAccountId, adSetInput);

      return JSON.stringify(
        {
          success: true,
          campaign_id: campaignResult.id,
          adset_id: adSetResult.id,
          status: "PAUSED",
          name: campaignInput.name,
          daily_budget: `$${((campaignInput.daily_budget || 0) / 100).toFixed(2)}/day`,
          message: "Campaign and ad set created in Meta as PAUSED. Nothing will spend until you manually activate.",
        },
        null,
        2
      );
    }

    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` });
  }
}

// ---------------------------------------------------------------------------
// Anthropic API loop (handles multi-step tool use)
// ---------------------------------------------------------------------------

async function runClaude(
  messages: Message[],
  adAccountId: string,
  pixelId: string | null
): Promise<string> {
  const currentMessages: Message[] = [...messages];
  const MAX_ROUNDS = 6;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: currentMessages,
        tools: TOOLS,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Anthropic API ${res.status}: ${errText}`);
    }

    const data = (await res.json()) as AnthropicResponse;

    if (data.stop_reason === "end_turn") {
      const textBlock = data.content.find((b) => b.type === "text") as
        | { type: "text"; text: string }
        | undefined;
      return textBlock?.text ?? "Done.";
    }

    if (data.stop_reason === "tool_use") {
      // Append assistant turn
      currentMessages.push({ role: "assistant", content: data.content });

      // Execute all tool calls in parallel
      const toolBlocks = data.content.filter(
        (b) => b.type === "tool_use"
      ) as Array<{ type: "tool_use"; id: string; name: string; input: Record<string, unknown> }>;

      const results = await Promise.all(
        toolBlocks.map(async (block) => {
          let content: string;
          try {
            content = await executeTool(
              block.name,
              block.input,
              adAccountId,
              pixelId
            );
          } catch (err) {
            content = JSON.stringify({
              error: err instanceof Error ? err.message : "Tool execution failed",
            });
          }
          return { type: "tool_result" as const, tool_use_id: block.id, content };
        })
      );

      currentMessages.push({ role: "user", content: results });
      continue;
    }

    // Unexpected stop reason — extract any text and return
    const textBlock = data.content.find((b) => b.type === "text") as
      | { type: "text"; text: string }
      | undefined;
    return textBlock?.text ?? "Unexpected response from AI.";
  }

  return "Maximum processing rounds reached. Please rephrase your request.";
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "ANTHROPIC_API_KEY is not configured. Add it in Vercel → Settings → Environment Variables.",
      },
      { status: 500 }
    );
  }

  // Auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const supabase = getAdminSupabase();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Resolve client
  const url = new URL(request.url);
  const clientIdParam = url.searchParams.get("client_id");

  const { data: profile } = await supabase
    .from("profiles")
    .select("client_id")
    .eq("id", user.id)
    .single();

  let finalClientId = clientIdParam ?? profile?.client_id ?? null;

  if (!finalClientId) {
    // Admin fallback — pick first client with a Meta account
    const { data: firstClient } = await supabase
      .from("clients")
      .select("id")
      .not("meta_ad_account_id", "is", null)
      .limit(1)
      .single();
    finalClientId = firstClient?.id ?? null;
  }

  if (!finalClientId) {
    return NextResponse.json({ error: "No client found" }, { status: 400 });
  }

  const { data: client } = await supabase
    .from("clients")
    .select("meta_ad_account_id, meta_pixel_id")
    .eq("id", finalClientId)
    .single();

  if (!client?.meta_ad_account_id) {
    return NextResponse.json(
      { error: "No Meta Ad Account configured for this client" },
      { status: 404 }
    );
  }

  // Parse body
  let body: { messages: Message[] };
  try {
    body = (await request.json()) as { messages: Message[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages array required" }, { status: 400 });
  }

  // Run Claude
  try {
    const reply = await runClaude(
      body.messages,
      client.meta_ad_account_id,
      client.meta_pixel_id ?? null
    );
    return NextResponse.json({ reply });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[meta/chat] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
