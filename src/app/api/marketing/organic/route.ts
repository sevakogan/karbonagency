import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

// ──────────────────────────────────────────────────────
// GET /api/marketing/organic
// Returns organic search data from daily_metrics (platform = google_search_console)
// Groups by date, returns top queries, total clicks, impressions, avg CTR, avg position
// Query params: period (7d/30d/90d/all), companyId
// Auth: Supabase session OR CRON_SECRET
// ──────────────────────────────────────────────────────

const PERIOD_DAYS: Record<string, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  'all': null,
};

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = request.nextUrl.searchParams;
    const period = params.get('period') ?? '30d';
    let companyId = params.get('companyId');

    const supabase = getAdminSupabase();

    // Default to Shift Arcade Miami
    if (!companyId) {
      const { data: company } = await supabase
        .from('clients')
        .select('id')
        .ilike('name', '%shift%arcade%')
        .limit(1)
        .single();
      companyId = company?.id ?? null;
      if (!companyId) {
        return NextResponse.json({ error: 'No company found' }, { status: 400 });
      }
    }

    // Date cutoff
    const periodDays = PERIOD_DAYS[period] ?? 30;
    const cutoffDate = periodDays !== null
      ? new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : null;

    // Fetch daily totals (campaign_id IS NULL = aggregated daily data)
    let dailyQuery = supabase
      .from('daily_metrics')
      .select('date, clicks, impressions, ctr, cpc')
      .eq('client_id', companyId)
      .eq('platform', 'google_search_console')
      .is('campaign_id', null)
      .order('date', { ascending: true });

    if (cutoffDate) {
      dailyQuery = dailyQuery.gte('date', cutoffDate);
    }

    const { data: dailyMetrics, error: dailyError } = await dailyQuery;

    if (dailyError) {
      return NextResponse.json({ error: dailyError.message }, { status: 500 });
    }

    // Fetch top queries (campaign_id starts with gsc_query:)
    let queryQuery = supabase
      .from('daily_metrics')
      .select('campaign_id, date, clicks, impressions, ctr, cpc')
      .eq('client_id', companyId)
      .eq('platform', 'google_search_console')
      .not('campaign_id', 'is', null)
      .order('clicks', { ascending: false });

    if (cutoffDate) {
      queryQuery = queryQuery.gte('date', cutoffDate);
    }

    const { data: queryMetrics, error: queryError } = await queryQuery;

    if (queryError) {
      return NextResponse.json({ error: queryError.message }, { status: 500 });
    }

    // Aggregate daily totals
    const totalClicks = (dailyMetrics ?? []).reduce((s, m) => s + (m.clicks ?? 0), 0);
    const totalImpressions = (dailyMetrics ?? []).reduce((s, m) => s + (m.impressions ?? 0), 0);
    const days = dailyMetrics?.length ?? 0;
    const avgCtr = days > 0
      ? (dailyMetrics ?? []).reduce((s, m) => s + (m.ctr ?? 0), 0) / days
      : 0;
    const avgPosition = days > 0
      ? (dailyMetrics ?? []).reduce((s, m) => s + (m.cpc ?? 0), 0) / days
      : 0;

    // Aggregate top queries across dates
    const queryMap = new Map<string, { clicks: number; impressions: number; ctr: number; position: number; days: number }>();
    for (const row of queryMetrics ?? []) {
      const queryName = (row.campaign_id as string).replace('gsc_query:', '');
      const existing = queryMap.get(queryName);
      if (existing) {
        queryMap.set(queryName, {
          clicks: existing.clicks + (row.clicks ?? 0),
          impressions: existing.impressions + (row.impressions ?? 0),
          ctr: existing.ctr + (row.ctr ?? 0),
          position: existing.position + (row.cpc ?? 0),
          days: existing.days + 1,
        });
      } else {
        queryMap.set(queryName, {
          clicks: row.clicks ?? 0,
          impressions: row.impressions ?? 0,
          ctr: row.ctr ?? 0,
          position: row.cpc ?? 0,
          days: 1,
        });
      }
    }

    const topQueries = [...queryMap.entries()]
      .map(([query, data]) => ({
        query,
        clicks: data.clicks,
        impressions: data.impressions,
        avg_ctr: data.days > 0 ? Math.round((data.ctr / data.days) * 10000) / 10000 : 0,
        avg_position: data.days > 0 ? Math.round((data.position / data.days) * 10) / 10 : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 50);

    // Daily trend
    const dailyTrend = (dailyMetrics ?? []).map((m) => ({
      date: m.date,
      clicks: m.clicks ?? 0,
      impressions: m.impressions ?? 0,
      ctr: m.ctr ?? 0,
      avg_position: m.cpc ?? 0,
    }));

    return NextResponse.json({
      total_clicks: totalClicks,
      total_impressions: totalImpressions,
      avg_ctr: Math.round(avgCtr * 10000) / 10000,
      avg_position: Math.round(avgPosition * 10) / 10,
      daily_trend: dailyTrend,
      top_queries: topQueries,
      period,
      days_with_data: days,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[marketing/organic] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Auth helper ──────────────────────────────────────

async function isAuthorized(req: NextRequest): Promise<boolean> {
  // CRON_SECRET check
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  // API key check
  const apiKey = req.headers.get('x-api-key') || authHeader?.replace('Bearer ', '');
  if (apiKey && apiKey === process.env.INGEST_API_KEY) return true;

  // Supabase session check
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}
