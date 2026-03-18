/**
 * /api/meta/clients/[id]
 *
 * DELETE — Soft-deletes (marks is_active = false) or hard-deletes a client.
 * Admin-only.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Authorization required" }, { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = getAdminSupabase();

  // Validate session
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }

  // Admin only
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await params;

  // Check client exists
  const { data: client, error: fetchError } = await supabase
    .from("clients")
    .select("id, name")
    .eq("id", id)
    .single();

  if (fetchError || !client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  // Hard delete
  const { error: deleteError } = await supabase
    .from("clients")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: client.name });
}
