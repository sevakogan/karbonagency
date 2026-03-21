import { getAdminSupabase } from '@/lib/supabase-admin';
import { fetchAdAccountInsights, normalizeAdAccountId } from '@/lib/meta-api';
import type { SyncResult } from '@/types';

export async function syncMetaAds(
  companyId: string,
  credentials: Record<string, string>,
  since?: string,
  until?: string
): Promise<SyncResult> {
  const start = Date.now();

  const accessToken = credentials.access_token;
  const rawAdAccountId = credentials.ad_account_id;

  if (!accessToken || !rawAdAccountId) {
    return {
      success: false,
      rowsUpserted: 0,
      error: 'Missing access_token or ad_account_id',
      durationMs: Date.now() - start,
    };
  }

  const now = new Date();
  const effectiveUntil = until ?? now.toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const effectiveSince = since ?? thirtyDaysAgo.toISOString().split('T')[0];

  const adAccountId = normalizeAdAccountId(rawAdAccountId);

  // Use the per-company access token by temporarily overriding
  // We call the existing meta-api function which reads META_ACCESS_TOKEN from env
  // TODO: Refactor meta-api to accept token as parameter
  const originalToken = process.env.META_ACCESS_TOKEN;
  try {
    process.env.META_ACCESS_TOKEN = accessToken;

    const { data: insights, error: metaError } = await fetchAdAccountInsights(
      adAccountId,
      effectiveSince,
      effectiveUntil
    );

    if (metaError) {
      return {
        success: false,
        rowsUpserted: 0,
        error: metaError,
        durationMs: Date.now() - start,
      };
    }

    if (!insights || insights.length === 0) {
      return { success: true, rowsUpserted: 0, durationMs: Date.now() - start };
    }

    const rows = insights.map((day) => ({
      client_id: companyId,
      campaign_id: null,
      date: day.date,
      platform: 'meta' as const,
      spend: day.spend,
      impressions: day.impressions,
      reach: day.reach,
      clicks: day.clicks,
      ctr: day.ctr,
      cpc: day.cpc,
      cpm: day.cpm,
      conversions: day.conversions,
      cost_per_conversion: day.cost_per_conversion,
      roas: day.roas,
      video_views: day.video_views,
      leads: day.leads,
      link_clicks: day.link_clicks,
    }));

    const adminSupabase = getAdminSupabase();

    await adminSupabase
      .from('daily_metrics')
      .delete()
      .eq('client_id', companyId)
      .eq('platform', 'meta')
      .is('campaign_id', null)
      .gte('date', effectiveSince)
      .lte('date', effectiveUntil);

    const { error: insertError } = await adminSupabase
      .from('daily_metrics')
      .insert(rows);

    if (insertError) {
      return {
        success: false,
        rowsUpserted: 0,
        error: `Database error: ${insertError.message}`,
        durationMs: Date.now() - start,
      };
    }

    return {
      success: true,
      rowsUpserted: rows.length,
      durationMs: Date.now() - start,
    };
  } finally {
    // Restore original token
    if (originalToken) {
      process.env.META_ACCESS_TOKEN = originalToken;
    }
  }
}
