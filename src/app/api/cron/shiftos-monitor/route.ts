import { NextRequest, NextResponse } from 'next/server';
import { getMiamiNewUsers, getMiamiNewReservations, getMiamiTotalUsers } from '@/lib/shiftos/client';
import { sendTelegramMessage } from '@/lib/telegram';
import { askClaude } from '@/lib/ai-summary';
import { getAdminSupabase } from '@/lib/supabase-admin';

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * GET /api/cron/shiftos-monitor
 * Runs every 3 hours via Vercel Cron.
 * Pulls new signups + new bookings from ShiftOS Miami,
 * combines with ad performance data, sends Claude-analyzed report to Telegram.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const threeHoursAgo = new Date(now.getTime() - 3 * 3600 * 1000).toISOString();
  const today = now.toISOString().split('T')[0];
  const todayStart = `${today}T00:00:00`;

  try {
    // Pull ShiftOS data
    const [newUsers3h, newBookings3h, newUsersToday, newBookingsToday, totalUsers] = await Promise.all([
      getMiamiNewUsers(threeHoursAgo),
      getMiamiNewReservations(threeHoursAgo),
      getMiamiNewUsers(todayStart),
      getMiamiNewReservations(todayStart),
      getMiamiTotalUsers(),
    ]);

    // Pull ad performance from Supabase
    const supabase = getAdminSupabase();
    const { data: todayMetrics } = await supabase
      .from('daily_metrics')
      .select('spend, impressions, clicks, conversions')
      .eq('date', today);

    const adSpend = (todayMetrics ?? []).reduce((s, r) => s + Number(r.spend), 0);
    const adClicks = (todayMetrics ?? []).reduce((s, r) => s + Number(r.clicks), 0);
    const adConversions = (todayMetrics ?? []).reduce((s, r) => s + Number(r.conversions), 0);

    // Build context for Claude
    const context = `SHIFT ARCADE MIAMI — 3-HOUR REPORT
Time: ${now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT

LAST 3 HOURS:
- New signups: ${newUsers3h.count}
- New bookings: ${newBookings3h.count}
${newUsers3h.users.slice(0, 5).map(u => `  • ${u.first_name} ${u.last_name} (${u.email})`).join('\n')}
${newBookings3h.reservations.slice(0, 5).map(r => `  • ${r.readonly_values.user_display_name} → ${r.readonly_values.calendar_name} at ${r.time.slice(11, 16)}`).join('\n')}

TODAY TOTALS:
- New signups today: ${newUsersToday.count}
- New bookings today: ${newBookingsToday.count}
- Total Miami users: ${totalUsers.toLocaleString()}

AD PERFORMANCE TODAY:
- Ad spend: $${adSpend.toFixed(2)}
- Clicks: ${adClicks}
- Ad conversions: ${adConversions}
- Cost per click: $${adClicks > 0 ? (adSpend / adClicks).toFixed(2) : '0.00'}

COST PER ACQUISITION:
- Cost per new signup: $${newUsersToday.count > 0 ? (adSpend / newUsersToday.count).toFixed(2) : 'N/A'}
- Cost per booking: $${newBookingsToday.count > 0 ? (adSpend / newBookingsToday.count).toFixed(2) : 'N/A'}`;

    // Generate Claude analysis
    const analysis = await askClaude({
      systemPrompt: `You are Karbon AI for Shift Arcade Miami. Generate a concise 3-hour Telegram report. Use HTML formatting (<b>bold</b>). Start with an emoji. Highlight: new signups, new bookings, ad efficiency. If no activity in last 3 hours, say so briefly. Compare cost per acquisition to ad spend. Under 200 words. Be specific with numbers.`,
      userMessage: context,
      maxTokens: 400,
    });

    // Send to Telegram
    if (CHAT_ID) {
      await sendTelegramMessage(CHAT_ID, analysis);
    }

    return NextResponse.json({
      sent: true,
      newUsers3h: newUsers3h.count,
      newBookings3h: newBookings3h.count,
      newUsersToday: newUsersToday.count,
      newBookingsToday: newBookingsToday.count,
      totalUsers,
      adSpend,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error('ShiftOS monitor error:', errorMsg);

    if (CHAT_ID) {
      await sendTelegramMessage(CHAT_ID, `⚠️ <b>ShiftOS Monitor Error</b>\n\n${errorMsg}`);
    }

    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
