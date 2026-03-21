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

    // Any other message — treat as a question for Claude (enhanced with ShiftOS data)
    const metricsContext = await getMetricsContext();
    const insight = await askClaude({
      systemPrompt: 'You are Karbon AI, a marketing analytics assistant for Karbon Agency managing Shift Arcade Miami. You have access to BOTH real-time ad performance data AND live booking/reservation data from ShiftOS. When asked about reservations, bookings, signups, or attribution — use the ShiftOS data. Be concise, specific with numbers. Format for Telegram (HTML: <b>bold</b>). Under 200 words.',
      userMessage: `Here is the current data:\n\n${metricsContext}\n\nQuestion: ${text}`,
      maxTokens: 400,
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

  return `Companies: ${companyNames}
Date: ${today}

TODAY:
- Spend: $${todaySum.spend.toFixed(2)}
- Impressions: ${todaySum.impressions.toLocaleString()}
- Clicks: ${todaySum.clicks.toLocaleString()}
- Conversions: ${todaySum.conversions}
- CTR: ${todaySum.impressions > 0 ? ((todaySum.clicks / todaySum.impressions) * 100).toFixed(1) : 0}%
- CPC: $${todaySum.clicks > 0 ? (todaySum.spend / todaySum.clicks).toFixed(2) : '0.00'}

LAST 7 DAYS:
- Spend: $${weekSum.spend.toFixed(2)}
- Impressions: ${weekSum.impressions.toLocaleString()}
- Clicks: ${weekSum.clicks.toLocaleString()}
- Conversions: ${weekSum.conversions}
- Reach: ${weekSum.reach.toLocaleString()}
- CTR: ${weekSum.impressions > 0 ? ((weekSum.clicks / weekSum.impressions) * 100).toFixed(1) : 0}%
- CPC: $${weekSum.clicks > 0 ? (weekSum.spend / weekSum.clicks).toFixed(2) : '0.00'}

LAST 30 DAYS:
- Spend: $${monthSum.spend.toFixed(2)}
- Impressions: ${monthSum.impressions.toLocaleString()}
- Clicks: ${monthSum.clicks.toLocaleString()}
- Conversions: ${monthSum.conversions}
- CPM: $${monthSum.impressions > 0 ? ((monthSum.spend / monthSum.impressions) * 1000).toFixed(2) : '0.00'}${shiftosContext}`;
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
