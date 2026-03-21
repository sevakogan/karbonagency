import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

// ──────────────────────────────────────────────────────
// GET /api/marketing/analytics
// Returns chart-ready data for the marketing analytics dashboard.
// Query params: period (7d/30d/90d/all), companyId
// Auth: Supabase session OR INGEST_API_KEY header.
// ──────────────────────────────────────────────────────

const PERIOD_DAYS: Record<string, number | null> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  'all': null,
};

interface ReservationRow {
  id: string;
  customer_id: string;
  calendar_name: string;
  revenue: number;
  booking_time: string;
  coupon_code: string | null;
}

interface CustomerRow {
  id: string;
  first_name: string;
  last_name: string;
  total_bookings: number;
  total_revenue: number;
  last_booking_at: string | null;
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = request.nextUrl.searchParams;
    const period = params.get('period') ?? '30d';
    const companyId = params.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId required' }, { status: 400 });
    }

    const periodDays = PERIOD_DAYS[period] ?? 30;
    const now = new Date();
    const cutoff = periodDays !== null
      ? new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000)
      : null;

    const supabase = getAdminSupabase();

    // ── Fetch data in parallel ──
    const [reservationsRes, customersRes] = await Promise.all([
      fetchReservations(supabase, companyId, cutoff),
      fetchCustomers(supabase, companyId),
    ]);

    const reservations = reservationsRes;
    const customers = customersRes;

    // ── Revenue trend ──
    const revenueTrend = computeRevenueTrend(reservations, periodDays);

    // ── Status distribution ──
    const statusDist = computeStatusDistribution(customers, now);

    // ── Spend tiers ──
    const spendTiers = computeSpendTiers(customers);

    // ── Coupon analysis ──
    const couponAnalysis = computeCouponAnalysis(reservations, customers);

    // ── Scatter data (all customers) ──
    const scatterData = customers.map((c) => {
      const daysSinceLast = c.last_booking_at
        ? Math.floor((now.getTime() - new Date(c.last_booking_at).getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const hasFuture = false; // Approximate for scatter — would need future booking check
      return {
        customer_id: c.id,
        name: `${c.first_name} ${c.last_name}`.trim(),
        total_bookings: c.total_bookings,
        lifetime_spend: c.total_revenue,
        days_since_last: daysSinceLast,
        status: computeStatus(daysSinceLast, hasFuture),
      };
    });

    return NextResponse.json({
      revenue_trend: revenueTrend,
      status_distribution: statusDist,
      spend_tiers: spendTiers,
      coupon_analysis: couponAnalysis,
      scatter_data: scatterData,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[marketing/analytics] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Auth helper ──────────────────────────────────────

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

// ── Data fetching ────────────────────────────────────

async function fetchReservations(
  supabase: ReturnType<typeof getAdminSupabase>,
  companyId: string,
  cutoff: Date | null,
): Promise<ReservationRow[]> {
  let query = supabase
    .from('shiftos_reservations')
    .select('id, customer_id, calendar_name, revenue, booking_time, coupon_code')
    .eq('company_id', companyId)
    .order('booking_time', { ascending: true });

  if (cutoff) {
    query = query.gte('booking_time', cutoff.toISOString());
  }

  const { data, error } = await query;
  if (error) throw new Error(`Reservations query failed: ${error.message}`);
  return (data ?? []) as ReservationRow[];
}

async function fetchCustomers(
  supabase: ReturnType<typeof getAdminSupabase>,
  companyId: string,
): Promise<CustomerRow[]> {
  const { data, error } = await supabase
    .from('shiftos_customers')
    .select('id, first_name, last_name, total_bookings, total_revenue, last_booking_at')
    .eq('company_id', companyId);

  if (error) throw new Error(`Customers query failed: ${error.message}`);
  return (data ?? []) as CustomerRow[];
}

// ── Revenue trend ────────────────────────────────────

interface TrendBucket {
  period: string;
  revenue: number;
  bookings: number;
  coupon_revenue: number;
  organic_revenue: number;
}

function computeRevenueTrend(
  reservations: readonly ReservationRow[],
  periodDays: number | null,
): TrendBucket[] {
  // Group by week if <= 90 days, by month otherwise
  const useWeekly = periodDays !== null && periodDays <= 90;
  const bucketMap = new Map<string, TrendBucket>();

  for (const r of reservations) {
    const date = new Date(r.booking_time);
    const key = useWeekly ? getWeekKey(date) : getMonthKey(date);
    const revenue = Number(r.revenue);
    const isCoupon = r.coupon_code !== null && r.coupon_code !== '';

    const existing = bucketMap.get(key);
    if (existing) {
      bucketMap.set(key, {
        ...existing,
        revenue: existing.revenue + revenue,
        bookings: existing.bookings + 1,
        coupon_revenue: existing.coupon_revenue + (isCoupon ? revenue : 0),
        organic_revenue: existing.organic_revenue + (isCoupon ? 0 : revenue),
      });
    } else {
      bucketMap.set(key, {
        period: key,
        revenue,
        bookings: 1,
        coupon_revenue: isCoupon ? revenue : 0,
        organic_revenue: isCoupon ? 0 : revenue,
      });
    }
  }

  return [...bucketMap.values()].sort((a, b) => a.period.localeCompare(b.period));
}

function getWeekKey(date: Date): string {
  // ISO week start (Monday)
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

function getMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ── Status distribution ──────────────────────────────

function computeStatusDistribution(
  customers: readonly CustomerRow[],
  now: Date,
): { active: number; at_risk: number; churned: number } {
  let active = 0;
  let atRisk = 0;
  let churned = 0;

  for (const c of customers) {
    const daysSince = c.last_booking_at
      ? Math.floor((now.getTime() - new Date(c.last_booking_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const status = computeStatus(daysSince, false);
    if (status === 'active') active += 1;
    else if (status === 'at_risk') atRisk += 1;
    else churned += 1;
  }

  return { active, at_risk: atRisk, churned };
}

// ── Spend tiers ──────────────────────────────────────

interface SpendTier {
  tier: string;
  count: number;
}

function computeSpendTiers(customers: readonly CustomerRow[]): SpendTier[] {
  const tiers: SpendTier[] = [
    { tier: 'Under $100', count: 0 },
    { tier: '$100-$500', count: 0 },
    { tier: '$500-$1K', count: 0 },
    { tier: '$1K+', count: 0 },
  ];

  for (const c of customers) {
    const spend = Number(c.total_revenue);
    if (spend < 100) tiers[0].count += 1;
    else if (spend < 500) tiers[1].count += 1;
    else if (spend < 1000) tiers[2].count += 1;
    else tiers[3].count += 1;
  }

  return tiers;
}

// ── Coupon analysis ──────────────────────────────────

interface CouponStat {
  code: string;
  uses: number;
  revenue: number;
  repeat_rate: number;
}

function computeCouponAnalysis(
  reservations: readonly ReservationRow[],
  customers: readonly CustomerRow[],
): CouponStat[] {
  // Build coupon stats
  const couponMap = new Map<string, { uses: number; revenue: number; customerIds: Set<string> }>();

  for (const r of reservations) {
    if (!r.coupon_code) continue;
    const code = r.coupon_code;
    const existing = couponMap.get(code);
    if (existing) {
      existing.uses += 1;
      existing.revenue += Number(r.revenue);
      existing.customerIds.add(r.customer_id);
    } else {
      couponMap.set(code, {
        uses: 1,
        revenue: Number(r.revenue),
        customerIds: new Set([r.customer_id]),
      });
    }
  }

  // For repeat_rate: what fraction of coupon users are returning customers
  const returningSet = new Set(
    customers.filter((c) => c.total_bookings > 1).map((c) => c.id),
  );

  const stats: CouponStat[] = [...couponMap.entries()].map(([code, data]) => {
    const returningUsers = [...data.customerIds].filter((id) => returningSet.has(id)).length;
    const repeatRate = data.customerIds.size > 0
      ? Math.round((returningUsers / data.customerIds.size) * 100)
      : 0;

    return {
      code,
      uses: data.uses,
      revenue: data.revenue,
      repeat_rate: repeatRate,
    };
  });

  return stats
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 8);
}

// ── Shared utility ───────────────────────────────────

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
