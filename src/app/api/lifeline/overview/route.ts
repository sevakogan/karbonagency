import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

// ──────────────────────────────────────────────────────
// GET /api/lifeline/overview
// Returns aggregate journey stats for all customers
// Auth: Supabase session
// ──────────────────────────────────────────────────────

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';
const EMPLOYEE_SHIFTOS_IDS = new Set([79299, 71048]);

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getAdminSupabase();

    // Get all customers with bookings
    const { data: allCustomers } = await supabase
      .from('shiftos_customers')
      .select('id, first_name, last_name, signup_date, first_booking_at, last_booking_at, total_bookings, total_revenue, shiftos_user_id')
      .eq('company_id', MIAMI_COMPANY_ID)
      .gt('total_bookings', 0)
      .order('total_revenue', { ascending: false });

    const customers = (allCustomers ?? []).filter(
      (c) => !EMPLOYEE_SHIFTOS_IDS.has(c.shiftos_user_id),
    );

    // Get all reservations for computing booking gaps
    const { data: allReservations } = await supabase
      .from('shiftos_reservations')
      .select('customer_id, booking_time')
      .eq('company_id', MIAMI_COMPANY_ID)
      .eq('paid', true)
      .order('booking_time', { ascending: true });

    const reservations = allReservations ?? [];

    // Group reservations by customer
    const resByCustomer = new Map<string, string[]>();
    for (const r of reservations) {
      const list = resByCustomer.get(r.customer_id) ?? [];
      list.push(r.booking_time);
      resByCustomer.set(r.customer_id, list);
    }

    // Compute stats
    const totalCustomers = customers.length;
    const signupToFirstGaps: number[] = [];
    const rebookingGaps: number[] = [];
    let fastestConverter: { name: string; days: number } | null = null;
    let mostLoyal: { name: string; bookings: number } | null = null;

    for (const c of customers) {
      const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();

      // Signup to first booking gap
      if (c.signup_date && c.first_booking_at) {
        const gap = Math.round(
          (new Date(c.first_booking_at).getTime() - new Date(c.signup_date).getTime()) / 86400000,
        );
        if (gap >= 0) {
          signupToFirstGaps.push(gap);
          if (!fastestConverter || gap < fastestConverter.days) {
            fastestConverter = { name, days: gap };
          }
        }
      }

      // Most loyal
      if (!mostLoyal || c.total_bookings > mostLoyal.bookings) {
        mostLoyal = { name, bookings: c.total_bookings };
      }

      // Rebooking gaps
      const bookingDates = resByCustomer.get(c.id) ?? [];
      for (let i = 1; i < bookingDates.length; i++) {
        const gap = Math.round(
          (new Date(bookingDates[i]).getTime() - new Date(bookingDates[i - 1]).getTime()) / 86400000,
        );
        if (gap > 0) rebookingGaps.push(gap);
      }
    }

    const avgSignupToFirst = signupToFirstGaps.length > 0
      ? Math.round(signupToFirstGaps.reduce((a, b) => a + b, 0) / signupToFirstGaps.length)
      : null;

    const avgRebookingGap = rebookingGaps.length > 0
      ? Math.round(rebookingGaps.reduce((a, b) => a + b, 0) / rebookingGaps.length)
      : null;

    // Top 10 by LTV
    const top10 = customers.slice(0, 10).map((c) => ({
      id: c.id,
      name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
      total_revenue: c.total_revenue,
      total_bookings: c.total_bookings,
    }));

    return NextResponse.json({
      total_customers: totalCustomers,
      avg_signup_to_first_booking_days: avgSignupToFirst,
      avg_rebooking_gap_days: avgRebookingGap,
      fastest_converter: fastestConverter,
      most_loyal: mostLoyal,
      top_10_by_ltv: top10,
    });
  } catch (err) {
    console.error('Lifeline overview error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  if (apiKey && apiKey === process.env.INGEST_API_KEY) return true;

  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}
