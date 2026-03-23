import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

// ──────────────────────────────────────────────────────
// GET /api/lifeline/customer
// Returns a single customer's full journey (reservations + charges)
// Query params: search (name/email/phone) OR customerId (UUID)
// Auth: Supabase session
// ──────────────────────────────────────────────────────

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';
const EMPLOYEE_SHIFTOS_IDS = [79299, 71048];

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = request.nextUrl.searchParams;
    const search = params.get('search')?.trim() ?? '';
    const customerId = params.get('customerId')?.trim() ?? '';

    const supabase = getAdminSupabase();

    // If customerId provided, fetch that specific customer
    if (customerId) {
      return NextResponse.json(await getCustomerJourney(supabase, customerId));
    }

    // Search mode — return matching customers (lightweight, no full journey)
    if (search && search.length >= 2) {
      let query = supabase
        .from('shiftos_customers')
        .select('id, first_name, last_name, email, phone, signup_date, total_bookings, total_revenue, first_booking_at, last_booking_at')
        .eq('company_id', MIAMI_COMPANY_ID)
        .or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
        )
        .order('total_revenue', { ascending: false })
        .limit(20);

      // Exclude employees
      for (const empId of EMPLOYEE_SHIFTOS_IDS) {
        query = query.neq('shiftos_user_id', empId);
      }

      const { data: customers, error } = await query;
      if (error) throw new Error(error.message);

      return NextResponse.json({
        customers: (customers ?? []).map((c) => ({
          ...c,
          name: `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
        })),
      });
    }

    return NextResponse.json({ customers: [] });
  } catch (err) {
    console.error('Lifeline customer error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function getCustomerJourney(supabase: any, customerId: string) {
  // Get customer info
  const { data: customer, error: custErr } = await supabase
    .from('shiftos_customers')
    .select('id, first_name, last_name, email, phone, signup_date, total_bookings, total_revenue, first_booking_at, last_booking_at, shiftos_user_id')
    .eq('id', customerId)
    .single();

  if (custErr || !customer) {
    return { error: 'Customer not found' };
  }

  // Get all reservations for this customer
  const { data: reservations } = await supabase
    .from('shiftos_reservations')
    .select('id, calendar_name, booking_time, revenue, sim_count, paid, coupon_code')
    .eq('customer_id', customerId)
    .order('booking_time', { ascending: true });

  // Get charges for this customer
  const { data: charges } = await supabase
    .from('shiftos_charges')
    .select('id, amount, charge_type, description, created_at, refunded')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: true });

  const events: Array<{
    date: string;
    type: 'signup' | 'booking' | 'charge' | 'refund';
    description: string;
    amount: number;
    details: string;
  }> = [];

  // Add signup event
  if (customer.signup_date) {
    events.push({
      date: customer.signup_date,
      type: 'signup',
      description: 'Signed up',
      amount: 0,
      details: '',
    });
  }

  // Add booking events
  for (const r of reservations ?? []) {
    events.push({
      date: r.booking_time,
      type: 'booking',
      description: `${r.sim_count ?? 1}x ${r.calendar_name ?? 'Sim'}`,
      amount: Number(r.revenue) || 0,
      details: [
        r.paid ? 'Paid' : 'Unpaid',
        r.coupon_code ? `Coupon: ${r.coupon_code}` : '',
      ].filter(Boolean).join(' · '),
    });
  }

  // Add refund events from charges
  for (const c of charges ?? []) {
    if (c.refunded) {
      events.push({
        date: c.created_at,
        type: 'refund',
        description: `Refund: ${c.description ?? c.charge_type ?? 'charge'}`,
        amount: -(Number(c.amount) || 0),
        details: '',
      });
    }
  }

  // Sort events chronologically
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Compute gaps between events
  const timeline = events.map((event, i) => {
    const prev = i > 0 ? events[i - 1] : null;
    const gapDays = prev
      ? Math.round((new Date(event.date).getTime() - new Date(prev.date).getTime()) / 86400000)
      : null;
    return { ...event, gapDays };
  });

  const lifetimeSpend = (reservations ?? []).reduce(
    (s: number, r: { revenue: number }) => s + (Number(r.revenue) || 0), 0,
  );
  const totalBookings = (reservations ?? []).length;
  const firstDate = events[0]?.date ?? customer.signup_date;
  const lastDate = events[events.length - 1]?.date ?? customer.last_booking_at;
  const daysAsCustomer = firstDate && lastDate
    ? Math.round((new Date(lastDate).getTime() - new Date(firstDate).getTime()) / 86400000)
    : 0;

  // Predict next booking date from average gap between bookings
  const bookingDates = [...(reservations ?? [])]
    .map((r) => new Date(r.booking_time).getTime())
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  let next_predicted_date: string | null = null;
  if (bookingDates.length >= 2) {
    const gaps = bookingDates.slice(1).map((t, i) => t - bookingDates[i]);
    const avgGapMs = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
    const lastBookingMs = bookingDates[bookingDates.length - 1];
    const predicted = new Date(lastBookingMs + avgGapMs);
    // Only include if predicted date is in the future
    if (predicted.getTime() > Date.now()) {
      next_predicted_date = predicted.toISOString();
    }
  }

  return {
    customer: {
      ...customer,
      name: `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim(),
      next_predicted_date,
    },
    timeline,
    summary: {
      lifetime_spend: lifetimeSpend,
      total_bookings: totalBookings,
      days_as_customer: daysAsCustomer,
    },
  };
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
