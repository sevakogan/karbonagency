import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage, type TelegramUpdate } from '@/lib/telegram';
import { askClaude, generateAdInsight } from '@/lib/ai-summary';
import { getAdminSupabase } from '@/lib/supabase-admin';

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
        `Ask me anything about ads, bookings, or signups:\n` +
        `• "How are my ads doing?"\n` +
        `• "How many reservations today?"\n` +
        `• "Which ads are driving bookings?"\n` +
        `• "What's my spend this week?"\n` +
        `• "Give me a full report"\n\n` +
        `I have real-time ad data AND live booking data from ShiftOS.`
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

    // Any other message — treat as a question for Claude (enhanced with all data)
    const metricsContext = await getMetricsContext();
    const insight = await askClaude({
      systemPrompt: `You are Karbon AI, the business intelligence assistant for Shift Arcade Miami. You have access to:
- Real-time ad performance (Meta, Google, Instagram)
- Live booking/reservation data from ShiftOS
- Square iPad POS revenue data
- ShiftOS Stripe revenue data
- Customer lifecycle data (active, medium risk, high risk, churned)
- Membership/APEX subscriber info
- P&L breakdown with merchant fees and franchise fees
- Individual customer history (visits, spend, status)
- 8 Miami simulators: Hamilton-Mia, Verstappen-Mia (Ultimate $40), Norris-Mia, Piastri-Mia, Russell-Mia, Leclerc-Mia (Haptic $35), Antonelli-Mia, Sainz-Mia (Non-Motion $30)

Be concise, specific with numbers. Format for Telegram (HTML: <b>bold</b>). Under 250 words. When asked about revenue, use the real revenue data (ShiftOS Stripe + Square iPad). When asked about a specific customer, use the customer data.`,
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
