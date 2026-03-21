import { NextRequest, NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/lib/telegram';
import { askClaude } from '@/lib/ai-summary';

const VM_IP = '178.156.254.2';
const N8N_PORT = 5678;
const N8N_URL = `http://${VM_IP}:${N8N_PORT}`;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

/**
 * GET /api/cron/vm-watchdog
 * Runs every 30 min via Vercel Cron.
 * Checks if N8N VM is responding. If not, alerts via Telegram.
 * NOTE: Vercel serverless can't SSH — for auto-restart, use a separate
 * systemd watchdog on the VM itself or a secondary health check service.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  let isUp = false;
  let responseTime = 0;
  let statusCode = 0;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch(N8N_URL, {
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeout);
    responseTime = Date.now() - startTime;
    statusCode = res.status;
    isUp = res.status < 500;
  } catch {
    responseTime = Date.now() - startTime;
    isUp = false;
  }

  const timestamp = new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' });

  if (!isUp) {
    // VM is DOWN — alert immediately
    const diagnosis = await askClaude({
      systemPrompt: 'You are Karbon AI monitoring system. The N8N VM is down. Generate a brief, urgent Telegram alert. Include the VM IP and suggest restart steps. HTML format. 3 sentences max.',
      userMessage: `N8N VM at ${VM_IP}:${N8N_PORT} is NOT responding.\nResponse time: ${responseTime}ms\nHTTP status: ${statusCode || 'connection failed'}\nTimestamp: ${timestamp}\n\nRestart steps:\n1. SSH: ssh root@${VM_IP}\n2. Run: cd /opt/n8n && docker compose up -d\n3. Check: docker compose ps`,
      maxTokens: 200,
    });

    if (CHAT_ID) {
      await sendTelegramMessage(CHAT_ID,
        `🔴 <b>VM DOWN — N8N OFFLINE</b>\n\n${diagnosis}\n\n` +
        `<code>ssh root@${VM_IP}</code>\n` +
        `<code>cd /opt/n8n && docker compose up -d</code>`
      );
    }

    return NextResponse.json({
      status: 'down',
      vm: VM_IP,
      responseTime,
      httpStatus: statusCode,
      alerted: true,
      timestamp,
    });
  }

  // VM is UP — log silently, no alert
  return NextResponse.json({
    status: 'up',
    vm: VM_IP,
    responseTime,
    httpStatus: statusCode,
    alerted: false,
    timestamp,
  });
}
