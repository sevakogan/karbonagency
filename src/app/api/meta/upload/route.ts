/**
 * /api/meta/upload
 *
 * POST — Upload an image to Meta's ad image library for an ad account.
 *         Accepts multipart/form-data with a "file" field + client_id query param.
 *
 * Returns: { hash, url, name } of the uploaded image in Meta's library.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

const META_GRAPH_URL = "https://graph.facebook.com/v25.0";

async function getClientMeta(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Authorization required" }, { status: 401 }), client: null };
  }
  const token = authHeader.replace("Bearer ", "");
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

  const { data: client } = await supabase
    .from("clients")
    .select("meta_ad_account_id, meta_access_token")
    .eq("id", finalClientId)
    .single();

  if (!client?.meta_ad_account_id) {
    return { error: NextResponse.json({ error: "No Meta Ad Account configured" }, { status: 404 }), client: null };
  }

  return { error: null, client };
}

export async function POST(request: NextRequest) {
  const { error, client } = await getClientMeta(request);
  if (error || !client) return error!;

  const metaClient = client as { meta_ad_account_id: string; meta_access_token?: string };
  const accessToken = metaClient.meta_access_token || (process.env.META_ACCESS_TOKEN ?? process.env.META_CAPI_ACCESS_TOKEN) || "";
  const accountId = metaClient.meta_ad_account_id.startsWith("act_")
    ? metaClient.meta_ad_account_id
    : `act_${metaClient.meta_ad_account_id}`;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided. Send a 'file' field in the form data." }, { status: 400 });
    }

    // Build multipart form for Meta API
    const metaForm = new FormData();
    metaForm.append("access_token", accessToken);
    metaForm.append("bytes", file);
    metaForm.append("name", file.name || "uploaded_creative");

    const uploadUrl = `${META_GRAPH_URL}/${accountId}/adimages`;
    const uploadRes = await fetch(uploadUrl, {
      method: "POST",
      body: metaForm,
    });

    const uploadData = await uploadRes.json() as {
      images?: Record<string, { hash: string; url: string; name: string }>;
      error?: { message: string };
    };

    if (!uploadRes.ok || uploadData.error) {
      return NextResponse.json(
        { error: uploadData.error?.message || "Meta image upload failed" },
        { status: 500 }
      );
    }

    // Meta returns { images: { [filename]: { hash, url, name } } }
    const imageKey = Object.keys(uploadData.images || {})[0];
    const imageData = imageKey ? uploadData.images![imageKey] : null;

    if (!imageData) {
      return NextResponse.json({ error: "Upload succeeded but no image data returned" }, { status: 500 });
    }

    return NextResponse.json({
      data: {
        hash: imageData.hash,
        url: imageData.url,
        name: imageData.name || file.name,
        type: "image",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
