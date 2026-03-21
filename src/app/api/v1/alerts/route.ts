import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/auth';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { askClaude } from '@/lib/ai-summary';
import { sendTelegramMessage } from '@/lib/telegram';

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * POST /api/v1/alerts — N8N calls this to analyze metrics and decide whether to alert
 *
 * Body: { companyId, checkType: "spike" | "summary" | "purchase" }
 *
 * - "spike": Compares last 30min to previous 30min, alerts if >30% change
 * - "summary": Generates a 3-hour summary, always sends
 * - "purchase": Checks for new conversions since last check, alerts if found
 */
export async function POST(request: NextRequest) {
  const { valid } = await validateApiKey(request.headers.get('authorization'));
  if (!valid) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { companyId, checkType = 'spike' } = body as { companyId?: string; checkType?: string };

    const supabase = getAdminSupabase();
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

    // Get today's and yesterday's data
    const query = supabase
      .from('daily_metrics')
      .select('date, platform, spend, impressions, clicks, conversions, ctr, cpc')
      .gte('date', yesterday)
      .order('date', { ascending: false });

    if (companyId) query.eq('client_id', companyId);
    const { data: metrics } = await query;

    const todayRows = (metrics ?? []).filter((r) => r.date === today);
    const yesterdayRows = (metrics ?? []).filter((r) => r.date === yesterday);

    const sum = (rows: typeof todayRows) => ({
      spend: rows.reduce((s, r) => s + Number(r.spend), 0),
      impressions: rows.reduce((s, r) => s + Number(r.impressions), 0),
      clicks: rows.reduce((s, r) => s + Number(r.clicks), 0),
      conversions: rows.reduce((s, r) => s + Number(r.conversions), 0),
    });

    const todaySum = sum(todayRows);
    const yesterdaySum = sum(yesterdayRows);

    if (checkType === 'purchase') {
      // Check for new conversions
      if (todaySum.conversions > 0) {
        const costPerConv = todaySum.conversions > 0 ? todaySum.spend / todaySum.conversions : 0;
        const alert = await askClaude({
          systemPrompt: 'You are Karbon AI. Generate a brief Telegram alert about purchases/conversions. Use HTML formatting. 2-3 sentences max. Be specific with numbers.',
          userMessage: `Today: ${todaySum.conversions} conversions, $${todaySum.spend.toFixed(2)} spend, $${costPerConv.toFixed(2)} cost/conversion. Yesterday had ${yesterdaySum.conversions} conversions.`,
          maxTokens: 150,
        });
        if (CHAT_ID) await sendTelegramMessage(CHAT_ID, `🛒 <b>Purchase Update</b>\n\n${alert}`);
        return NextResponse.json({ alerted: true, type: 'purchase', conversions: todaySum.conversions });
      }
      return NextResponse.json({ alerted: false, type: 'purchase', reason: 'No conversions today' });
    }

    if (checkType === 'spike') {
      // Compare today vs yesterday — alert if >30% change in any metric
      const spikes: string[] = [];
      if (yesterdaySum.spend > 0) {
        const spendChange = ((todaySum.spend - yesterdaySum.spend) / yesterdaySum.spend) * 100;
        if (Math.abs(spendChange) > 30) spikes.push(`Spend ${spendChange > 0 ? '↑' : '↓'} ${Math.abs(spendChange).toFixed(0)}%`);
      }
      if (yesterdaySum.clicks > 0) {
        const clickChange = ((todaySum.clicks - yesterdaySum.clicks) / yesterdaySum.clicks) * 100;
        if (Math.abs(clickChange) > 30) spikes.push(`Clicks ${clickChange > 0 ? '↑' : '↓'} ${Math.abs(clickChange).toFixed(0)}%`);
      }
      if (yesterdaySum.conversions > 0) {
        const convChange = ((todaySum.conversions - yesterdaySum.conversions) / yesterdaySum.conversions) * 100;
        if (Math.abs(convChange) > 50) spikes.push(`Conversions ${convChange > 0 ? '↑' : '↓'} ${Math.abs(convChange).toFixed(0)}%`);
      }

      if (spikes.length > 0) {
        const analysis = await askClaude({
          systemPrompt: 'You are Karbon AI. A spike was detected in ad metrics. Analyze briefly and advise. HTML format for Telegram. 3 sentences max.',
          userMessage: `Spikes detected: ${spikes.join(', ')}.\n\nToday: $${todaySum.spend.toFixed(2)} spend, ${todaySum.impressions} impr, ${todaySum.clicks} clicks, ${todaySum.conversions} conv.\nYesterday: $${yesterdaySum.spend.toFixed(2)} spend, ${yesterdaySum.impressions} impr, ${yesterdaySum.clicks} clicks, ${yesterdaySum.conversions} conv.`,
          maxTokens: 200,
        });
        if (CHAT_ID) await sendTelegramMessage(CHAT_ID, `⚡ <b>Spike Alert</b>\n\n${analysis}`);
        return NextResponse.json({ alerted: true, type: 'spike', spikes });
      }
      return NextResponse.json({ alerted: false, type: 'spike', reason: 'No significant changes' });
    }

    if (checkType === 'summary') {
      // Always send a 3-hour summary
      const summary = await askClaude({
        systemPrompt: 'You are Karbon AI. Generate a concise 3-hour performance summary for Telegram. Compare today vs yesterday. HTML format. Start with an emoji. Under 150 words.',
        userMessage: `Today (${today}): $${todaySum.spend.toFixed(2)} spend, ${todaySum.impressions.toLocaleString()} impr, ${todaySum.clicks} clicks, ${todaySum.conversions} conversions.\nYesterday (${yesterday}): $${yesterdaySum.spend.toFixed(2)} spend, ${yesterdaySum.impressions.toLocaleString()} impr, ${yesterdaySum.clicks} clicks, ${yesterdaySum.conversions} conversions.\nPlatforms: ${[...new Set(todayRows.map((r) => r.platform))].join(', ') || 'none active'}`,
        maxTokens: 300,
      });
      if (CHAT_ID) await sendTelegramMessage(CHAT_ID, `📊 <b>3-Hour Summary</b>\n\n${summary}`);
      return NextResponse.json({ alerted: true, type: 'summary' });
    }

    return NextResponse.json({ error: 'Unknown checkType' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
