import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';

/**
 * POST /api/webhooks/capi-match
 *
 * Called by n8n after sending Purchase events to Meta CAPI.
 * n8n sends the Meta CAPI response + the charge IDs that were sent.
 * If Meta matched the events, we tag those customers as ad-driven.
 *
 * Body:
 * {
 *   events_received: number,
 *   events_matched: number,
 *   charge_ids: string[],       // ShiftOS charge UUIDs that were sent
 *   user_ids: number[],         // ShiftOS user IDs (parallel array)
 * }
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      events_received = 0,
      events_matched = 0,
      charge_ids = [],
      user_ids = [],
    } = body;

    if (charge_ids.length === 0) {
      return NextResponse.json({ updated: 0, message: 'No charge IDs provided' });
    }

    const matchRate = events_received > 0 ? events_matched / events_received : 0;
    const supabase = getAdminSupabase();
    const now = new Date().toISOString();

    // If Meta matched events, tag the corresponding customers as ad-driven
    // Match rate > 0 means at least some of these purchases came from ad clicks
    if (events_matched > 0 && user_ids.length > 0) {
      // High confidence: Meta confirmed matches exist in this batch
      const confidence = matchRate >= 0.8 ? 0.95
        : matchRate >= 0.5 ? 0.85
        : 0.7;

      const { count } = await supabase
        .from('shiftos_customers')
        .update({
          attribution_source: 'meta_ad',
          attribution_confidence: confidence,
          attribution_detail: {
            method: 'capi_confirmed',
            events_received,
            events_matched,
            match_rate: Math.round(matchRate * 100),
            batch_time: now,
          },
          attributed_at: now,
        })
        .in('shiftos_user_id', user_ids)
        .or('attribution_source.is.null,attribution_source.eq.unknown,attribution_confidence.lt.0.7');

      // Also mark charges as CAPI-sent
      await supabase
        .from('shiftos_charges')
        .update({ capi_sent_at: now })
        .in('shiftos_charge_id', charge_ids)
        .is('capi_sent_at', null);

      return NextResponse.json({
        updated: count ?? user_ids.length,
        match_rate: `${Math.round(matchRate * 100)}%`,
        confidence,
        message: `Tagged ${count ?? user_ids.length} customers as meta_ad (CAPI confirmed)`,
      });
    }

    // Events sent but none matched — still mark charges as sent
    await supabase
      .from('shiftos_charges')
      .update({ capi_sent_at: now })
      .in('shiftos_charge_id', charge_ids)
      .is('capi_sent_at', null);

    return NextResponse.json({
      updated: 0,
      match_rate: '0%',
      message: 'CAPI events sent but no matches — charges marked as sent',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[capi-match] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
