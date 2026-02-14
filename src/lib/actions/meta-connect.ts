"use server";

import { createSupabaseServer } from "@/lib/supabase-server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ActionResult {
  readonly success: boolean;
  readonly error?: string;
}

interface VerifyResult {
  readonly valid: boolean;
  readonly name?: string;
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value
  );
}

function isNumericString(value: string): boolean {
  return /^\d+$/.test(value);
}

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function requireAdmin(): Promise<{
  readonly authorized: boolean;
  readonly error?: string;
}> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, error: "Authentication required" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return { authorized: false, error: "Admin access required" };
  }

  return { authorized: true };
}

// ---------------------------------------------------------------------------
// Server Actions
// ---------------------------------------------------------------------------

/**
 * Connect a Meta Ad Account to a campaign by saving the ad account ID.
 * Requires admin role.
 */
export async function connectMetaAdAccount(
  campaignId: string,
  adAccountId: string
): Promise<ActionResult> {
  if (!isValidUuid(campaignId)) {
    return { success: false, error: "Invalid campaign ID format" };
  }

  const trimmed = adAccountId.trim();
  if (trimmed.length === 0) {
    return { success: false, error: "Ad Account ID is required" };
  }

  if (!isNumericString(trimmed)) {
    return {
      success: false,
      error: "Ad Account ID must contain only digits",
    };
  }

  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("campaigns")
    .update({ meta_ad_account_id: trimmed })
    .eq("id", campaignId);

  if (error) {
    console.error("Failed to connect Meta Ad Account:", error.message);
    return { success: false, error: "Failed to save Ad Account ID" };
  }

  return { success: true };
}

/**
 * Disconnect Meta Ad Account from a campaign by clearing the field.
 * Requires admin role.
 */
export async function disconnectMetaAdAccount(
  campaignId: string
): Promise<ActionResult> {
  if (!isValidUuid(campaignId)) {
    return { success: false, error: "Invalid campaign ID format" };
  }

  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { success: false, error: auth.error };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase
    .from("campaigns")
    .update({ meta_ad_account_id: null })
    .eq("id", campaignId);

  if (error) {
    console.error("Failed to disconnect Meta Ad Account:", error.message);
    return { success: false, error: "Failed to disconnect Ad Account" };
  }

  return { success: true };
}

/**
 * Verify a Meta Ad Account ID by calling the Meta Graph API.
 * Checks whether the account exists and is accessible with the current token.
 */
export async function verifyMetaAdAccount(
  adAccountId: string
): Promise<VerifyResult> {
  const trimmed = adAccountId.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: "Ad Account ID is required" };
  }

  if (!isNumericString(trimmed)) {
    return { valid: false, error: "Ad Account ID must contain only digits" };
  }

  const auth = await requireAdmin();
  if (!auth.authorized) {
    return { valid: false, error: auth.error };
  }

  const token = process.env.META_ACCESS_TOKEN;
  if (!token) {
    return {
      valid: false,
      error: "META_ACCESS_TOKEN is not configured on the server",
    };
  }

  try {
    const params = new URLSearchParams({
      fields: "name,account_status",
      access_token: token,
    });

    const res = await fetch(
      `https://graph.facebook.com/v21.0/act_${trimmed}?${params}`
    );

    const json = await res.json();

    if (json.error) {
      const msg = json.error.message ?? "Unknown Meta API error";
      return { valid: false, error: msg };
    }

    return {
      valid: true,
      name: json.name ?? undefined,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to verify ad account";
    return { valid: false, error: message };
  }
}
