import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';

/**
 * GET /api/charges/enriched?since=ISO&until=ISO
 *
 * Called by n8n instead of ShiftOS directly.
 * Returns charges joined with customer data — real amounts, real LTV,
 * real booking counts. Everything n8n needs to send to Meta CAPI.
 *
 * Default: last 6 minutes of charges (same as n8n's current window).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = request.nextUrl.searchParams;
    const now = new Date();
    const since = params.get('since') ?? new Date(now.getTime() - 6 * 60 * 1000).toISOString();
    const until = params.get('until') ?? now.toISOString();

    const supabase = getAdminSupabase();

    // Fetch recent charges not yet sent to CAPI
    const { data: charges, error: chargesErr } = await supabase
      .from('shiftos_charges')
      .select('*')
      .eq('company_id', MIAMI_COMPANY_ID)
      .gte('charge_created_at', since)
      .lte('charge_created_at', until)
      .is('capi_sent_at', null)
      .gt('net_amount_cents', 0)
      .order('charge_created_at', { ascending: false });

    if (chargesErr) {
      return NextResponse.json({ error: chargesErr.message }, { status: 500 });
    }

    if (!charges || charges.length === 0) {
      return NextResponse.json({ charges: [], count: 0 });
    }

    // Fetch customer data for all users in one query
    const userIds = [...new Set(charges.map((c) => c.shiftos_user_id))];
    const { data: customers } = await supabase
      .from('shiftos_customers')
      .select('shiftos_user_id, first_name, last_name, email, phone, total_bookings, total_revenue, is_returning, first_booking_at, last_booking_at, signup_date')
      .eq('company_id', MIAMI_COMPANY_ID)
      .in('shiftos_user_id', userIds);

    const customerMap = new Map(
      (customers ?? []).map((c) => [c.shiftos_user_id, c]),
    );

    // Join charge + customer — real data, nothing estimated
    const enriched = charges.map((charge) => {
      const customer = customerMap.get(charge.shiftos_user_id);
      const now = Date.now();
      const signupMs = customer?.signup_date ? new Date(customer.signup_date).getTime() : null;

      return {
        // Charge data (exact amounts)
        charge_id: charge.shiftos_charge_id,
        stripe_charge_id: charge.stripe_charge_id,
        user_id: charge.shiftos_user_id,
        amount_cents: charge.amount_cents,
        amount_refunded: charge.amount_refunded,
        net_amount_cents: charge.net_amount_cents,
        net_amount_dollars: charge.net_amount_cents / 100,
        charge_time: charge.charge_created_at,
        receipt_url: charge.receipt_url,
        notes: charge.notes,

        // Customer data (real, from Karbon DB)
        customer: customer ? {
          email: customer.email,
          phone: customer.phone,
          first_name: customer.first_name,
          last_name: customer.last_name,
          lifetime_value: customer.total_revenue,
          total_bookings: customer.total_bookings,
          is_returning: customer.is_returning,
          first_booking_at: customer.first_booking_at,
          last_booking_at: customer.last_booking_at,
          days_as_customer: signupMs ? Math.floor((now - signupMs) / (1000 * 60 * 60 * 24)) : 0,
          avg_booking_value: customer.total_bookings > 0
            ? Math.round(customer.total_revenue / customer.total_bookings * 100) / 100
            : 0,
        } : null,
      };
    });

    return NextResponse.json({
      charges: enriched,
      count: enriched.length,
      window: { since, until },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[charges/enriched] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
