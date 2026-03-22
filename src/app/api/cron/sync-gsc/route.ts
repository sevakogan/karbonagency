import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { syncSearchConsole } from '@/lib/sync/google-search-console';

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';

/**
 * GET /api/cron/sync-gsc
 *
 * Runs every 4 hours. Pulls Google Search Console data for Miami company.
 * GSC data has a 2-3 day lag, so we pull the last 5 days to fill gaps.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const siteUrl = process.env.GSC_SITE_URL;
  const accessToken = process.env.GSC_ACCESS_TOKEN;

  if (!siteUrl || !accessToken) {
    return NextResponse.json(
      { error: 'Missing GSC_SITE_URL or GSC_ACCESS_TOKEN env vars' },
      { status: 500 }
    );
  }

  try {
    const credentials = { access_token: accessToken, site_url: siteUrl };

    // Default: last 5 days to account for GSC's 2-3 day data lag
    const now = new Date();
    const since = new Date(now);
    since.setDate(since.getDate() - 5);
    const until = new Date(now);
    until.setDate(until.getDate() - 2); // GSC data is ~2 days behind

    const result = await syncSearchConsole(
      MIAMI_COMPANY_ID,
      credentials,
      since.toISOString().split('T')[0],
      until.toISOString().split('T')[0]
    );

    if (!result.success) {
      console.error('[sync-gsc] Sync failed:', result.error);
      return NextResponse.json(
        { error: result.error, durationMs: result.durationMs },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rowsUpserted: result.rowsUpserted,
      durationMs: result.durationMs,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[sync-gsc] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
