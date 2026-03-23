/**
 * /api/meta/competitors
 *
 * GET  — Returns AI-identified competitors for Shift Arcade Miami
 *         + searches Meta Ad Library for their active ads.
 *
 * POST — Search Meta Ad Library by keyword / city / company name.
 *         Body: { query: string, country?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

const META_GRAPH_URL = "https://graph.facebook.com/v25.0";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// ---------------------------------------------------------------------------
// Known Shift Arcade competitors (AI-curated, Miami market)
// ---------------------------------------------------------------------------
const KNOWN_COMPETITORS = [
  { name: "K1 Speed Miami", category: "Racing / Go-Karts", location: "Doral, FL", searchTerms: ["K1 Speed", "K1Speed Miami"] },
  { name: "DriveZone", category: "Sim Racing", location: "Boca Raton, FL", searchTerms: ["DriveZone", "sim racing Boca Raton"] },
  { name: "Andretti Karting Miami", category: "Racing Experience", location: "Miami, FL", searchTerms: ["Andretti Karting", "Andretti Miami"] },
  { name: "Dave & Buster's Miami", category: "Entertainment / Gaming", location: "Miami, FL", searchTerms: ["Dave Busters Miami", "Dave & Buster's"] },
  { name: "Topgolf Miami", category: "Entertainment Experience", location: "Doral, FL", searchTerms: ["Topgolf Miami"] },
  { name: "iRace Miami", category: "Sim Racing", location: "Miami, FL", searchTerms: ["iRace Miami", "sim racing Miami"] },
  { name: "Main Event Miami", category: "Entertainment / Bowling", location: "Miami, FL", searchTerms: ["Main Event Miami"] },
  { name: "Bowlero Miami", category: "Entertainment", location: "Miami, FL", searchTerms: ["Bowlero Miami", "bowling Miami"] },
  { name: "Virtual Reality Miami", category: "VR / Immersive Tech", location: "Miami, FL", searchTerms: ["VR Miami", "virtual reality Miami"] },
  { name: "F1 Arcade (US Expansion)", category: "Sim Racing Bar", location: "Multiple US Cities", searchTerms: ["F1 Arcade", "F1 bar simulator"] },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
async function authenticate(request: NextRequest): Promise<{ ok: boolean; error: NextResponse | null }> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { ok: false, error: NextResponse.json({ error: "Authorization required" }, { status: 401 }) };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdminSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { ok: false, error: NextResponse.json({ error: "Invalid session" }, { status: 401 }) };
  }
  return { ok: true, error: null };
}

async function searchAdLibrary(
  searchTerm: string,
  accessToken: string,
  country = "US"
): Promise<Array<{
  id: string;
  page_name: string;
  ad_creative_link_captions?: string[];
  ad_creative_bodies?: string[];
  ad_delivery_start_time?: string;
  currency?: string;
  spend?: { lower_bound: string; upper_bound: string };
  impressions?: { lower_bound: string; upper_bound: string };
  ad_snapshot_url?: string;
}>> {
  const fields = "id,page_name,ad_creative_link_captions,ad_creative_bodies,ad_delivery_start_time,currency,spend,impressions,ad_snapshot_url";
  const url = `${META_GRAPH_URL}/ads_archive?search_terms=${encodeURIComponent(searchTerm)}&ad_reached_countries=${country}&ad_type=ALL&fields=${fields}&limit=5&access_token=${encodeURIComponent(accessToken)}`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json() as { data?: unknown[] };
    return (data.data || []) as ReturnType<typeof searchAdLibrary> extends Promise<infer T> ? T : never;
  } catch {
    return [];
  }
}

async function generateCompetitorInsights(
  competitors: Array<{ name: string; ads: unknown[] }>
): Promise<string> {
  if (!ANTHROPIC_API_KEY) return "";

  const summary = competitors.map((c) => `${c.name}: ${c.ads.length} active ads found`).join("\n");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `You're analyzing Meta ad activity for competitors of Shift Arcade Miami (premium sim racing venue, Wynwood).

Competitors found:
${summary}

Give a brief strategic analysis (3-4 bullet points max):
1. Who is most actively advertising on Meta?
2. What gaps/opportunities exist for Shift Arcade?
3. What messaging angle differentiates Shift Arcade from these competitors?
4. One specific recommendation for Shift Arcade's Meta strategy based on this competitive landscape.

Be concise and actionable. Focus on what matters for a $45/day ad budget.`,
      }],
    }),
  });

  if (!res.ok) return "";
  const data = await res.json() as { content: Array<{ type: string; text?: string }> };
  return data.content.find((b) => b.type === "text")?.text || "";
}

// ---------------------------------------------------------------------------
// GET — Auto-load 10 known competitors
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  const { ok, error } = await authenticate(request);
  if (!ok) return error!;

  // Get access token from env or client config
  const accessToken = (process.env.META_ACCESS_TOKEN ?? process.env.META_CAPI_ACCESS_TOKEN) || "";

  const results = await Promise.all(
    KNOWN_COMPETITORS.map(async (competitor) => {
      let ads: unknown[] = [];
      if (accessToken) {
        // Try first search term
        ads = await searchAdLibrary(competitor.searchTerms[0], accessToken);
        // Try second if none found
        if (ads.length === 0 && competitor.searchTerms[1]) {
          ads = await searchAdLibrary(competitor.searchTerms[1], accessToken);
        }
      }
      return {
        ...competitor,
        ads,
        isAdvertising: ads.length > 0,
        adCount: ads.length,
      };
    })
  );

  // Generate AI insights on the competitive landscape
  const insights = await generateCompetitorInsights(
    results.map((r) => ({ name: r.name, ads: r.ads }))
  );

  return NextResponse.json({
    data: {
      competitors: results,
      insights,
      note: !accessToken
        ? "Meta Ad Library access requires your access token. Results show competitor profiles only. Add META_ACCESS_TOKEN to Vercel env vars for live ad data."
        : null,
    },
  });
}

// ---------------------------------------------------------------------------
// POST — Manual search
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  const { ok, error } = await authenticate(request);
  if (!ok) return error!;

  let body: { query: string; country?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.query?.trim()) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }

  const accessToken = (process.env.META_ACCESS_TOKEN ?? process.env.META_CAPI_ACCESS_TOKEN) || "";
  const ads = accessToken
    ? await searchAdLibrary(body.query, accessToken, body.country || "US")
    : [];

  // Generate AI context for the searched competitor
  let aiContext = "";
  if (ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: `Briefly describe "${body.query}" as a potential competitor to Shift Arcade Miami (premium sim racing venue). Is it a direct or indirect competitor? What marketing angles might they use? How should Shift Arcade position against them? 2-3 sentences max.`,
        }],
      }),
    });
    if (res.ok) {
      const data = await res.json() as { content: Array<{ type: string; text?: string }> };
      aiContext = data.content.find((b) => b.type === "text")?.text || "";
    }
  }

  return NextResponse.json({
    data: {
      query: body.query,
      ads,
      adCount: ads.length,
      isAdvertising: ads.length > 0,
      aiContext,
      note: !accessToken ? "Add META_ACCESS_TOKEN to Vercel env vars to see live ad library results." : null,
    },
  });
}
