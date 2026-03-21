import { getAdminSupabase } from '@/lib/supabase-admin';
import {
  getIgUserIdFromPage,
  fetchIgAccountInsights,
  fetchIgAccountInfo,
  fetchIgMediaWithInsights,
} from '@/lib/instagram-api';
import type { SyncResult } from '@/types';

/**
 * Sync Instagram account insights to the daily_metrics table.
 * Stores follower growth, reach, engagement as daily rows with platform='instagram'.
 *
 * Credential keys expected:
 *   - ig_user_id: Direct IG Business Account ID (preferred)
 *   - page_id: Facebook Page ID to resolve IG account from (fallback)
 *   - access_token: Meta access token with instagram_manage_insights permission
 */
export async function syncInstagram(
  companyId: string,
  credentials: Record<string, string>,
  since?: string,
  until?: string
): Promise<SyncResult> {
  const start = Date.now();

  const accessToken = credentials.access_token;
  if (!accessToken) {
    return {
      success: false,
      rowsUpserted: 0,
      error: 'Missing access_token credential',
      durationMs: Date.now() - start,
    };
  }

  // Resolve IG User ID
  let igUserId = credentials.ig_user_id;
  if (!igUserId && credentials.page_id) {
    const originalToken = process.env.META_ACCESS_TOKEN;
    try {
      process.env.META_ACCESS_TOKEN = accessToken;
      const igResult = await getIgUserIdFromPage(credentials.page_id);
      if (igResult.error) {
        return {
          success: false,
          rowsUpserted: 0,
          error: igResult.error,
          durationMs: Date.now() - start,
        };
      }
      igUserId = igResult.data;
    } finally {
      if (originalToken) process.env.META_ACCESS_TOKEN = originalToken;
    }
  }

  if (!igUserId) {
    return {
      success: false,
      rowsUpserted: 0,
      error: 'Missing ig_user_id or page_id credential',
      durationMs: Date.now() - start,
    };
  }

  const now = new Date();
  const effectiveUntil = until ?? now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const effectiveSince = since ?? sevenDaysAgo.toISOString().split('T')[0];

  const originalToken = process.env.META_ACCESS_TOKEN;
  try {
    process.env.META_ACCESS_TOKEN = accessToken;

    // Fetch account info + insights + media engagement in parallel
    const [accountResult, insightsResult, mediaResult] = await Promise.all([
      fetchIgAccountInfo(igUserId),
      fetchIgAccountInsights(igUserId, effectiveSince, effectiveUntil),
      fetchIgMediaWithInsights(igUserId, 20),
    ]);

    if (insightsResult.error && accountResult.error) {
      return {
        success: false,
        rowsUpserted: 0,
        error: insightsResult.error ?? accountResult.error ?? 'Unknown error',
        durationMs: Date.now() - start,
      };
    }

    // Build daily metric row from account insights
    // IG insights API returns totals for the period, not daily breakdown
    // We store one row per sync with the period's aggregated data
    const insights = insightsResult.data;
    const account = accountResult.data;
    const media = mediaResult.data ?? [];

    // Calculate engagement metrics from recent media
    const totalMediaReach = media.reduce((sum, m) => sum + m.reach, 0);
    const totalInteractions = media.reduce((sum, m) => sum + m.total_interactions, 0);
    const totalViews = media.reduce((sum, m) => sum + m.views, 0);

    const row = {
      client_id: companyId,
      campaign_id: null,
      date: effectiveUntil,
      platform: 'instagram' as const,
      spend: 0, // Instagram organic has no spend
      impressions: totalViews || (insights?.views ?? 0),
      reach: totalMediaReach || (insights?.reach ?? 0),
      clicks: insights?.profile_links_taps ?? 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      conversions: insights?.follows ?? 0, // follower gains as "conversions"
      cost_per_conversion: null,
      roas: null,
      video_views: totalViews,
      leads: 0,
      link_clicks: insights?.profile_links_taps ?? 0,
    };

    const adminSupabase = getAdminSupabase();

    // Delete existing row for this date to upsert
    await adminSupabase
      .from('daily_metrics')
      .delete()
      .eq('client_id', companyId)
      .eq('platform', 'instagram')
      .is('campaign_id', null)
      .eq('date', effectiveUntil);

    const { error: insertError } = await adminSupabase
      .from('daily_metrics')
      .insert([row]);

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
      rowsUpserted: 1,
      durationMs: Date.now() - start,
    };
  } finally {
    if (originalToken) {
      process.env.META_ACCESS_TOKEN = originalToken;
    }
  }
}
