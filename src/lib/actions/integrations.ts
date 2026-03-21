'use server';

import { createSupabaseServer } from '@/lib/supabase-server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { encryptCredentials, decryptCredentials } from '@/lib/encryption';
import { testConnection } from '@/lib/sync/test-connection';
import { getSyncFunction } from '@/lib/sync/registry';
import type { CompanyIntegration, PlatformSlug, IntegrationStatus } from '@/types';

export async function getCompanyIntegrations(
  companyId: string
): Promise<{ data: CompanyIntegration[]; error: string | null }> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('company_integrations')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });

  if (error) return { data: [], error: error.message };

  // Never expose encrypted credentials to client
  const sanitized = (data ?? []).map((row) => ({
    ...row,
    credentials: {},
  })) as CompanyIntegration[];

  return { data: sanitized, error: null };
}

export async function getIntegrationWithCredentials(
  companyId: string,
  platformSlug: PlatformSlug
): Promise<{ data: CompanyIntegration | null; error: string | null }> {
  const adminSupabase = getAdminSupabase();
  const { data, error } = await adminSupabase
    .from('company_integrations')
    .select('*')
    .eq('company_id', companyId)
    .eq('platform_slug', platformSlug)
    .single();

  if (error) return { data: null, error: error.message };
  if (!data) return { data: null, error: null };

  try {
    const decrypted = decryptCredentials(data.credentials as Record<string, string>);
    return {
      data: { ...data, credentials: decrypted } as CompanyIntegration,
      error: null,
    };
  } catch {
    return {
      data: { ...data, credentials: {} } as CompanyIntegration,
      error: 'Failed to decrypt credentials',
    };
  }
}

export async function saveIntegrationCredentials(
  companyId: string,
  platformSlug: PlatformSlug,
  credentials: Record<string, string>,
  shouldTest: boolean = true
): Promise<{
  success: boolean;
  status: IntegrationStatus;
  statusDetail: string | null;
  error: string | null;
}> {
  const adminSupabase = getAdminSupabase();
  const encrypted = encryptCredentials(credentials);

  // Upsert the integration
  const { error: upsertError } = await adminSupabase
    .from('company_integrations')
    .upsert(
      {
        company_id: companyId,
        platform_slug: platformSlug,
        credentials: encrypted,
        is_enabled: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'company_id,platform_slug' }
    );

  if (upsertError) {
    return {
      success: false,
      status: 'error',
      statusDetail: null,
      error: `Failed to save: ${upsertError.message}`,
    };
  }

  if (!shouldTest) {
    return { success: true, status: 'disconnected', statusDetail: 'Saved without testing', error: null };
  }

  // Test the connection
  const testResult = await testConnection(platformSlug, credentials);

  const newStatus: IntegrationStatus = testResult.success ? 'connected' : 'error';
  const statusDetail = testResult.success
    ? `Connected as "${testResult.accountName}"`
    : null;

  await adminSupabase
    .from('company_integrations')
    .update({
      status: newStatus,
      status_detail: statusDetail,
      error_message: testResult.error ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .eq('platform_slug', platformSlug);

  // If connected and sync is supported, trigger initial sync
  if (testResult.success) {
    const syncFn = getSyncFunction(platformSlug);
    if (syncFn) {
      // Run sync in background (don't await)
      syncFn(companyId, credentials).then(async (result) => {
        await adminSupabase
          .from('company_integrations')
          .update({
            last_synced_at: new Date().toISOString(),
            last_sync_duration_ms: result.durationMs,
            status: result.success ? 'connected' : 'error',
            error_message: result.error ?? null,
          })
          .eq('company_id', companyId)
          .eq('platform_slug', platformSlug);
      }).catch(() => {
        // Swallow background sync errors
      });
    }
  }

  return {
    success: testResult.success,
    status: newStatus,
    statusDetail,
    error: testResult.error ?? null,
  };
}

export async function disconnectIntegration(
  companyId: string,
  platformSlug: PlatformSlug
): Promise<{ success: boolean; error: string | null }> {
  const adminSupabase = getAdminSupabase();
  const { error } = await adminSupabase
    .from('company_integrations')
    .update({
      is_enabled: false,
      status: 'disconnected',
      status_detail: null,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .eq('platform_slug', platformSlug);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}

export async function toggleIntegration(
  companyId: string,
  platformSlug: PlatformSlug,
  enabled: boolean
): Promise<{ success: boolean; error: string | null }> {
  const adminSupabase = getAdminSupabase();
  const { error } = await adminSupabase
    .from('company_integrations')
    .update({
      is_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('company_id', companyId)
    .eq('platform_slug', platformSlug);

  if (error) return { success: false, error: error.message };
  return { success: true, error: null };
}
