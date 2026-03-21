import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  getIgUserIdFromPage,
  fetchIgOverview,
  fetchIgAccountInfo,
  fetchIgAccountInsights,
  fetchIgMediaWithInsights,
  fetchIgStories,
  fetchIgDemographics,
  fetchIgCompetitor,
  searchIgHashtag,
} from "@/lib/instagram-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type IgQueryType =
  | "overview"
  | "account"
  | "insights"
  | "media"
  | "stories"
  | "demographics"
  | "competitor"
  | "hashtag";

const VALID_QUERY_TYPES: readonly IgQueryType[] = [
  "overview",
  "account",
  "insights",
  "media",
  "stories",
  "demographics",
  "competitor",
  "hashtag",
];

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isValidQueryType(value: string): value is IgQueryType {
  return (VALID_QUERY_TYPES as readonly string[]).includes(value);
}

function getDefaultDateRange(): { since: string; until: string } {
  const now = new Date();
  const until = now.toISOString().split("T")[0];
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const since = sevenDaysAgo.toISOString().split("T")[0];
  return { since, until };
}

// ---------------------------------------------------------------------------
// Auth helpers
// ---------------------------------------------------------------------------

async function authenticateRequest(
  request: NextRequest
): Promise<
  | { userId: string; error: null }
  | { userId: null; error: NextResponse }
> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return {
      userId: null,
      error: NextResponse.json(
        { error: "Authorization header required" },
        { status: 401 }
      ),
    };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdminSupabase();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      userId: null,
      error: NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 }
      ),
    };
  }

  return { userId: user.id, error: null };
}

async function getClientIgUserId(
  clientId: string,
  userId: string
): Promise<
  | { igUserId: string; error: null }
  | { igUserId: null; error: NextResponse }
> {
  const supabase = getAdminSupabase();

  // Check user role for authorization
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, client_id")
    .eq("id", userId)
    .single();

  if (!profile) {
    return {
      igUserId: null,
      error: NextResponse.json(
        { error: "User profile not found" },
        { status: 403 }
      ),
    };
  }

  // Client users can only access their own data
  if (profile.role === "client" && profile.client_id !== clientId) {
    return {
      igUserId: null,
      error: NextResponse.json(
        { error: "Access denied to this client's data" },
        { status: 403 }
      ),
    };
  }

  // First check company_integrations for stored IG user ID
  const { data: integration } = await supabase
    .from("company_integrations")
    .select("credentials")
    .eq("company_id", clientId)
    .eq("platform_slug", "instagram")
    .single();

  if (integration?.credentials?.ig_user_id) {
    return { igUserId: integration.credentials.ig_user_id, error: null };
  }

  // Fall back to resolving from the client's Facebook Page
  const { data: client } = await supabase
    .from("clients")
    .select("meta_page_id")
    .eq("id", clientId)
    .single();

  if (!client?.meta_page_id) {
    return {
      igUserId: null,
      error: NextResponse.json(
        { error: "Client has no Facebook Page configured. Set meta_page_id or connect Instagram integration." },
        { status: 404 }
      ),
    };
  }

  // Resolve IG User ID from Page
  const igResult = await getIgUserIdFromPage(client.meta_page_id);
  if (igResult.error) {
    return {
      igUserId: null,
      error: NextResponse.json(
        { error: igResult.error },
        { status: 502 }
      ),
    };
  }

  return { igUserId: igResult.data, error: null };
}

// ---------------------------------------------------------------------------
// Data fetchers by type
// ---------------------------------------------------------------------------

async function fetchByType(
  type: IgQueryType,
  igUserId: string,
  since: string,
  until: string,
  searchParams: URLSearchParams
): Promise<NextResponse> {
  switch (type) {
    case "overview": {
      const result = await fetchIgOverview(igUserId, since, until);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      return NextResponse.json({ type, since, until, data: result.data });
    }

    case "account": {
      const result = await fetchIgAccountInfo(igUserId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      return NextResponse.json({ type, data: result.data });
    }

    case "insights": {
      const result = await fetchIgAccountInsights(igUserId, since, until);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      return NextResponse.json({ type, since, until, data: result.data });
    }

    case "media": {
      const limit = Math.min(safeInt(searchParams.get("limit"), 20), 50);
      const result = await fetchIgMediaWithInsights(igUserId, limit);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      return NextResponse.json({ type, data: result.data });
    }

    case "stories": {
      const result = await fetchIgStories(igUserId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      return NextResponse.json({ type, data: result.data });
    }

    case "demographics": {
      const result = await fetchIgDemographics(igUserId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      return NextResponse.json({ type, data: result.data });
    }

    case "competitor": {
      const username = searchParams.get("username");
      if (!username) {
        return NextResponse.json(
          { error: "username parameter is required for competitor lookup" },
          { status: 400 }
        );
      }
      const result = await fetchIgCompetitor(igUserId, username);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      return NextResponse.json({ type, data: result.data });
    }

    case "hashtag": {
      const tag = searchParams.get("tag") ?? searchParams.get("q");
      if (!tag) {
        return NextResponse.json(
          { error: "tag parameter is required for hashtag search" },
          { status: 400 }
        );
      }
      const result = await searchIgHashtag(igUserId, tag);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      return NextResponse.json({ type, data: result.data });
    }
  }
}

function safeInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

// ---------------------------------------------------------------------------
// GET /api/instagram — Instagram data proxy
// ---------------------------------------------------------------------------

/**
 * GET /api/instagram?type=overview&clientId=UUID&since=YYYY-MM-DD&until=YYYY-MM-DD
 *
 * Proxies live data from the Instagram Graph API for dashboard views.
 * Requires authenticated Supabase session.
 *
 * Query params:
 *   - type: overview|account|insights|media|stories|demographics|competitor|hashtag
 *   - clientId: UUID of the client (required)
 *   - since: start date YYYY-MM-DD (optional, defaults to 7 days ago)
 *   - until: end date YYYY-MM-DD (optional, defaults to today)
 *   - username: competitor IG handle (required for type=competitor)
 *   - tag/q: hashtag to search (required for type=hashtag)
 *   - limit: max media items (optional, for type=media, default 20, max 50)
 */
export async function GET(request: NextRequest) {
  // Authenticate
  const authResult = await authenticateRequest(request);
  if (authResult.error) {
    return authResult.error;
  }

  const searchParams = request.nextUrl.searchParams;

  // Validate type parameter
  const typeParam = searchParams.get("type");
  if (!typeParam || !isValidQueryType(typeParam)) {
    return NextResponse.json(
      {
        error: `Invalid or missing "type" parameter. Must be one of: ${VALID_QUERY_TYPES.join(", ")}`,
      },
      { status: 400 }
    );
  }

  // Validate clientId parameter
  const clientId = searchParams.get("clientId");
  if (!clientId || !isValidUuid(clientId)) {
    return NextResponse.json(
      { error: "Valid clientId parameter is required" },
      { status: 400 }
    );
  }

  // Validate date parameters
  const defaults = getDefaultDateRange();
  const sinceParam = searchParams.get("since");
  const untilParam = searchParams.get("until");
  const since = sinceParam && isValidDateString(sinceParam) ? sinceParam : defaults.since;
  const until = untilParam && isValidDateString(untilParam) ? untilParam : defaults.until;

  // Get IG User ID for the client
  const igResult = await getClientIgUserId(clientId, authResult.userId);
  if (igResult.error) {
    return igResult.error;
  }

  // Fetch data from Instagram API
  return fetchByType(typeParam, igResult.igUserId, since, until, searchParams);
}
