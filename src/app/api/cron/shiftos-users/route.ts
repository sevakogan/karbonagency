import { NextRequest, NextResponse } from 'next/server';
import { getMiamiNewUsers, getMiamiTotalUsers } from '@/lib/shiftos/client';
import { sendTelegramMessage } from '@/lib/telegram';
import { askClaude } from '@/lib/ai-summary';

const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * GET /api/cron/shiftos-users
 * Runs at 9 AM PT and 3 PM PT.
 * Reports new Miami user signups.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const todayStart = now.toISOString().split('T')[0] + 'T00:00:00';
  const sixHoursAgo = new Date(now.getTime() - 6 * 3600 * 1000).toISOString();

  try {
    const [newUsersRecent, newUsersToday, totalUsers] = await Promise.all([
      getMiamiNewUsers(sixHoursAgo),
      getMiamiNewUsers(todayStart),
      getMiamiTotalUsers(),
    ]);

    const context = `SHIFT ARCADE MIAMI — NEW USERS REPORT
Time: ${now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT

LAST 6 HOURS:
- New signups: ${newUsersRecent.count}
${newUsersRecent.users.slice(0, 10).map(u => `  • ${u.first_name} ${u.last_name} — ${u.email} — ${u.phone || 'no phone'} — signed up ${new Date(u.created).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', hour: 'numeric', minute: '2-digit' })}`).join('\n')}

TODAY TOTAL:
- New signups today: ${newUsersToday.count}
- Total Miami users: ${totalUsers.toLocaleString()}`;

    const analysis = await askClaude({
      systemPrompt: 'You are Karbon AI for Shift Arcade Miami. Generate a brief new-users Telegram report. Use HTML formatting. Start with 👤 emoji. List each new user with their name. If zero new users, say so briefly. Under 150 words.',
      userMessage: context,
      maxTokens: 300,
    });

    if (CHAT_ID) {
      await sendTelegramMessage(CHAT_ID, analysis);
    }

    return NextResponse.json({
      sent: true,
      newUsersRecent: newUsersRecent.count,
      newUsersToday: newUsersToday.count,
      totalUsers,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}
