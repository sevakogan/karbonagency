import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { getSyncFunction } from '@/lib/sync/registry';

import type { PlatformSlug } from '@/types';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getAdminSupabase();

  // Get all active, connected integrations where sync is supported
  const { data: integrations, error } = await supabase
    .from('company_integrations')
    .select(`
      id,
      company_id,
      platform_slug,
      credentials
    `)
    .eq('is_enabled', true)
    .eq('status', 'connected');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const results: Array<{
    companyId: string;
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

      // Update status to syncing
      await supabase
        .from('company_integrations')
        .update({ status: 'syncing' })
        .eq('id', integration.id);

      const result = await syncFn(integration.company_id, decrypted);

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
        companyId: integration.company_id,
        platform: integration.platform_slug,
        success: result.success,
        rows: result.rowsUpserted,
        error: result.error,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';

      await supabase
        .from('company_integrations')
        .update({
          status: 'error',
          error_message: errorMsg,
        })
        .eq('id', integration.id);

      results.push({
        companyId: integration.company_id,
        platform: integration.platform_slug,
        success: false,
        rows: 0,
        error: errorMsg,
      });
    }
  }

  return NextResponse.json({
    synced: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}
