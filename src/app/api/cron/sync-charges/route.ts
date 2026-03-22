import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { getMiamiCharges } from '@/lib/shiftos/client';

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';
const LOOKBACK_MINUTES = 6;

/**
 * GET /api/cron/sync-charges
 *
 * Runs every 5 min. Pulls the last 6 min of ShiftOS charges (Miami only)
 * and upserts into shiftos_charges table. Skips zero-amount, fully refunded,
 * and anonymous charges.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const since = new Date(now.getTime() - LOOKBACK_MINUTES * 60 * 1000).toISOString();
    const until = now.toISOString();

    const charges = await getMiamiCharges(since, until);

    // Filter: must have user, positive amount, not fully refunded
    const valid = charges.filter((c) => {
      if (!c.user) return false;
      const amount = c.amount_cents ?? 0;
      if (amount <= 0) return false;
      const refunded = c.amount_refunded ?? 0;
      if (refunded >= amount) return false;
      return true;
    });

    if (valid.length === 0) {
      return NextResponse.json({ synced: 0, message: 'No new charges' });
    }

    const supabase = getAdminSupabase();

    const rows = valid.map((c) => ({
      company_id: MIAMI_COMPANY_ID,
      shiftos_charge_id: c.id,
      shiftos_user_id: c.user,
      location_id: c.location,
      stripe_charge_id: c.charge_id ?? null,
      status: c.status ?? 'SUCCEEDED',
      amount_cents: c.amount_cents ?? 0,
      amount_captured: c.amount_captured ?? 0,
      amount_refunded: c.amount_refunded ?? 0,
      net_amount_cents: (c.amount_cents ?? 0) - (c.amount_refunded ?? 0),
      receipt_url: c.receipt_url ?? null,
      notes: c.notes ?? null,
      charge_created_at: c.created,
    }));

    const { error, count } = await supabase
      .from('shiftos_charges')
      .upsert(rows, { onConflict: 'shiftos_charge_id', ignoreDuplicates: true });

    if (error) {
      console.error('[sync-charges] Upsert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      synced: valid.length,
      window: { since, until },
      message: `Synced ${valid.length} charges`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[sync-charges] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
