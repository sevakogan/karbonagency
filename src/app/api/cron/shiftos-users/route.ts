import { NextRequest, NextResponse } from 'next/server';
import { getMiamiNewUsers, getMiamiTotalUsers } from '@/lib/shiftos/client';
import { sendTelegramMessage } from '@/lib/telegram';
import { askClaude } from '@/lib/ai-summary';
import { getAdminSupabase } from '@/lib/supabase-admin';

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * GET /api/cron/shiftos-users
 * Runs at 9 AM PT and 3 PM PT.
 * Reports new Miami user signups cross-referenced with ad performance.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const todayStart = `${today}T00:00:00`;
  const sixHoursAgo = new Date(now.getTime() - 6 * 3600 * 1000).toISOString();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];

  try {
    const supabase = getAdminSupabase();

    // Pull ShiftOS data + ad metrics in parallel
    const [newUsersRecent, newUsersToday, totalUsers, adMetrics] = await Promise.all([
      getMiamiNewUsers(sixHoursAgo),
      getMiamiNewUsers(todayStart),
      getMiamiTotalUsers(),
      supabase
        .from('daily_metrics')
        .select('date, platform, spend, impressions, clicks, conversions')
        .gte('date', sevenDaysAgo)
        .order('date', { ascending: false }),
    ]);

    const adRows = adMetrics.data ?? [];

    // Today's ad stats
    const todayAds = adRows.filter((r) => r.date === today);
    const todaySpend = todayAds.reduce((s, r) => s + Number(r.spend), 0);
    const todayClicks = todayAds.reduce((s, r) => s + Number(r.clicks), 0);
    const todayConversions = todayAds.reduce((s, r) => s + Number(r.conversions), 0);
    const todayImpressions = todayAds.reduce((s, r) => s + Number(r.impressions), 0);

    // Last 7 days ad stats
    const weekSpend = adRows.reduce((s, r) => s + Number(r.spend), 0);
    const weekClicks = adRows.reduce((s, r) => s + Number(r.clicks), 0);
    const weekConversions = adRows.reduce((s, r) => s + Number(r.conversions), 0);

    // Per-platform breakdown
    const platformBreakdown: Record<string, { spend: number; clicks: number; conversions: number }> = {};
    for (const r of todayAds) {
      const p = r.platform === 'meta' ? 'Meta Ads' : r.platform === 'google_analytics' ? 'Google Analytics' : r.platform;
      const entry = platformBreakdown[p] ?? { spend: 0, clicks: 0, conversions: 0 };
      entry.spend += Number(r.spend);
      entry.clicks += Number(r.clicks);
      entry.conversions += Number(r.conversions);
      platformBreakdown[p] = entry;
    }

    // Format user list with signup times
    const userList = newUsersRecent.users.slice(0, 15).map((u) => {
      const signupTime = new Date(u.created).toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `  • ${u.first_name} ${u.last_name} — ${u.email}${u.phone ? ` — ${u.phone}` : ''} — ${signupTime}`;
    }).join('\n');

    const platformLines = Object.entries(platformBreakdown)
      .map(([name, d]) => `  • ${name}: $${d.spend.toFixed(2)} spent, ${d.clicks} clicks, ${d.conversions} conversions`)
      .join('\n');

    const context = `SHIFT ARCADE MIAMI — NEW USERS + AD ATTRIBUTION REPORT
Time: ${now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT

NEW SIGNUPS (last 6 hours): ${newUsersRecent.count}
${userList || '  (none)'}

TODAY TOTALS:
- New signups today: ${newUsersToday.count}
- Total Miami users: ${totalUsers.toLocaleString()}

TODAY'S AD PERFORMANCE (driving these signups):
- Total ad spend: $${todaySpend.toFixed(2)}
- Impressions: ${todayImpressions.toLocaleString()}
- Clicks: ${todayClicks}
- Ad conversions: ${todayConversions}
${platformLines ? `\nBY PLATFORM:\n${platformLines}` : ''}

COST PER NEW USER:
- Today: ${newUsersToday.count > 0 ? `$${(todaySpend / newUsersToday.count).toFixed(2)}` : 'N/A (no new users)'}
- This week avg: ${weekSpend > 0 ? `$${(weekSpend / Math.max(1, newUsersToday.count * 7)).toFixed(2)} estimated` : 'N/A'}

ATTRIBUTION ANALYSIS:
- ${todayClicks} ad clicks today → ${newUsersToday.count} signups = ${todayClicks > 0 ? ((newUsersToday.count / todayClicks) * 100).toFixed(1) : '0'}% click-to-signup rate
- Meta driving ${platformBreakdown['Meta Ads']?.clicks ?? 0} clicks ($${(platformBreakdown['Meta Ads']?.spend ?? 0).toFixed(2)})
- Google driving ${(platformBreakdown['Google Analytics']?.clicks ?? 0) + (platformBreakdown['Google Ads']?.clicks ?? 0)} sessions`;

    const analysis = await askClaude({
      systemPrompt: `You are Karbon AI for Shift Arcade Miami. Generate a new-users report for Telegram. Cross-reference signups with ad data to estimate which ads drove the signups.

Rules:
- Use HTML formatting (<b>bold</b>, <i>italic</i>)
- Start with 👤 emoji
- List each new user by name
- After user list, analyze: which platform likely drove these signups (Meta vs Google)
- Show cost per acquisition
- If signup time correlates with ad click spikes, mention it
- If zero new users, note that and suggest checking ad targeting
- Under 250 words
- Be specific with numbers`,
      userMessage: context,
      maxTokens: 500,
    });

    if (CHAT_ID) {
      await sendTelegramMessage(CHAT_ID, analysis);
    }

    return NextResponse.json({
      sent: true,
      newUsersRecent: newUsersRecent.count,
      newUsersToday: newUsersToday.count,
      totalUsers,
      todayAdSpend: todaySpend,
      todayClicks,
      costPerUser: newUsersToday.count > 0 ? todaySpend / newUsersToday.count : null,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
