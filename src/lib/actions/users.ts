"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import { getAdminSupabase } from "@/lib/supabase-admin";
import type { Profile } from "@/types";

export async function getUsers(): Promise<(Profile & { client_name?: string })[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("profiles")
    .select("*, clients(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch users:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => {
    const clients = row.clients as { name: string } | null;
    return {
      ...(row as unknown as Profile),
      client_name: clients?.name ?? undefined,
    };
  });
}

export async function inviteClientUser(
  email: string,
  clientId: string,
  fullName: string
): Promise<{ error: string | null }> {
  const adminSupabase = getAdminSupabase();

  // Create user via admin API (sends invite email)
  const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role: "client",
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  // Update profile with client_id (trigger creates the profile row)
  if (authData.user) {
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .update({ client_id: clientId, full_name: fullName })
      .eq("id", authData.user.id);

    if (profileError) {
      return { error: profileError.message };
    }
  }

  // Generate password reset link so user can set password
  const { error: resetError } = await adminSupabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/callback`,
    },
  });

  if (resetError) {
    console.error("Failed to send invite link:", resetError.message);
  }

  return { error: null };
}

export async function deactivateUser(id: string): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", id);

  return { error: error?.message ?? null };
}
