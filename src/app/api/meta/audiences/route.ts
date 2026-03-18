/**
 * /api/meta/audiences
 *
 * GET    — list custom audiences for an ad account
 * POST   — create custom audience (website visitors, engagement, lookalike, etc.)
 * DELETE — delete audience (?audience_id=xxx)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  listCustomAudiences,
  createCustomAudience,
  deleteCustomAudience,
  type CreateCustomAudienceInput,
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

  try {
    const audiences = await listCustomAudiences(auth.adAccountId);
    return NextResponse.json({ data: audiences, count: audiences.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAdAccountId(request);
  if (auth.error) return auth.error;

  let body: CreateCustomAudienceInput;
  try {
    body = (await request.json()) as CreateCustomAudienceInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.name || !body.subtype) {
    return NextResponse.json({ error: "name and subtype are required" }, { status: 400 });
  }

  try {
    const result = await createCustomAudience(auth.adAccountId, body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await getAdAccountId(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const audienceId = url.searchParams.get("audience_id");
  if (!audienceId) {
    return NextResponse.json({ error: "audience_id query parameter required" }, { status: 400 });
  }

  try {
    const result = await deleteCustomAudience(audienceId);
    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
