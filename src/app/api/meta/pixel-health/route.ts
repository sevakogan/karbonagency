/**
 * /api/meta/pixel-health
 *
 * GET — Returns CAPI signal strength for the client's pixel:
 *   - Event counts per event name (PageView, Purchase, etc.)
 *   - Match quality score (0–10)
 *   - Recommendations to improve to 10/10
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

const META_GRAPH_URL = "https://graph.facebook.com/v25.0";

// ---------------------------------------------------------------------------
// Auth helper (same pattern as other routes)
// ---------------------------------------------------------------------------

async function authenticateRequest(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Authorization required" }, { status: 401 }), client: null };
  }
  const token = authHeader.replace("Bearer ", "");

  // CRON_SECRET shortcut — return env-based client config
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && token === cronSecret) {
    return {
      error: null,
      client: {
        meta_ad_account_id: process.env.META_AD_ACCOUNT_ID ?? null,
        meta_pixel_id: process.env.META_PIXEL_ID ?? process.env.META_CAPI_PIXEL_ID ?? null,
        meta_access_token: process.env.META_ACCESS_TOKEN ?? process.env.META_CAPI_ACCESS_TOKEN ?? null,
      },
      token,
    };
  }

  const supabase = getAdminSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { error: NextResponse.json({ error: "Invalid session" }, { status: 401 }), client: null };
  }

  const url = new URL(request.url);
  const clientIdParam = url.searchParams.get("client_id");
  const { data: profile } = await supabase.from("profiles").select("client_id").eq("id", user.id).single();

  let finalClientId = clientIdParam ?? profile?.client_id ?? null;
  if (!finalClientId) {
    const { data: firstClient } = await supabase
      .from("clients").select("id").not("meta_ad_account_id", "is", null).limit(1).single();
    finalClientId = firstClient?.id ?? null;
  }

  if (!finalClientId) {
    return { error: NextResponse.json({ error: "No client found" }, { status: 400 }), client: null };
  }

  // Select only the base column first — pixel_id and access_token may not exist yet
  const { data: client } = await supabase
    .from("clients")
    .select("meta_ad_account_id")
    .eq("id", finalClientId)
    .single();

  if (!client?.meta_ad_account_id) {
    return { error: NextResponse.json({ error: "No Meta Ad Account configured" }, { status: 404 }), client: null };
  }

  // Try to fetch optional columns separately (they may not exist in older schemas)
  let clientExtra: { meta_pixel_id?: string | null; meta_access_token?: string | null } | null = null;
  try {
    const result = await supabase
      .from("clients")
      .select("meta_pixel_id, meta_access_token")
      .eq("id", finalClientId)
      .single();
    if (!result.error && result.data) {
      clientExtra = result.data as { meta_pixel_id?: string | null; meta_access_token?: string | null };
    }
  } catch {
    // column doesn't exist yet — fall through to env var fallback
  }

  // Env-var fallback: META_PIXEL_ID / META_ACCESS_TOKEN covers the case where the
  // Supabase column either doesn't exist or the UPDATE WHERE clause didn't match
  // (common when meta_ad_account_id is stored with the "act_" prefix).
  const pixelIdFallback = clientExtra?.meta_pixel_id ?? process.env.META_PIXEL_ID ?? process.env.META_CAPI_PIXEL_ID ?? null;
  const accessTokenFallback = clientExtra?.meta_access_token ?? process.env.META_ACCESS_TOKEN ?? process.env.META_CAPI_ACCESS_TOKEN ?? null;

  return {
    error: null,
    client: {
      ...client,
      meta_pixel_id: pixelIdFallback,
      meta_access_token: accessTokenFallback,
    },
    token,
  };
}

// ---------------------------------------------------------------------------
// Score calculator
// ---------------------------------------------------------------------------

function computeCapiScore(events: Record<string, { browser: number; server: number }>): {
  score: number;
  breakdown: { event: string; browser: number; server: number; redundancy: number; status: string }[];
  recommendations: string[];
} {
  const keyEvents = ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"];
  const breakdown = keyEvents.map((event) => {
    const data = events[event] || { browser: 0, server: 0 };
    // Redundancy = overlap score (server / (browser || 1))
    const redundancy = data.browser > 0 ? Math.min(100, Math.round((data.server / data.browser) * 100)) : 0;
    let status = "missing";
    if (data.browser > 0 && data.server > 0) status = "both";
    else if (data.server > 0) status = "server_only";
    else if (data.browser > 0) status = "browser_only";
    return { event, browser: data.browser, server: data.server, redundancy, status };
  });

  // Scoring: each key event covered by both browser + server = 2pts (10 total for 5 events)
  let rawScore = 0;
  breakdown.forEach((b) => {
    if (b.status === "both") rawScore += 2;
    else if (b.status === "browser_only" || b.status === "server_only") rawScore += 1;
  });

  const score = Math.min(10, rawScore);

  const recommendations: string[] = [];
  breakdown.forEach((b) => {
    if (b.status === "missing") {
      recommendations.push(`⚠️ **${b.event}** — No events received. Add pixel + CAPI server event for this step.`);
    } else if (b.status === "browser_only") {
      recommendations.push(`🔶 **${b.event}** — Browser only (${b.browser.toLocaleString()} events). Add server-side CAPI to boost match quality and iOS 14+ recovery.`);
    } else if (b.status === "server_only") {
      recommendations.push(`🔶 **${b.event}** — Server only. Add browser pixel code so Meta can de-duplicate and cross-validate.`);
    } else if (b.redundancy < 80) {
      recommendations.push(`🟡 **${b.event}** — CAPI redundancy at ${b.redundancy}%. Target >80%. Ensure event_id de-duplication keys are set on both sides.`);
    }
  });

  if (score === 10) {
    recommendations.push("✅ **Perfect score!** Your CAPI setup is fully redundant. All key funnel events fire via both browser pixel and server API.");
  } else if (score >= 7) {
    recommendations.push("🟢 **Good coverage** — address the gaps above to reach 10/10 for maximum Meta AI optimization.");
  } else if (score >= 4) {
    recommendations.push("🟠 **Moderate coverage** — missing server-side events are costing you conversion data. Meta cannot fully optimize without CAPI.");
  } else {
    recommendations.push("🔴 **Critical** — CAPI is severely underreporting. This directly causes higher CPP and poor AI optimization. Prioritize CAPI setup immediately.");
  }

  return { score, breakdown, recommendations };
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const { error, client } = await authenticateRequest(request);
  if (error || !client) return error!;

  const accessToken = (client as { meta_access_token?: string }).meta_access_token
    || process.env.META_ACCESS_TOKEN || process.env.META_CAPI_ACCESS_TOKEN || "";

  const pixelId = (client as { meta_pixel_id?: string }).meta_pixel_id;

  if (!pixelId) {
    // No pixel configured — return zero state
    return NextResponse.json({
      data: {
        pixel_id: null,
        score: 0,
        breakdown: [],
        recommendations: [
          "❌ **No Pixel ID configured** — Add your Meta Pixel ID to the clients table (meta_pixel_id column).",
          "Without a pixel, Meta cannot track conversions, build audiences, or optimize campaigns.",
        ],
        raw_events: {},
        period: "last_7_days",
      },
    });
  }

  try {
    const now = Math.floor(Date.now() / 1000);
    // Look back 180 days (6 months) to catch all historical pixel activity
    const SIX_MONTHS = 180 * 86400;
    const since = now - SIX_MONTHS;

    // Fetch pixel diagnostic info (name, last_fired, etc.)
    const diagUrl = `${META_GRAPH_URL}/${pixelId}?fields=id,name,code,last_fired_time,data_use_setting,owner_business&access_token=${encodeURIComponent(accessToken)}`;
    const diagRes = await fetch(diagUrl);
    let diagInfo: Record<string, unknown> = {};
    let diagError: string | null = null;
    if (diagRes.ok) {
      diagInfo = await diagRes.json() as Record<string, unknown>;
    } else {
      const diagErrBody = await diagRes.json().catch(() => ({})) as Record<string, unknown>;
      diagError = (diagErrBody?.error as Record<string, unknown>)?.message as string ?? `HTTP ${diagRes.status}`;
    }

    // Primary: fetch event stats with 180-day window, split by source (browser vs CAPI)
    const statsUrl =
      `${META_GRAPH_URL}/${pixelId}/stats` +
      `?aggregation=event_source_url` +
      `&start_time=${since}` +
      `&end_time=${now}` +
      `&access_token=${encodeURIComponent(accessToken)}`;

    // Also try the event_name aggregation to get raw counts
    const statsNameUrl =
      `${META_GRAPH_URL}/${pixelId}/stats` +
      `?aggregation=event_name` +
      `&start_time=${since}` +
      `&end_time=${now}` +
      `&access_token=${encodeURIComponent(accessToken)}`;

    const [statsRes, statsNameRes] = await Promise.all([
      fetch(statsUrl),
      fetch(statsNameUrl),
    ]);

    const events: Record<string, { browser: number; server: number }> = {};
    let statsError: string | null = null;
    let rawStatsData: unknown = null;

    // Parse event_name aggregation (most reliable for counts)
    if (statsNameRes.ok) {
      const statsData = await statsNameRes.json() as {
        data?: Array<{
          event_name: string;
          count?: number;
          browser_event_count?: number;
          server_event_count?: number;
          source?: string;
        }>;
      };
      rawStatsData = statsData;
      if (statsData.data) {
        for (const item of statsData.data) {
          if (!events[item.event_name]) events[item.event_name] = { browser: 0, server: 0 };
          // Meta returns browser_event_count and server_event_count if dedup is set up
          if (typeof item.browser_event_count === "number" || typeof item.server_event_count === "number") {
            events[item.event_name].browser += item.browser_event_count ?? 0;
            events[item.event_name].server += item.server_event_count ?? 0;
          } else {
            // Fall back: assume browser-only unless source says otherwise
            const src = (item.source ?? "browser").toLowerCase();
            const count = item.count ?? 0;
            if (src.includes("server") || src.includes("capi")) {
              events[item.event_name].server += count;
            } else {
              events[item.event_name].browser += count;
            }
          }
        }
      }
    } else {
      const errBody = await statsNameRes.json().catch(() => ({})) as Record<string, unknown>;
      statsError = (errBody?.error as Record<string, unknown>)?.message as string ?? `HTTP ${statsNameRes.status}`;
    }

    const { score, breakdown, recommendations } = computeCapiScore(events);

    // Build a human-readable note about what we found / didn't find
    const totalEvents = Object.values(events).reduce((sum, e) => sum + e.browser + e.server, 0);
    let apiNote: string | null = null;
    if (diagError) {
      apiNote = `⚠️ Could not read pixel info: ${diagError}. The access token may not have permission for this pixel (it may belong to ShiftArcade's corporate account). Ask the website owner to add your ad account as a partner in their Business Manager.`;
    } else if (statsError) {
      apiNote = `⚠️ Could not fetch pixel stats: ${statsError}. The access token may need ads_read + pixel permissions for this pixel.`;
    } else if (totalEvents === 0) {
      apiNote = `No events found in the last 180 days on pixel ${pixelId}. Either the pixel is not firing, or this token does not have permission to read its stats. Verify in Meta Events Manager that the pixel is active.`;
    }

    return NextResponse.json({
      data: {
        pixel_id: pixelId,
        pixel_name: diagInfo.name ?? "Shift Arcade Corporate",
        last_fired: diagInfo.last_fired_time ?? null,
        owner_business: (diagInfo.owner_business as Record<string, unknown>)?.name ?? null,
        score,
        score_label: score >= 9 ? "Excellent" : score >= 7 ? "Good" : score >= 5 ? "Fair" : score >= 3 ? "Weak" : "Critical",
        breakdown,
        recommendations,
        raw_events: events,
        period: "last_180_days",
        total_events_found: totalEvents,
        api_note: apiNote,
        diag_error: diagError,
        stats_error: statsError,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
