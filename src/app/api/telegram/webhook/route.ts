import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, type TelegramUpdate } from '@/lib/telegram';
import { askClaude, generateAdInsight } from '@/lib/ai-summary';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { detectAnomalies } from '@/lib/anomaly-detection';
import { predictChurn } from '@/lib/churn-prediction';
import { forecastRevenue } from '@/lib/revenue-forecast';

const BOT_SYSTEM_PROMPT = `You are Karbon AI, the business intelligence assistant for Shift Arcade Miami. You have access to:
- Real-time ad performance (Meta, Google, Instagram)
- Live booking/reservation data from ShiftOS
- Square iPad POS revenue data
- ShiftOS Stripe revenue data
- Customer lifecycle data (active, medium risk, high risk, churned)
- Membership/APEX subscriber info
- P&L breakdown with merchant fees and franchise fees
- Individual customer history (visits, spend, status)
- Refund data from ShiftOS charges
- Ad creative performance from Meta
- Google/Yelp review data and ratings
- Organic search / SEO data from Google Search Console
- Anomaly detection alerts
- Cohort retention analysis
- Monthly ad budget pacing
- Predictive churn model (customer risk scores 0-100, risk levels, win-back urgency)
- 30-day revenue forecasting with day-of-week seasonality and confidence intervals
- 8 Miami simulators: Hamilton-Mia, Verstappen-Mia (Ultimate $40), Norris-Mia, Piastri-Mia, Russell-Mia, Leclerc-Mia (Haptic $35), Antonelli-Mia, Sainz-Mia (Non-Motion $30)

Be concise, specific with numbers. Format for Telegram (HTML: <b>bold</b>). Under 250 words. When asked about revenue, use the real revenue data (ShiftOS Stripe + Square iPad). When asked about a specific customer, use the customer data.`;

export async function POST(request: NextRequest) {
  try {
    const update: TelegramUpdate = await request.json();
    const message = update.message;
    if (!message?.text || !message.chat) {
      return NextResponse.json({ ok: true });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();

    // Commands
    if (text === '/start') {
      await sendTelegramMessage(chatId,
        `<b>🔴 Karbon Shift Bot</b>\n\n` +
        `I'm your AI marketing assistant powered by Claude.\n\n` +
        `Ask me anything:\n` +
        `• "How are my ads doing?"\n` +
        `• "Which ads are performing best?" — creatives\n` +
        `• "What's my refund rate?" — refund data\n` +
        `• "How are my reviews?" — Google/Yelp\n` +
        `• "Show me organic search" — SEO data\n` +
        `• "Any anomalies?" — health check\n` +
        `• "Show me cohorts" — retention\n` +
        `• "Budget pacing" — spend vs budget\n` +
        `• "Churn" — who's at risk of leaving\n` +
        `• "Forecast" — 30-day revenue projection\n` +
        `• "Give me a full report"\n\n` +
        `I have real-time ad data, booking data, reviews, SEO, and more.`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === '/report') {
      const metricsContext = await getMetricsContext();
      const insight = await generateAdInsight(metricsContext, 'Give me a full performance report for today and this week. Include all key metrics.');
      await sendTelegramMessage(chatId, `<b>📊 Performance Report</b>\n\n${insight}`);
      return NextResponse.json({ ok: true });
    }

    if (text === '/status') {
      const status = await getSystemStatus();
      await sendTelegramMessage(chatId, status);
      return NextResponse.json({ ok: true });
    }

    // ── Topic-specific handlers (fetch extra data for Claude) ──
    const lower = text.toLowerCase();

    // Refund rate
    if (lower.includes('refund')) {
      const refundData = await fetchRefundData();
      const metricsContext = await getMetricsContext();
      const answer = await askClaude({
        systemPrompt: BOT_SYSTEM_PROMPT,
        userMessage: `${metricsContext}\n\n═══ REFUND DATA ═══\n${refundData}\n\nQuestion: ${text}`,
        maxTokens: 500,
      });
      await sendTelegramMessage(chatId, answer);
      return NextResponse.json({ ok: true });
    }

    // Ad creatives
    if (lower.includes('creative') || lower.includes('which ads') || (lower.includes('ads') && lower.includes('perform'))) {
      const creativesData = await fetchCreativesData();
      const metricsContext = await getMetricsContext();
      const answer = await askClaude({
        systemPrompt: BOT_SYSTEM_PROMPT,
        userMessage: `${metricsContext}\n\n═══ AD CREATIVES ═══\n${creativesData}\n\nQuestion: ${text}`,
        maxTokens: 500,
      });
      await sendTelegramMessage(chatId, answer);
      return NextResponse.json({ ok: true });
    }

    // Reviews / rating
    if (lower.includes('review') || lower.includes('rating')) {
      const reviewData = await fetchReviewsData();
      const metricsContext = await getMetricsContext();
      const answer = await askClaude({
        systemPrompt: BOT_SYSTEM_PROMPT,
        userMessage: `${metricsContext}\n\n═══ REVIEWS ═══\n${reviewData}\n\nQuestion: ${text}`,
        maxTokens: 500,
      });
      await sendTelegramMessage(chatId, answer);
      return NextResponse.json({ ok: true });
    }

    // Organic / SEO
    if (lower.includes('organic') || lower.includes('seo') || lower.includes('search console')) {
      const organicData = await fetchOrganicData();
      const metricsContext = await getMetricsContext();
      const answer = await askClaude({
        systemPrompt: BOT_SYSTEM_PROMPT,
        userMessage: `${metricsContext}\n\n═══ ORGANIC SEARCH ═══\n${organicData}\n\nQuestion: ${text}`,
        maxTokens: 500,
      });
      await sendTelegramMessage(chatId, answer);
      return NextResponse.json({ ok: true });
    }

    // Anomalies
    if (lower.includes('anomal') || lower.includes('anything wrong') || lower.includes('anything off') || lower.includes('issues')) {
      const anomalies = await detectAnomalies();
      const anomalyStr = anomalies.length === 0
        ? 'No anomalies detected. Everything looks normal.'
        : anomalies.map((a) => `[${a.severity.toUpperCase()}] ${a.message} (${a.metric}: ${a.current} vs baseline ${a.baseline}, ${a.change_pct > 0 ? '+' : ''}${a.change_pct.toFixed(1)}%)`).join('\n');
      const metricsContext = await getMetricsContext();
      const answer = await askClaude({
        systemPrompt: BOT_SYSTEM_PROMPT,
        userMessage: `${metricsContext}\n\n═══ ANOMALY CHECK ═══\n${anomalyStr}\n\nQuestion: ${text}`,
        maxTokens: 500,
      });
      await sendTelegramMessage(chatId, answer);
      return NextResponse.json({ ok: true });
    }

    // Cohorts / retention
    if (lower.includes('cohort') || lower.includes('retention') || lower.includes('repeat rate')) {
      const cohortData = await fetchCohortData();
      const metricsContext = await getMetricsContext();
      const answer = await askClaude({
        systemPrompt: BOT_SYSTEM_PROMPT,
        userMessage: `${metricsContext}\n\n═══ COHORT / RETENTION ═══\n${cohortData}\n\nQuestion: ${text}`,
        maxTokens: 500,
      });
      await sendTelegramMessage(chatId, answer);
      return NextResponse.json({ ok: true });
    }

    // Churn prediction
    if (lower.includes('churn') || lower.includes('who\'s leaving') || lower.includes('at risk customers') || lower.includes('who is leaving')) {
      const churnStr = await fetchChurnData();
      const metricsContext = await getMetricsContext();
      const answer = await askClaude({
        systemPrompt: BOT_SYSTEM_PROMPT,
        userMessage: `${metricsContext}\n\n═══ CHURN PREDICTION ═══\n${churnStr}\n\nQuestion: ${text}`,
        maxTokens: 500,
      });
      await sendTelegramMessage(chatId, answer);
      return NextResponse.json({ ok: true });
    }

    // Revenue forecast
    if (lower.includes('forecast') || lower.includes('projection') || lower.includes('next month') || lower.includes('predict revenue')) {
      const forecastStr = await fetchForecastData();
      const metricsContext = await getMetricsContext();
      const answer = await askClaude({
        systemPrompt: BOT_SYSTEM_PROMPT,
        userMessage: `${metricsContext}\n\n═══ REVENUE FORECAST ═══\n${forecastStr}\n\nQuestion: ${text}`,
        maxTokens: 500,
      });
      await sendTelegramMessage(chatId, answer);
      return NextResponse.json({ ok: true });
    }

    // Budget pacing
    if (lower.includes('budget') || lower.includes('pacing') || lower.includes('over budget') || lower.includes('underspend')) {
      const budgetData = await fetchBudgetPacing();
      const metricsContext = await getMetricsContext();
      const answer = await askClaude({
        systemPrompt: BOT_SYSTEM_PROMPT,
        userMessage: `${metricsContext}\n\n═══ BUDGET PACING ═══\n${budgetData}\n\nQuestion: ${text}`,
        maxTokens: 500,
      });
      await sendTelegramMessage(chatId, answer);
      return NextResponse.json({ ok: true });
    }

    // Any other message — treat as a question for Claude (enhanced with all data)
    const metricsContext = await getMetricsContext();
    const insight = await askClaude({
      systemPrompt: BOT_SYSTEM_PROMPT,
      userMessage: `Here is the current data:\n\n${metricsContext}\n\nQuestion: ${text}`,
      maxTokens: 500,
    });
    await sendTelegramMessage(chatId, insight);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Telegram webhook error:', err);
    return NextResponse.json({ ok: true }); // Always return 200 to Telegram
  }
}

async function getMetricsContext(): Promise<string> {
  const supabase = getAdminSupabase();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0];

  // Get company info
  const { data: companies } = await supabase
    .from('clients')
    .select('id, name')
    .eq('is_active', true);

  // Get recent metrics
  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('client_id, date, platform, spend, impressions, clicks, conversions, ctr, cpc, cpm, reach')
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: false });

  if (!metrics || metrics.length === 0) return 'No ad data available yet.';

  // Build ShiftOS + ad platform breakdown from Supabase (already synced by cron)
  const todayRows = (metrics ?? []).filter((r) => r.date === today);
  const shiftosRows = todayRows.filter((r) => r.platform === 'shiftos');
  const adRows = todayRows.filter((r) => r.platform !== 'shiftos');

  const todayReservations = shiftosRows.reduce((s, r) => s + Number(r.conversions), 0);
  const todaySignups = shiftosRows.reduce((s, r) => s + Number(r.clicks), 0);
  const todayTotalUsers = shiftosRows.reduce((s, r) => s + Number(r.reach), 0);

  const todayAdSpend: Record<string, number> = {};
  for (const row of adRows) {
    todayAdSpend[row.platform] = (todayAdSpend[row.platform] ?? 0) + Number(row.spend);
  }
  const totalAdSpendToday = Object.values(todayAdSpend).reduce((a, b) => a + b, 0);
  const platformBreakdown = Object.entries(todayAdSpend)
    .map(([p, s]) => `  • ${p}: $${s.toFixed(2)}`)
    .join('\n');
  const adPlatforms = Object.keys(todayAdSpend);

  const shiftosContext = `\nSHIFT ARCADE BOOKINGS (from Karbon Agency):
- Reservations made today: ${todayReservations}
- New user signups today: ${todaySignups}
- Total Miami users: ${todayTotalUsers.toLocaleString()}

AD SPEND BY PLATFORM TODAY:
${platformBreakdown || '  No ad data yet'}
- Est. cost per reservation: $${todayReservations > 0 ? (totalAdSpendToday / todayReservations).toFixed(2) : 'N/A'}
- Est. cost per signup: $${todaySignups > 0 ? (totalAdSpendToday / todaySignups).toFixed(2) : 'N/A'}
- Active ad platforms: ${adPlatforms.join(', ') || 'None'}`;

  // Build context string (exclude shiftos from ad summaries to avoid double-counting)
  const rows = metrics;
  const allAdRows = rows.filter((r) => r.platform !== 'shiftos');
  const todayAdSummary = allAdRows.filter((r) => r.date === today);
  const weekRows = allAdRows.filter((r) => r.date >= sevenDaysAgo);

  const sumRows = (rs: typeof rows) => ({
    spend: rs.reduce((s, r) => s + Number(r.spend), 0),
    impressions: rs.reduce((s, r) => s + Number(r.impressions), 0),
    clicks: rs.reduce((s, r) => s + Number(r.clicks), 0),
    conversions: rs.reduce((s, r) => s + Number(r.conversions), 0),
    reach: rs.reduce((s, r) => s + Number(r.reach), 0),
  });

  const todaySum = sumRows(todayAdSummary);
  const weekSum = sumRows(weekRows);
  const monthSum = sumRows(allAdRows);

  const companyNames = (companies ?? []).map((c) => c.name).join(', ');
  const CID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';

  // ── Revenue data from daily_metrics (CSV import — real ShiftOS + Square) ──
  const { data: revMetrics } = await supabase
    .from('daily_metrics')
    .select('date, cost_per_conversion, impressions, reach, video_views, leads')
    .eq('client_id', CID)
    .eq('platform', 'shiftos')
    .order('date', { ascending: false });

  const todayRev = (revMetrics ?? []).find((m) => m.date === today);
  const todayRevenue = todayRev ? Number(todayRev.cost_per_conversion ?? 0) : 0;
  const todayShiftosRev = todayRev ? Number(todayRev.impressions ?? 0) / 100 : 0;
  const todaySquareRev = todayRev ? Number(todayRev.reach ?? 0) / 100 : 0;

  const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthRevRows = (revMetrics ?? []).filter((m) => m.date.startsWith(thisMonthStr));
  const monthRevenue = monthRevRows.reduce((s, m) => s + Number(m.cost_per_conversion ?? 0), 0);

  const lifetimeRevenue = (revMetrics ?? []).reduce((s, m) => s + Number(m.cost_per_conversion ?? 0), 0);
  const lifetimeShiftos = (revMetrics ?? []).reduce((s, m) => s + Number(m.impressions ?? 0) / 100, 0);
  const lifetimeSquare = (revMetrics ?? []).reduce((s, m) => s + Number(m.reach ?? 0) / 100, 0);

  // ── Customer health stats ──
  const { count: totalCustomers } = await supabase.from('shiftos_customers').select('*', { count: 'exact', head: true }).eq('company_id', CID);
  const { count: activeCount } = await supabase.from('shiftos_customers').select('*', { count: 'exact', head: true }).eq('company_id', CID).gt('total_bookings', 0).gte('last_booking_at', new Date(now.getTime() - 30 * 86400000).toISOString());
  const { count: totalWithBookings } = await supabase.from('shiftos_customers').select('*', { count: 'exact', head: true }).eq('company_id', CID).gt('total_bookings', 0);

  // ── Top 5 customers ──
  const { data: topCustomers } = await supabase.from('shiftos_customers')
    .select('first_name, last_name, total_bookings, total_revenue')
    .eq('company_id', CID)
    .order('total_revenue', { ascending: false })
    .limit(5);

  // ── APEX members ──
  const { count: apexCount } = await supabase.from('shiftos_customers').select('*', { count: 'exact', head: true }).eq('company_id', CID);

  // ── Recent bookings today ──
  const { data: todayBookings } = await supabase.from('shiftos_reservations')
    .select('calendar_name, booking_time, paid, sim_count')
    .eq('company_id', CID)
    .gte('booking_time', `${today}T00:00:00`)
    .order('booking_time', { ascending: false })
    .limit(10);

  // ── P&L ──
  const merchantFees = lifetimeRevenue * 0.031; // ~3.1% avg
  const franchiseFees = lifetimeRevenue * 0.08; // 8%
  const netProfit = lifetimeRevenue - merchantFees - franchiseFees;

  const topCustStr = (topCustomers ?? []).map((c) =>
    `  • ${c.first_name} ${c.last_name}: $${c.total_revenue} (${c.total_bookings} visits)`
  ).join('\n');

  const todayBookingsStr = (todayBookings ?? []).map((b) =>
    `  • ${b.calendar_name} @ ${b.booking_time?.substring(11, 16)} (${b.paid ? 'Paid' : 'Unpaid'}, ${b.sim_count} sims)`
  ).join('\n');

  return `Companies: ${companyNames}
Date: ${today}

═══ REVENUE ═══
TODAY: $${todayRevenue.toFixed(2)} (ShiftOS: $${todayShiftosRev.toFixed(2)}, Square: $${todaySquareRev.toFixed(2)})
THIS MONTH: $${monthRevenue.toFixed(2)}
LIFETIME: $${lifetimeRevenue.toFixed(2)} (ShiftOS Stripe: $${lifetimeShiftos.toFixed(2)}, Square iPad: $${lifetimeSquare.toFixed(2)})

═══ P&L ═══
Gross: $${lifetimeRevenue.toFixed(2)}
Merchant Fees (~3.1%): -$${merchantFees.toFixed(2)}
Franchise Fees (8%): -$${franchiseFees.toFixed(2)}
Net Profit: $${netProfit.toFixed(2)} (${((netProfit / lifetimeRevenue) * 100).toFixed(1)}% margin)

═══ CUSTOMERS ═══
Total customers: ${totalCustomers ?? 0}
With bookings: ${totalWithBookings ?? 0}
Active (last 30d): ${activeCount ?? 0}

TOP 5 BY REVENUE:
${topCustStr || '  No data'}

═══ TODAY'S BOOKINGS ═══
${todayBookingsStr || '  No bookings today'}

═══ SIMULATORS (8 Miami) ═══
Ultimate ($40/30min): Hamilton-Mia, Verstappen-Mia
Haptic ($35/30min): Norris-Mia, Piastri-Mia, Russell-Mia, Leclerc-Mia
Non-Motion ($30/30min): Antonelli-Mia, Sainz-Mia

═══ AD PERFORMANCE ═══
TODAY:
- Spend: $${todaySum.spend.toFixed(2)}
- Impressions: ${todaySum.impressions.toLocaleString()}
- Clicks: ${todaySum.clicks.toLocaleString()}
- Conversions: ${todaySum.conversions}

LAST 7 DAYS:
- Spend: $${weekSum.spend.toFixed(2)}
- Clicks: ${weekSum.clicks.toLocaleString()}
- Conversions: ${weekSum.conversions}

LAST 30 DAYS:
- Spend: $${monthSum.spend.toFixed(2)}
- Clicks: ${monthSum.clicks.toLocaleString()}
- Conversions: ${monthSum.conversions}
${shiftosContext}`;
}

async function getSystemStatus(): Promise<string> {
  const supabase = getAdminSupabase();
  const { data: integrations } = await supabase
    .from('company_integrations')
    .select('platform_slug, status, last_synced_at, error_message')
    .eq('is_enabled', true);

  let status = '<b>🔌 System Status</b>\n\n';
  for (const i of integrations ?? []) {
    const icon = i.status === 'connected' ? '🟢' : i.status === 'error' ? '🔴' : '⚪';
    const synced = i.last_synced_at ? new Date(i.last_synced_at).toLocaleString() : 'Never';
    status += `${icon} <b>${i.platform_slug}</b> — ${i.status}\n`;
    status += `   Last sync: ${synced}\n`;
    if (i.error_message) status += `   ⚠️ ${i.error_message}\n`;
    status += '\n';
  }
  return status;
}

// ── New data fetchers for extended bot commands ──────────

const CID_MIAMI = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';

async function fetchRefundData(): Promise<string> {
  try {
    const supabase = getAdminSupabase();
    const { data: charges } = await supabase
      .from('shiftos_charges')
      .select('amount, refunded')
      .eq('company_id', CID_MIAMI);

    const all = charges ?? [];
    const totalCharges = all.length;
    const totalAmount = all.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const refunded = all.filter((c) => c.refunded);
    const refundCount = refunded.length;
    const refundAmount = refunded.reduce((s, c) => s + (Number(c.amount) || 0), 0);
    const refundRate = totalCharges > 0 ? ((refundCount / totalCharges) * 100).toFixed(1) : '0';

    return `Total charges: ${totalCharges}\nTotal charged: $${totalAmount.toFixed(2)}\nRefunds: ${refundCount} ($${refundAmount.toFixed(2)})\nRefund rate: ${refundRate}%\nNet after refunds: $${(totalAmount - refundAmount).toFixed(2)}`;
  } catch (err) {
    console.error('fetchRefundData error:', err);
    return 'Refund data unavailable.';
  }
}

async function fetchCreativesData(): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/meta/creative-performance`, {
      headers: { 'x-api-key': process.env.INGEST_API_KEY ?? '' },
    });
    if (!res.ok) return 'Creative data unavailable.';
    const data = await res.json();
    const creatives = data.creatives ?? data.ads ?? [];
    if (creatives.length === 0) return 'No ad creatives found.';

    return creatives.slice(0, 10).map((ad: { name: string; status: string; spend: number; impressions: number; clicks: number; ctr: number; conversions: number }) =>
      `• ${ad.name} (${ad.status}): $${Number(ad.spend).toFixed(2)} spend, ${ad.impressions} impr, ${ad.clicks} clicks, CTR ${Number(ad.ctr).toFixed(2)}%, ${ad.conversions ?? 0} conv`
    ).join('\n');
  } catch (err) {
    console.error('fetchCreativesData error:', err);
    return 'Creative data unavailable.';
  }
}

async function fetchReviewsData(): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/marketing/reviews`, {
      headers: { 'x-api-key': process.env.INGEST_API_KEY ?? '' },
    });
    if (!res.ok) return 'Review data unavailable.';
    const data = await res.json();

    const lines = [
      `Overall rating: ${data.avg_rating ?? 'N/A'} (${data.total_count ?? 0} reviews)`,
      `Google: ${data.google_avg ?? 'N/A'} (${data.google_count ?? 0})`,
      `Yelp: ${data.yelp_avg ?? 'N/A'} (${data.yelp_count ?? 0})`,
    ];

    if (data.recent && data.recent.length > 0) {
      lines.push('\nRecent reviews:');
      for (const r of data.recent.slice(0, 5)) {
        lines.push(`  • ${r.author_name}: ${r.rating}★ on ${r.platform} — "${(r.text ?? '').slice(0, 80)}"`);
      }
    }

    return lines.join('\n');
  } catch (err) {
    console.error('fetchReviewsData error:', err);
    return 'Review data unavailable.';
  }
}

async function fetchOrganicData(): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/marketing/organic?period=30d`, {
      headers: { 'x-api-key': process.env.INGEST_API_KEY ?? '' },
    });
    if (!res.ok) return 'Organic data unavailable.';
    const data = await res.json();

    const lines = [
      `Total clicks (30d): ${data.total_clicks ?? 'N/A'}`,
      `Total impressions (30d): ${data.total_impressions ?? 'N/A'}`,
      `Avg CTR: ${data.avg_ctr != null ? `${Number(data.avg_ctr).toFixed(2)}%` : 'N/A'}`,
      `Avg position: ${data.avg_position != null ? Number(data.avg_position).toFixed(1) : 'N/A'}`,
    ];

    if (data.top_queries && data.top_queries.length > 0) {
      lines.push('\nTop queries:');
      for (const q of data.top_queries.slice(0, 5)) {
        lines.push(`  • "${q.query}": ${q.clicks} clicks, pos ${Number(q.position).toFixed(1)}`);
      }
    }

    return lines.join('\n');
  } catch (err) {
    console.error('fetchOrganicData error:', err);
    return 'Organic data unavailable.';
  }
}

async function fetchCohortData(): Promise<string> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000';
    const res = await fetch(`${baseUrl}/api/marketing/cohorts`, {
      headers: { 'x-api-key': process.env.INGEST_API_KEY ?? '' },
    });
    if (!res.ok) return 'Cohort data unavailable.';
    const data = await res.json();

    const cohorts = data.cohorts ?? [];
    if (cohorts.length === 0) return 'No cohort data available.';

    const lines = [`Total cohorts: ${cohorts.length}`];
    for (const c of cohorts.slice(0, 6)) {
      const retentionStr = (c.retention_rates ?? []).slice(0, 4).map((r: number) => `${(r * 100).toFixed(0)}%`).join(' → ');
      lines.push(`  • ${c.cohort_month}: ${c.customer_count} customers, retention: ${retentionStr}`);
    }

    return lines.join('\n');
  } catch (err) {
    console.error('fetchCohortData error:', err);
    return 'Cohort data unavailable.';
  }
}

async function fetchBudgetPacing(): Promise<string> {
  try {
    const supabase = getAdminSupabase();
    const now = new Date();
    const thisMonthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const today = now.toISOString().split('T')[0];
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();

    // Get all ad spend this month (exclude shiftos)
    const { data: monthMetrics } = await supabase
      .from('daily_metrics')
      .select('spend, platform')
      .eq('client_id', CID_MIAMI)
      .neq('platform', 'shiftos')
      .gte('date', thisMonthStart)
      .lte('date', today);

    const totalSpent = (monthMetrics ?? []).reduce((s, m) => s + (Number(m.spend) || 0), 0);

    // Get campaign budgets
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('name, monthly_cost')
      .eq('client_id', CID_MIAMI)
      .eq('status', 'active');

    const totalBudget = (campaigns ?? []).reduce((s, c) => s + (Number(c.monthly_cost) || 0), 0);
    const pacingPct = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
    const expectedPct = (dayOfMonth / daysInMonth) * 100;
    const dailyAvg = dayOfMonth > 0 ? totalSpent / dayOfMonth : 0;
    const projectedEom = dailyAvg * daysInMonth;

    const status = pacingPct > expectedPct + 10 ? 'OVER PACING'
      : pacingPct < expectedPct - 10 ? 'UNDER PACING'
      : 'ON TRACK';

    return [
      `Month: ${thisMonthStart.substring(0, 7)} (day ${dayOfMonth}/${daysInMonth})`,
      `Total budget: $${totalBudget.toFixed(2)}`,
      `Spent so far: $${totalSpent.toFixed(2)} (${pacingPct.toFixed(1)}%)`,
      `Expected at this point: ${expectedPct.toFixed(1)}%`,
      `Daily avg: $${dailyAvg.toFixed(2)}`,
      `Projected EOM: $${projectedEom.toFixed(2)}`,
      `Status: ${status}`,
      campaigns && campaigns.length > 0 ? `\nCampaigns:\n${campaigns.map((c) => `  • ${c.name}: $${Number(c.monthly_cost).toFixed(2)}/mo`).join('\n')}` : '',
    ].filter(Boolean).join('\n');
  } catch (err) {
    console.error('fetchBudgetPacing error:', err);
    return 'Budget data unavailable.';
  }
}

async function fetchChurnData(): Promise<string> {
  try {
    const result = await predictChurn();
    const { summary, customers } = result;

    const lines = [
      `Summary: ${summary.safe} safe, ${summary.watch} watch, ${summary.at_risk} at risk, ${summary.critical} critical`,
      `Revenue at risk: $${summary.total_at_risk_revenue.toLocaleString()}`,
      '',
      'Top 5 highest-risk customers:',
    ];

    for (const c of customers.slice(0, 5)) {
      lines.push(`  • ${c.name} — score ${c.churn_score}/100 (${c.risk_level}) — $${c.lifetime_value} LTV — ${c.last_booking_days}d since last visit — urgency: ${c.win_back_urgency}`);
      lines.push(`    Factors: ${c.factors.join(', ')}`);
    }

    return lines.join('\n');
  } catch (err) {
    console.error('fetchChurnData error:', err);
    return 'Churn data unavailable.';
  }
}

async function fetchForecastData(): Promise<string> {
  try {
    const result = await forecastRevenue();
    const { summary, basis } = result;

    const trendStr = summary.trend === 'growing'
      ? `Growing +${summary.trend_pct}%`
      : summary.trend === 'declining'
      ? `Declining ${summary.trend_pct}%`
      : 'Stable';

    const lines = [
      `Projected 30-day revenue: $${summary.projected_30d_revenue.toLocaleString()}`,
      `Confidence range: $${summary.confidence_low.toLocaleString()} — $${summary.confidence_high.toLocaleString()}`,
      `Avg daily projected: $${summary.avg_daily_projected.toLocaleString()}`,
      `Trend: ${trendStr}`,
      `Best day: ${summary.best_day}`,
      `Worst day: ${summary.worst_day}`,
      `Weekend vs weekday ratio: ${summary.weekend_vs_weekday_ratio}x`,
      '',
      `Based on ${basis.days_of_history} days of history`,
      `Recent 7d avg: $${basis.avg_daily_revenue_7d}/day`,
      `Recent 30d avg: $${basis.avg_daily_revenue_30d}/day`,
    ];

    return lines.join('\n');
  } catch (err) {
    console.error('fetchForecastData error:', err);
    return 'Forecast data unavailable.';
  }
}
