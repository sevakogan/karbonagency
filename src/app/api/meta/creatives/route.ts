/**
 * /api/meta/creatives
 *
 * GET    — list creatives for an ad account
 * POST   — create ad creative (image, video, carousel)
 * DELETE — delete creative (?creative_id=xxx)
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import {
  listCreatives,
  createAdCreative,
  deleteAdCreative,
  uploadAdImageByUrl,
  listAdImages,
  type CreateAdCreativeInput,
} from "@/lib/meta-api-write";

async function getAdAccountIdAndPageId(request: NextRequest): Promise<
  | { adAccountId: string; pageId: string | null; error: null }
  | { adAccountId: null; pageId: null; error: NextResponse }
> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { adAccountId: null, pageId: null, error: NextResponse.json({ error: "Authorization required" }, { status: 401 }) };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdminSupabase();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { adAccountId: null, pageId: null, error: NextResponse.json({ error: "Invalid session" }, { status: 401 }) };
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
    return { adAccountId: null, pageId: null, error: NextResponse.json({ error: "client_id required" }, { status: 400 }) };
  }

  const { data: client } = await supabase
    .from("clients")
    .select("meta_ad_account_id, meta_page_id")
    .eq("id", resolvedClientId)
    .single();

  if (!client?.meta_ad_account_id) {
    return { adAccountId: null, pageId: null, error: NextResponse.json({ error: "No Meta Ad Account configured" }, { status: 404 }) };
  }

  return { adAccountId: client.meta_ad_account_id, pageId: client.meta_page_id ?? null, error: null };
}

export async function GET(request: NextRequest) {
  const auth = await getAdAccountIdAndPageId(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const type = url.searchParams.get("type"); // "creatives" | "images"

  try {
    if (type === "images") {
      const images = await listAdImages(auth.adAccountId);
      return NextResponse.json({ data: images, count: images.length });
    }

    const creatives = await listCreatives(auth.adAccountId);
    return NextResponse.json({ data: creatives, count: creatives.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAdAccountIdAndPageId(request);
  if (auth.error) return auth.error;

  let body: CreateAdCreativeInput & { action?: "upload_image_url"; image_url?: string };
  try {
    body = (await request.json()) as CreateAdCreativeInput & { action?: "upload_image_url"; image_url?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Special action: upload image by URL
  if (body.action === "upload_image_url") {
    if (!body.image_url) {
      return NextResponse.json({ error: "image_url required for upload_image_url action" }, { status: 400 });
    }
    try {
      const result = await uploadAdImageByUrl(auth.adAccountId, body.image_url);
      return NextResponse.json({ data: result }, { status: 201 });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (!body.name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  // Use client's page_id if not provided
  if (!body.page_id) {
    if (!auth.pageId) {
      return NextResponse.json({ error: "page_id required (client has no Meta Page ID configured)" }, { status: 400 });
    }
    body.page_id = auth.pageId;
  }

  try {
    const result = await createAdCreative(auth.adAccountId, body);
    return NextResponse.json({ data: result }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await getAdAccountIdAndPageId(request);
  if (auth.error) return auth.error;

  const url = new URL(request.url);
  const creativeId = url.searchParams.get("creative_id");
  if (!creativeId) {
    return NextResponse.json({ error: "creative_id query parameter required" }, { status: 400 });
  }

  try {
    const result = await deleteAdCreative(creativeId);
    return NextResponse.json({ data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
