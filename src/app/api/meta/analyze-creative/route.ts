/**
 * /api/meta/analyze-creative
 *
 * POST — Analyze an uploaded ad creative using Claude Sonnet 4.6 vision.
 *         Accepts: { imageUrl: string, campaignContext: object }
 *         Returns: AI creative recommendations for Meta ads.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-6";

async function authenticate(request: NextRequest): Promise<{ userId: string | null; error: NextResponse | null }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { userId: null, error: NextResponse.json({ error: "Authorization required" }, { status: 401 }) };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdminSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { userId: null, error: NextResponse.json({ error: "Invalid session" }, { status: 401 }) };
  }
  return { userId: user.id, error: null };
}

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured in Vercel environment variables." },
      { status: 500 }
    );
  }

  const { userId, error } = await authenticate(request);
  if (error || !userId) return error!;

  let body: {
    imageUrl?: string;
    imageBase64?: string;
    mediaType?: string;
    campaignContext?: {
      name?: string;
      objective?: string;
      headline?: string;
      primaryText?: string;
      callToAction?: string;
      targetAudience?: string;
    };
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.imageUrl && !body.imageBase64) {
    return NextResponse.json({ error: "Provide imageUrl or imageBase64" }, { status: 400 });
  }

  const ctx = body.campaignContext || {};

  const systemPrompt = `You are a senior Meta Ads creative strategist with expertise in Facebook and Instagram advertising. You analyze ad creative assets and provide actionable, specific recommendations to improve performance.

You're reviewing creatives for **Shift Arcade Miami** — a premium sim racing simulator venue in Wynwood, Miami.
- Target: Racing enthusiasts, F1 fans, gamers, date-night seekers, age 21–45, within 25 miles of Miami
- Goal: Drive bookings via OUTCOME_SALES campaigns
- Platforms: Facebook Feed, Instagram Feed, Stories, Reels

Provide structured feedback: what works, what to fix, and specific copy/design suggestions.`;

  const userContent: Array<{ type: string; [key: string]: unknown }> = [];

  // Add image
  if (body.imageBase64) {
    userContent.push({
      type: "image",
      source: {
        type: "base64",
        media_type: body.mediaType || "image/jpeg",
        data: body.imageBase64,
      },
    });
  } else if (body.imageUrl) {
    userContent.push({
      type: "image",
      source: {
        type: "url",
        url: body.imageUrl,
      },
    });
  }

  // Add text prompt with context
  userContent.push({
    type: "text",
    text: `Please analyze this ad creative for a Meta advertising campaign.

**Campaign Context:**
- Campaign: ${ctx.name || "Shift Arcade Miami"}
- Objective: ${ctx.objective || "OUTCOME_SALES (Conversions)"}
- Headline: "${ctx.headline || "Not specified"}"
- Primary Text: "${ctx.primaryText || "Not specified"}"
- Call to Action: ${ctx.callToAction || "BOOK_NOW"}
- Target Audience: ${ctx.targetAudience || "Sim racing fans, F1 enthusiasts, date-night seekers, age 21-45, Miami area"}

**Please provide:**

1. **🎯 Overall Score** (1–10) — How effective is this creative for the campaign goal?

2. **✅ What Works** — Specific elements that are strong (hook, colors, composition, energy, etc.)

3. **⚠️ What to Fix** — Specific issues to address (text clutter, aspect ratio, contrast, missing urgency, etc.)

4. **📐 Technical Check**
   - Correct for Facebook Feed? (1.91:1 or 1:1)
   - Correct for Instagram Feed? (1:1 or 4:5)
   - Correct for Stories/Reels? (9:16)
   - Text overlay <20% of image area? (Meta penalizes heavy text)

5. **💡 Specific Improvements** — 3 concrete, actionable changes to test

6. **📝 Suggested Copy Tweak** — If the headline or text could be improved, suggest the exact new wording

7. **🎬 If this were a video** — How would you adapt it? What motion/music/hook would work?

Be direct, specific, and practical. Think like a media buyer who needs to ship this tomorrow.`,
  });

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({ error: `AI analysis failed: ${errText}` }, { status: 500 });
    }

    const data = await res.json() as {
      content: Array<{ type: string; text?: string }>;
    };

    const analysis = data.content.find((b) => b.type === "text")?.text ?? "No analysis returned.";

    return NextResponse.json({
      data: {
        analysis,
        model: CLAUDE_MODEL,
        analyzed_at: new Date().toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
