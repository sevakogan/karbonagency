import { NextRequest, NextResponse } from 'next/server';
import { detectAnomalies } from '@/lib/anomaly-detection';

/**
 * GET /api/cron/anomaly-check
 *
 * Runs hourly. Detects anomalies and sends alerts via Telegram bot.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const anomalies = await detectAnomalies();

    if (anomalies.length === 0) {
      return NextResponse.json({ anomalies: [], message: 'No anomalies detected' });
    }

    // Send alerts via Telegram if bot token is configured
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (botToken && chatId) {
      const severityIcon: Record<string, string> = {
        critical: '🔴',
        warning: '🟡',
        info: '🟢',
      };

      const alertText = anomalies
        .map((a) => `${severityIcon[a.severity] ?? '⚪'} ${a.message}`)
        .join('\n\n');

      const header = anomalies.some((a) => a.severity === 'critical')
        ? '⚠️ *ALERT — Anomalies Detected*'
        : '📊 *Analytics Update*';

      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `${header}\n\n${alertText}`,
          parse_mode: 'Markdown',
        }),
      });
    }

    return NextResponse.json({
      anomalies,
      alerted: !!(botToken && chatId),
      message: `Detected ${anomalies.length} anomalies`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[anomaly-check] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
