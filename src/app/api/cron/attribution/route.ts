import { NextRequest, NextResponse } from 'next/server';
import { attributeUntaggedCustomers } from '@/lib/attribution';

/**
 * GET /api/cron/attribution
 *
 * Runs every hour. Finds customers without attribution tags and
 * attributes them using CAPI match data + timing correlation fallback.
 *
 * Processes 50 customers per run to stay within function timeout.
 * Repeat runs will catch up on any backlog.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await attributeUntaggedCustomers();

    return NextResponse.json({
      ...result,
      message: `Attributed ${result.processed} customers`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[attribution] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
