import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';

// ──────────────────────────────────────────────────────
// GET /api/reports/summary?companyId={id}&format=telegram
// Returns an AI-ready summary of today's performance
// N8N calls this → sends result to Telegram
// ──────────────────────────────────────────────────────

function validateApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  return key === process.env.INGEST_API_KEY;
}

function todayStr(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });
}

export async function GET(req: NextRequest) {
  if (!validateApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const companyId = searchParams.get('companyId');
  const format = searchParams.get('format') ?? 'json';

  if (!companyId) {
    return NextResponse.json({ error: 'companyId required' }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const today = todayStr();

  // Fetch today's metrics across all platforms
  const { data: todayMetrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('client_id', companyId)
    .eq('date', today);

  // Fetch yesterday for comparison
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' });

  const { data: yesterdayMetrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('client_id', companyId)
    .eq('date', yesterdayStr);

  // Fetch company name
  const { data: company } = await supabase
    .from('clients')
    .select('name')
    .eq('id', companyId)
    .single();

  // Fetch ShiftOS analytics
  const { data: todayReservations } = await supabase
    .from('shiftos_reservations')
    .select('*')
    .eq('company_id', companyId)
    .gte('booking_time', `${today}T00:00:00`)
    .lte('booking_time', `${today}T23:59:59`);

  // Aggregate by platform
  const byPlatform: Record<string, {
    spend: number; impressions: number; clicks: number;
    conversions: number; ctr: number; cpc: number;
  }> = {};

  for (const m of todayMetrics ?? []) {
    const p = m.platform;
    if (!byPlatform[p]) {
      byPlatform[p] = { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0 };
    }
    byPlatform[p].spend += Number(m.spend ?? 0);
    byPlatform[p].impressions += Number(m.impressions ?? 0);
    byPlatform[p].clicks += Number(m.clicks ?? 0);
    byPlatform[p].conversions += Number(m.conversions ?? 0);
  }

  // Compute CTR/CPC after aggregation
  for (const p of Object.keys(byPlatform)) {
    const d = byPlatform[p];
    d.ctr = d.impressions > 0 ? (d.clicks / d.impressions) * 100 : 0;
    d.cpc = d.clicks > 0 ? d.spend / d.clicks : 0;
  }

  // Totals
  const totalSpend = Object.values(byPlatform).reduce((s, p) => s + p.spend, 0);
  const totalClicks = Object.values(byPlatform).reduce((s, p) => s + p.clicks, 0);
  const totalImpressions = Object.values(byPlatform).reduce((s, p) => s + p.impressions, 0);
  const totalConversions = Object.values(byPlatform).reduce((s, p) => s + p.conversions, 0);

  // Yesterday totals for delta
  const ySpend = (yesterdayMetrics ?? []).reduce((s, m) => s + Number(m.spend ?? 0), 0);
  const yClicks = (yesterdayMetrics ?? []).reduce((s, m) => s + Number(m.clicks ?? 0), 0);

  // Revenue from reservations
  const todayRevenue = (todayReservations ?? []).reduce((s, r) => s + Number(r.revenue ?? 0), 0);
  const bookingsCount = todayReservations?.length ?? 0;

  const summary = {
    company: company?.name ?? 'Unknown',
    date: today,
    totals: {
      spend: totalSpend,
      impressions: totalImpressions,
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
      revenue: todayRevenue,
      bookings: bookingsCount,
    },
    vs_yesterday: {
      spend_delta: ySpend > 0 ? ((totalSpend - ySpend) / ySpend) * 100 : 0,
      clicks_delta: yClicks > 0 ? ((totalClicks - yClicks) / yClicks) * 100 : 0,
    },
    by_platform: byPlatform,
  };

  if (format === 'telegram') {
    const platformNames: Record<string, string> = {
      meta: '📘 Meta Ads',
      google_ads: '🔍 Google Ads',
      google_analytics: '📊 Google Analytics',
      instagram: '📸 Instagram',
      shiftos: '🏎️ ShiftOS',
      square: '🟩 Square',
      stripe: '💳 Stripe',
    };

    const lines: string[] = [
      `📊 *${summary.company} — Daily Report*`,
      `📅 ${today}`,
      '',
      `💰 *Revenue:* $${todayRevenue.toFixed(2)} (${bookingsCount} bookings)`,
      `💸 *Ad Spend:* $${totalSpend.toFixed(2)}`,
      `👆 *Clicks:* ${totalClicks} | *CTR:* ${summary.totals.ctr.toFixed(1)}%`,
      `🎯 *Conversions:* ${totalConversions} | *CPC:* $${summary.totals.cpc.toFixed(2)}`,
      '',
    ];

    // Per-platform breakdown
    for (const [platform, data] of Object.entries(byPlatform)) {
      const name = platformNames[platform] ?? platform;
      const parts: string[] = [];
      if (data.spend > 0) parts.push(`$${data.spend.toFixed(2)} spent`);
      if (data.clicks > 0) parts.push(`${data.clicks} clicks`);
      if (data.conversions > 0) parts.push(`${data.conversions} conv.`);
      if (data.impressions > 0 && !data.spend) parts.push(`${data.impressions} impr.`);
      if (parts.length > 0) {
        lines.push(`${name}: ${parts.join(' · ')}`);
      }
    }

    // vs yesterday
    if (ySpend > 0 || yClicks > 0) {
      lines.push('');
      const spendArrow = summary.vs_yesterday.spend_delta >= 0 ? '📈' : '📉';
      const clickArrow = summary.vs_yesterday.clicks_delta >= 0 ? '📈' : '📉';
      lines.push(`*vs Yesterday:* ${spendArrow} Spend ${summary.vs_yesterday.spend_delta >= 0 ? '+' : ''}${summary.vs_yesterday.spend_delta.toFixed(1)}% | ${clickArrow} Clicks ${summary.vs_yesterday.clicks_delta >= 0 ? '+' : ''}${summary.vs_yesterday.clicks_delta.toFixed(1)}%`);
    }

    return new NextResponse(lines.join('\n'), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  return NextResponse.json(summary);
}
