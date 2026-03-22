import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { getUsersByIds } from '@/lib/shiftos/client';
import { createHash } from 'crypto';

const PIXEL_ID = process.env.META_CAPI_PIXEL_ID ?? '';
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? '';
const GRAPH_API_VERSION = 'v22.0';
const BATCH_SIZE = 20; // Meta CAPI max per request
const EVENT_SOURCE_URL = 'https://race.shiftarcade.com';

/**
 * GET /api/cron/meta-capi
 *
 * Runs every 3 min. Reads unsent charges from shiftos_charges
 * (capi_sent_at IS NULL), enriches with user PII, SHA-256 hashes,
 * and sends Purchase events to Meta Conversions API.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!PIXEL_ID || !ACCESS_TOKEN) {
    return NextResponse.json(
      { error: 'META_CAPI_PIXEL_ID and META_CAPI_ACCESS_TOKEN required' },
      { status: 500 },
    );
  }

  try {
    const supabase = getAdminSupabase();

    // Fetch unsent charges (limit 100 per run to stay within function timeout)
    const { data: unsent, error: fetchErr } = await supabase
      .from('shiftos_charges')
      .select('id, shiftos_charge_id, shiftos_user_id, net_amount_cents, charge_created_at')
      .is('capi_sent_at', null)
      .order('charge_created_at', { ascending: true })
      .limit(100);

    if (fetchErr) {
      console.error('[meta-capi] Fetch error:', fetchErr.message);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!unsent || unsent.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No unsent charges' });
    }

    // Fetch user data for PII hashing
    const userIds = [...new Set(unsent.map((c) => c.shiftos_user_id))];
    const usersMap = await getUsersByIds(userIds);

    // Build Meta CAPI events
    const events = unsent.map((charge) => {
      const user = usersMap.get(charge.shiftos_user_id);
      const userData: Record<string, string[]> = {};

      if (user?.email) userData.em = [sha256(user.email)];
      if (user?.phone) userData.ph = [sha256(user.phone.replace(/\D/g, ''))];
      if (user?.first_name) userData.fn = [sha256(user.first_name)];
      if (user?.last_name) userData.ln = [sha256(user.last_name)];
      if (user?.id) userData.external_id = [sha256(String(user.id))];

      return {
        event_name: 'Purchase',
        event_time: Math.floor(new Date(charge.charge_created_at).getTime() / 1000),
        event_id: charge.shiftos_charge_id,
        action_source: 'website',
        event_source_url: EVENT_SOURCE_URL,
        user_data: userData,
        custom_data: {
          value: charge.net_amount_cents / 100,
          currency: 'USD',
        },
      };
    });

    // Send in batches of 20
    let totalSent = 0;
    const errors: string[] = [];

    for (let i = 0; i < events.length; i += BATCH_SIZE) {
      const batch = events.slice(i, i + BATCH_SIZE);
      const batchChargeIds = unsent.slice(i, i + BATCH_SIZE).map((c) => c.id);

      const res = await fetch(
        `https://graph.facebook.com/${GRAPH_API_VERSION}/${PIXEL_ID}/events`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: batch,
            access_token: ACCESS_TOKEN,
          }),
        },
      );

      const body = await res.json();

      if (res.ok && body.events_received) {
        // Mark as sent
        const now = new Date().toISOString();
        await supabase
          .from('shiftos_charges')
          .update({ capi_sent_at: now })
          .in('id', batchChargeIds);

        totalSent += batch.length;
      } else {
        const errMsg = body.error?.message ?? `HTTP ${res.status}`;
        errors.push(errMsg);
        console.error('[meta-capi] Send error:', errMsg);
      }
    }

    return NextResponse.json({
      sent: totalSent,
      total: unsent.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Sent ${totalSent}/${unsent.length} purchase events to Meta CAPI`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[meta-capi] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function sha256(input: string): string {
  return createHash('sha256')
    .update(input.trim().toLowerCase())
    .digest('hex');
}
