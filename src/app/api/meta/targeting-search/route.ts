/**
 * /api/meta/targeting-search
 *
 * GET ?q=formula+one&type=interests  — search for targetable interests/behaviors
 */

import { NextRequest, NextResponse } from "next/server";
import { searchInterests, searchBehaviors } from "@/lib/meta-api-write";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }

  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  const type = url.searchParams.get("type") ?? "interests";

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ error: "q parameter required (min 2 chars)" }, { status: 400 });
  }

  try {
    const results = type === "behaviors"
      ? await searchBehaviors(query)
      : await searchInterests(query);

    return NextResponse.json({ data: results, count: results.length, query, type });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
