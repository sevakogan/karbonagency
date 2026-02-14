"use server";

import { createSupabaseServer } from "@/lib/supabase-server";
import type { Profile } from "@/types";

type UpdatableFields = Partial<Pick<Profile, "full_name" | "phone" | "avatar_url">>;

export async function updateProfileFields(
  updates: UpdatableFields
): Promise<{ error: string | null }> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  return { error: error?.message ?? null };
}
