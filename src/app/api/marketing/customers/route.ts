import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

// ──────────────────────────────────────────────────────
// GET /api/marketing/customers
// Paginated customer list with computed lifecycle fields.
// Auth: Supabase session OR INGEST_API_KEY header.
// ──────────────────────────────────────────────────────

// Employees — excluded from customer list and revenue
// Employees — excluded from customer list and revenue
// Alejandro Cordones (employee), 305 Staff Nick (manager)
const EMPLOYEE_SHIFTOS_IDS = [79299, 71048];

interface CustomerRow {
  id: string;
  company_id: string;
  shiftos_user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  signup_date: string;
  first_booking_at: string | null;
  last_booking_at: string | null;
  total_bookings: number;
  total_revenue: number;
  is_returning: boolean;
}

interface ReservationRow {
  id: string;
  customer_id: string;
  calendar_name: string;
  revenue: number;
  booking_time: string;
  coupon_code: string | null;
}

interface ComputedCustomer {
  id: string;
  shiftos_user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  signup_date: string;
  total_bookings: number;
  total_revenue: number;
  is_returning: boolean;
  first_booking_at: string | null;
  last_booking_at: string | null;
  // Computed
  days_since_last: number | null;
  next_future_booking: string | null;
  last_charge_amount: number;
  spend_30d: number;
  first_to_second_gap: number | null;
  avg_booking_gap: number | null;
  status: 'active' | 'at_risk' | 'churned';
  apex_member: boolean;
  sparkline_4w: number[];
}

const VALID_SORT_FIELDS = new Set([
  'first_name', 'last_name', 'email', 'total_bookings',
  'total_revenue', 'last_booking_at', 'signup_date', 'first_booking_at',
]);

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = request.nextUrl.searchParams;
    const page = Math.max(1, Number(params.get('page') ?? 1));
    const limit = Math.min(200, Math.max(1, Number(params.get('limit') ?? 50)));
    const search = params.get('search')?.trim() ?? '';
    const sortField = VALID_SORT_FIELDS.has(params.get('sort') ?? '')
      ? params.get('sort')!
      : 'last_booking_at';
    const sortOrder = params.get('order') === 'asc' ? true : false;
    const statusFilter = params.get('status') as 'active' | 'at_risk' | 'churned' | null;
    const spendMin = params.get('spend_min') ? Number(params.get('spend_min')) : null;
    const spendMax = params.get('spend_max') ? Number(params.get('spend_max')) : null;
    const hasFutureBooking = params.get('has_future_booking');
    let companyId = params.get('companyId');

    const supabase = getAdminSupabase();

    // Default to Shift Arcade Miami
    if (!companyId) {
      const { data: company } = await supabase
        .from('clients').select('id').ilike('name', '%shift%arcade%').limit(1).single();
      companyId = company?.id ?? null;
    }

    const now = new Date();
    const nowIso = now.toISOString();

    // ── Build base query for customers ──
    let query = supabase
      .from('shiftos_customers')
      .select('*', { count: 'exact' });

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    // Exclude employees
    for (const empId of EMPLOYEE_SHIFTOS_IDS) {
      query = query.neq('shiftos_user_id', empId);
    }

    if (search) {
      // Fuzzy match on name, email, phone
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`,
      );
    }

    if (spendMin !== null) {
      query = query.gte('total_revenue', spendMin);
    }
    if (spendMax !== null) {
      query = query.lte('total_revenue', spendMax);
    }

    // Sort and paginate
    query = query
      .order(sortField, { ascending: sortOrder, nullsFirst: false })
      .range((page - 1) * limit, page * limit - 1);

    const { data: customers, count: totalFiltered, error: custError } = await query;

    if (custError) {
      throw new Error(`Customer query failed: ${custError.message}`);
    }

    const customerList = (customers ?? []) as CustomerRow[];

    if (customerList.length === 0) {
      return NextResponse.json({
        customers: [],
        total: 0,
        page,
        limit,
        aggregates: await computeAggregates(supabase, companyId),
      });
    }

    // ── Batch-fetch reservations for this page of customers ──
    const customerIds = customerList.map((c) => c.id);
    const { data: reservations } = await supabase
      .from('shiftos_reservations')
      .select('id, customer_id, calendar_name, revenue, booking_time, coupon_code')
      .in('customer_id', customerIds)
      .order('booking_time', { ascending: true });

    const reservationsByCustomer = groupBy(
      (reservations ?? []) as ReservationRow[],
      (r) => r.customer_id,
    );

    // ── Compute derived fields ──
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const fourWeeksAgo = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    let computedCustomers: ComputedCustomer[] = customerList.map((c) => {
      const custReservations = reservationsByCustomer.get(c.id) ?? [];
      const bookingTimes = custReservations.map((r) => new Date(r.booking_time));

      // days_since_last
      const daysSinceLast = c.last_booking_at
        ? Math.floor((now.getTime() - new Date(c.last_booking_at).getTime()) / (1000 * 60 * 60 * 24))
        : null;

      // next_future_booking
      const futureBookings = custReservations.filter((r) => r.booking_time > nowIso);
      const nextFutureBooking = futureBookings.length > 0 ? futureBookings[0].booking_time : null;

      // last_charge_amount
      const paidReservations = custReservations.filter((r) => Number(r.revenue) > 0);
      const lastCharge = paidReservations.length > 0
        ? Number(paidReservations[paidReservations.length - 1].revenue)
        : 0;

      // spend_30d
      const spend30d = custReservations
        .filter((r) => new Date(r.booking_time) >= thirtyDaysAgo)
        .reduce((sum, r) => sum + Number(r.revenue), 0);

      // Booking gaps
      const gaps = computeBookingGaps(bookingTimes);
      const firstToSecondGap = gaps.length > 0 ? gaps[0] : null;
      const avgBookingGap = gaps.length > 0
        ? Math.round(gaps.reduce((s, g) => s + g, 0) / gaps.length)
        : null;

      // Status
      const hasFuture = nextFutureBooking !== null;
      const status = computeStatus(daysSinceLast, hasFuture);

      // Apex member
      const apexMember = custReservations.some((r) =>
        r.calendar_name.toLowerCase().includes('apex'),
      );

      // 4-week sparkline
      const sparkline = computeSparkline(bookingTimes, fourWeeksAgo, now);

      return {
        id: c.id,
        shiftos_user_id: c.shiftos_user_id,
        first_name: c.first_name,
        last_name: c.last_name,
        email: c.email,
        phone: c.phone,
        signup_date: c.signup_date,
        total_bookings: c.total_bookings,
        total_revenue: c.total_revenue,
        is_returning: c.is_returning,
        first_booking_at: c.first_booking_at,
        last_booking_at: c.last_booking_at,
        days_since_last: daysSinceLast,
        next_future_booking: nextFutureBooking,
        last_charge_amount: lastCharge,
        spend_30d: spend30d,
        first_to_second_gap: firstToSecondGap,
        avg_booking_gap: avgBookingGap,
        status,
        apex_member: apexMember,
        sparkline_4w: sparkline,
      };
    });

    // ── Post-filter by status (requires computed field) ──
    if (statusFilter) {
      computedCustomers = computedCustomers.filter((c) => c.status === statusFilter);
    }

    // ── Post-filter by has_future_booking ──
    if (hasFutureBooking === 'true') {
      computedCustomers = computedCustomers.filter((c) => c.next_future_booking !== null);
    } else if (hasFutureBooking === 'false') {
      computedCustomers = computedCustomers.filter((c) => c.next_future_booking === null);
    }

    return NextResponse.json({
      customers: computedCustomers,
      total: totalFiltered ?? 0,
      page,
      limit,
      aggregates: await computeAggregates(supabase, companyId),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[marketing/customers] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Auth helper ──────────────────────────────────────

async function isAuthorized(req: NextRequest): Promise<boolean> {
  // Check INGEST_API_KEY
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  if (apiKey && apiKey === process.env.INGEST_API_KEY) return true;

  // Check Supabase session
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}

// ── Aggregates (always unfiltered) ───────────────────

async function computeAggregates(
  supabase: ReturnType<typeof getAdminSupabase>,
  companyId: string | null,
) {
  let custQuery = supabase
    .from('shiftos_customers')
    .select('id, total_revenue, last_booking_at, total_bookings');

  if (companyId) {
    custQuery = custQuery.eq('company_id', companyId);
  }

  const { data: allCustomers } = await custQuery;
  const customers = allCustomers ?? [];

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  let activeCount = 0;
  let atRiskCount = 0;
  let churnedCount = 0;
  let revenueThisMonth = 0;
  let totalLifetimeValue = 0;

  for (const c of customers) {
    const daysSince = c.last_booking_at
      ? Math.floor((now.getTime() - new Date(c.last_booking_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // We don't know future bookings here, so approximate without that data
    const status = computeStatus(daysSince, false);
    if (status === 'active') activeCount += 1;
    else if (status === 'at_risk') atRiskCount += 1;
    else churnedCount += 1;

    totalLifetimeValue += Number(c.total_revenue);
  }

  // Revenue this month from reservations
  if (companyId) {
    const { data: monthRes } = await supabase
      .from('shiftos_reservations')
      .select('revenue')
      .eq('company_id', companyId)
      .gte('booking_time', monthStart.toISOString());

    revenueThisMonth = (monthRes ?? []).reduce((s, r) => s + Number(r.revenue), 0);
  }

  return {
    total_customers: customers.length,
    active_count: activeCount,
    at_risk_count: atRiskCount,
    churned_count: churnedCount,
    revenue_this_month: revenueThisMonth,
    avg_lifetime_value: customers.length > 0
      ? Math.round(totalLifetimeValue / customers.length)
      : 0,
  };
}

// ── Pure utility functions ───────────────────────────

function computeStatus(
  daysSinceLast: number | null,
  hasFutureBooking: boolean,
): 'active' | 'at_risk' | 'churned' {
  if (hasFutureBooking) return 'active';
  if (daysSinceLast === null) return 'churned';
  if (daysSinceLast < 30) return 'active';
  if (daysSinceLast < 60) return 'at_risk';
  return 'churned';
}

function computeBookingGaps(sortedTimes: Date[]): number[] {
  if (sortedTimes.length < 2) return [];

  const gaps: number[] = [];
  for (let i = 1; i < sortedTimes.length; i++) {
    const diffDays = Math.floor(
      (sortedTimes[i].getTime() - sortedTimes[i - 1].getTime()) / (1000 * 60 * 60 * 24),
    );
    gaps.push(diffDays);
  }
  return gaps;
}

function computeSparkline(
  bookingTimes: Date[],
  fourWeeksAgo: Date,
  now: Date,
): number[] {
  const weeks = [0, 0, 0, 0];
  for (const t of bookingTimes) {
    if (t < fourWeeksAgo || t > now) continue;
    const daysSinceFourWeeksAgo = Math.floor(
      (t.getTime() - fourWeeksAgo.getTime()) / (1000 * 60 * 60 * 24),
    );
    const weekIndex = Math.min(3, Math.floor(daysSinceFourWeeksAgo / 7));
    weeks[weekIndex] += 1;
  }
  return weeks;
}

function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const existing = map.get(key);
    if (existing) {
      existing.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}
