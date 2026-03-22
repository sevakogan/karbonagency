import { getAdminSupabase } from '@/lib/supabase-admin';
import type { SyncResult } from '@/types';

// ──────────────────────────────────────────────────────
// Google Search Console — pull queries, clicks, impressions, CTR, position
// Upserts into daily_metrics with platform = 'google_search_console'
// Fields mapping: clicks->clicks, impressions->impressions, ctr->ctr, position->cpc (repurposed)
// ──────────────────────────────────────────────────────

const GSC_API_BASE = 'https://www.googleapis.com/webmasters/v3/sites';

interface GSCRow {
  keys: string[]; // [query, date] when dimensions = ['query', 'date']
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface GSCResponse {
  rows?: GSCRow[];
  responseAggregationType?: string;
}

export async function syncSearchConsole(
  companyId: string,
  credentials: Record<string, string>,
  since?: string,
  until?: string
): Promise<SyncResult> {
  const start = Date.now();

  const accessToken = credentials.access_token;
  const siteUrl = credentials.site_url;

  if (!accessToken || !siteUrl) {
    return {
      success: false,
      rowsUpserted: 0,
      error: 'Missing access_token or site_url in credentials',
      durationMs: Date.now() - start,
    };
  }

  // GSC data has a 2-3 day lag, default to last 3 days
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const effectiveUntil = until ?? threeDaysAgo.toISOString().split('T')[0];
  const effectiveSince = since ?? fiveDaysAgo.toISOString().split('T')[0];

  try {
    // Fetch aggregated daily data (no query dimension — just date-level totals)
    const dailyData = await fetchGSCData(siteUrl, accessToken, effectiveSince, effectiveUntil, ['date']);

    // Fetch top queries for the period
    const queryData = await fetchGSCData(siteUrl, accessToken, effectiveSince, effectiveUntil, ['query', 'date']);

    if (!dailyData.rows?.length && !queryData.rows?.length) {
      return { success: true, rowsUpserted: 0, durationMs: Date.now() - start };
    }

    const supabase = getAdminSupabase();

    // Upsert daily totals into daily_metrics
    const dailyRows = (dailyData.rows ?? []).map((row) => ({
      client_id: companyId,
      campaign_id: null,
      date: row.keys[0], // date dimension
      platform: 'google_search_console' as const,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      cpc: row.position, // repurpose cpc for avg position
      spend: 0,
      reach: 0,
      cpm: 0,
      conversions: 0,
      cost_per_conversion: 0,
      roas: 0,
      video_views: 0,
      leads: 0,
      link_clicks: 0,
    }));

    if (dailyRows.length > 0) {
      // Delete existing rows for this date range to avoid duplicates
      await supabase
        .from('daily_metrics')
        .delete()
        .eq('client_id', companyId)
        .eq('platform', 'google_search_console')
        .is('campaign_id', null)
        .gte('date', effectiveSince)
        .lte('date', effectiveUntil);

      const { error: insertError } = await supabase
        .from('daily_metrics')
        .insert(dailyRows);

      if (insertError) {
        return {
          success: false,
          rowsUpserted: 0,
          error: `Database error: ${insertError.message}`,
          durationMs: Date.now() - start,
        };
      }
    }

    // Store top queries as campaign_id-keyed rows for drill-down
    const queryRows = (queryData.rows ?? []).map((row) => ({
      client_id: companyId,
      campaign_id: `gsc_query:${row.keys[0]}`, // query as campaign_id
      date: row.keys[1], // date dimension
      platform: 'google_search_console' as const,
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      cpc: row.position,
      spend: 0,
      reach: 0,
      cpm: 0,
      conversions: 0,
      cost_per_conversion: 0,
      roas: 0,
      video_views: 0,
      leads: 0,
      link_clicks: 0,
    }));

    if (queryRows.length > 0) {
      // Delete existing query-level rows for this date range
      await supabase
        .from('daily_metrics')
        .delete()
        .eq('client_id', companyId)
        .eq('platform', 'google_search_console')
        .not('campaign_id', 'is', null)
        .gte('date', effectiveSince)
        .lte('date', effectiveUntil);

      const { error: queryInsertError } = await supabase
        .from('daily_metrics')
        .insert(queryRows);

      if (queryInsertError) {
        console.error('[sync-gsc] Query insert error:', queryInsertError.message);
        // Non-fatal — daily totals already saved
      }
    }

    return {
      success: true,
      rowsUpserted: dailyRows.length + queryRows.length,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return {
      success: false,
      rowsUpserted: 0,
      error: message,
      durationMs: Date.now() - start,
    };
  }
}

// ── GSC API helper ─────────────────────────────────────

async function fetchGSCData(
  siteUrl: string,
  accessToken: string,
  startDate: string,
  endDate: string,
  dimensions: string[]
): Promise<GSCResponse> {
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const url = `${GSC_API_BASE}/${encodedSiteUrl}/searchAnalytics/query`;

  const body = {
    startDate,
    endDate,
    dimensions,
    rowLimit: 1000,
    startRow: 0,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GSC API error (${response.status}): ${errorText}`);
  }

  return (await response.json()) as GSCResponse;
}
