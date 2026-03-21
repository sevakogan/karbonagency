import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { getSyncFunction } from '@/lib/sync/registry';

import type { PlatformSlug } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const supabase = getAdminSupabase();

  const { data: integrations, error } = await supabase
    .from('company_integrations')
    .select('id, platform_slug, credentials')
    .eq('company_id', companyId)
    .eq('is_enabled', true)
    .eq('status', 'connected');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    platform: string;
    success: boolean;
    rows: number;
    error?: string;
  }> = [];

  for (const integration of integrations ?? []) {
    const syncFn = getSyncFunction(integration.platform_slug as PlatformSlug);
    if (!syncFn) continue;

    try {
      const decrypted = (
        integration.credentials as Record<string, string>
      );

      await supabase
        .from('company_integrations')
        .update({ status: 'syncing' })
        .eq('id', integration.id);

      const result = await syncFn(companyId, decrypted);

      await supabase
        .from('company_integrations')
        .update({
          status: result.success ? 'connected' : 'error',
          last_synced_at: new Date().toISOString(),
          last_sync_duration_ms: result.durationMs,
          error_message: result.error ?? null,
        })
        .eq('id', integration.id);

      results.push({
        platform: integration.platform_slug,
        success: result.success,
        rows: result.rowsUpserted,
        error: result.error,
      });
    } catch (err) {
      results.push({
        platform: integration.platform_slug,
        success: false,
        rows: 0,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }

  return NextResponse.json({ results });
}
