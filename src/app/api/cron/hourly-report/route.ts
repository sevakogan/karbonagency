import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { sendTelegramMessage } from '@/lib/telegram';
import { generateHourlySummary, generateConversionAlert } from '@/lib/ai-summary';

// Seva's Telegram chat ID — will be set after first /start message
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!CHAT_ID) {
    return NextResponse.json({ error: 'TELEGRAM_CHAT_ID not set. Send /start to the bot first.' }, { status: 400 });
  }

  const supabase = getAdminSupabase();
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0];

  // Get today's and yesterday's metrics
  const { data: todayMetrics } = await supabase
    .from('daily_metrics')
    .select('spend, impressions, clicks, conversions, platform')
    .eq('date', today);

  const { data: yesterdayMetrics } = await supabase
    .from('daily_metrics')
    .select('spend, impressions, clicks, conversions, platform')
    .eq('date', yesterday);

  const sum = (rows: Array<{ spend: number; impressions: number; clicks: number; conversions: number }>) => ({
    spend: rows.reduce((s, r) => s + Number(r.spend), 0),
    impressions: rows.reduce((s, r) => s + Number(r.impressions), 0),
    clicks: rows.reduce((s, r) => s + Number(r.clicks), 0),
    conversions: rows.reduce((s, r) => s + Number(r.conversions), 0),
  });

  const todaySum = sum(todayMetrics ?? []);
  const yesterdaySum = sum(yesterdayMetrics ?? []);

  // Check for new conversions since last check
  // (We compare current conversions to what we had last hour)
  const { data: lastCheck } = await supabase
    .from('api_keys') // Reusing api_keys table's metadata temporarily
    .select('last_used_at')
    .eq('name', '_hourly_conversion_check')
    .single();

  const previousConversions = lastCheck ? parseInt(String(lastCheck.last_used_at) || '0') : 0;
  const currentConversions = todaySum.conversions;

  if (currentConversions > previousConversions && previousConversions > 0) {
    // New conversions detected!
    const newConversions = currentConversions - previousConversions;
    const alertText = `🎉 ${newConversions} new conversion${newConversions > 1 ? 's' : ''} detected!\n\nToday's total: ${currentConversions} conversions from $${todaySum.spend.toFixed(2)} spend.\nCost per conversion: $${currentConversions > 0 ? (todaySum.spend / currentConversions).toFixed(2) : '0.00'}`;

    const aiAlert = await generateConversionAlert(alertText);
    await sendTelegramMessage(CHAT_ID, aiAlert);
  }

  // Generate hourly summary
  const metricsData = `Today (${today}): Spend $${todaySum.spend.toFixed(2)}, ${todaySum.impressions.toLocaleString()} impressions, ${todaySum.clicks} clicks, ${todaySum.conversions} conversions.
Yesterday (${yesterday}): Spend $${yesterdaySum.spend.toFixed(2)}, ${yesterdaySum.impressions.toLocaleString()} impressions, ${yesterdaySum.clicks} clicks, ${yesterdaySum.conversions} conversions.
Platforms: ${[...new Set((todayMetrics ?? []).map((m) => m.platform))].join(', ') || 'none'}`;

  const summary = await generateHourlySummary(metricsData);
  await sendTelegramMessage(CHAT_ID, `<b>📈 Hourly Update</b>\n\n${summary}`);

  return NextResponse.json({
    sent: true,
    todayConversions: currentConversions,
    timestamp: now.toISOString(),
  });
}
