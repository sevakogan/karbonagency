import { NextRequest, NextResponse } from 'next/server';
import { setWebhook } from '@/lib/telegram';

export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const host = request.headers.get('host') ?? 'karbonagency.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  const webhookUrl = `${protocol}://${host}/api/telegram/webhook`;

  const result = await setWebhook(webhookUrl);

  return NextResponse.json({
    webhookUrl,
    result,
  });
}
