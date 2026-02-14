import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  fetchAccountOverview,
  fetchCampaignBreakdown,
  fetchAgeGenderBreakdown,
  fetchPlatformBreakdown,
} from "@/lib/meta-api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type MetaQueryType = "overview" | "campaigns" | "demographics" | "placements";

const VALID_QUERY_TYPES: readonly MetaQueryType[] = [
  "overview",
  "campaigns",
  "demographics",
  "placements",
];

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isValidQueryType(value: string): value is MetaQueryType {
  return (VALID_QUERY_TYPES as readonly string[]).includes(value);
}

function getDefaultDateRange(): { since: string; until: string } {
  const now = new Date();
  const until = now.toISOString().split("T")[0];

  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().split("T")[0];

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

async function getClientMetaAccountId(
  clientId: string,
  userId: string
): Promise<
  | { adAccountId: string; error: null }
  | { adAccountId: null; error: NextResponse }
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
      adAccountId: null,
      error: NextResponse.json(
        { error: "User profile not found" },
        { status: 403 }
      ),
    };
  }

  // Client users can only access their own data
  if (profile.role === "client" && profile.client_id !== clientId) {
    return {
      adAccountId: null,
      error: NextResponse.json(
        { error: "Access denied to this client's data" },
        { status: 403 }
      ),
    };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("meta_ad_account_id")
    .eq("id", clientId)
    .single();

  if (!client || !client.meta_ad_account_id) {
    return {
      adAccountId: null,
      error: NextResponse.json(
        { error: "Client has no Meta Ad Account configured" },
        { status: 404 }
      ),
    };
  }

  return { adAccountId: client.meta_ad_account_id, error: null };
}

// ---------------------------------------------------------------------------
// Data fetchers by type
// ---------------------------------------------------------------------------

async function fetchByType(
  type: MetaQueryType,
  adAccountId: string,
  since: string,
  until: string
): Promise<NextResponse> {
  switch (type) {
    case "overview": {
      const result = await fetchAccountOverview(adAccountId, since, until);
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 502 }
        );
      }
      return NextResponse.json({ type, since, until, data: result.data });
    }

    case "campaigns": {
      const result = await fetchCampaignBreakdown(adAccountId, since, until);
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 502 }
        );
      }
      return NextResponse.json({ type, since, until, data: result.data });
    }

    case "demographics": {
      const result = await fetchAgeGenderBreakdown(adAccountId, since, until);
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 502 }
        );
      }
      return NextResponse.json({ type, since, until, data: result.data });
    }

    case "placements": {
      const result = await fetchPlatformBreakdown(adAccountId, since, until);
      if (result.error) {
        return NextResponse.json(
          { error: result.error },
          { status: 502 }
        );
      }
      return NextResponse.json({ type, since, until, data: result.data });
    }
  }
}

// ---------------------------------------------------------------------------
// GET /api/meta — Real-time Meta data proxy
// ---------------------------------------------------------------------------

/**
 * GET /api/meta?type=overview&clientId=UUID&since=YYYY-MM-DD&until=YYYY-MM-DD
 *
 * Proxies live data from the Meta Marketing API for real-time dashboard views.
 * Requires authenticated Supabase session.
 *
 * Query params:
 *   - type: "overview" | "campaigns" | "demographics" | "placements" (required)
 *   - clientId: UUID of the client (required)
 *   - since: start date YYYY-MM-DD (optional, defaults to 30 days ago)
 *   - until: end date YYYY-MM-DD (optional, defaults to today)
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

  // Get Meta ad account ID for the client
  const accountResult = await getClientMetaAccountId(
    clientId,
    authResult.userId
  );
  if (accountResult.error) {
    return accountResult.error;
  }

  // Fetch data from Meta API
  return fetchByType(typeParam, accountResult.adAccountId, since, until);
}
