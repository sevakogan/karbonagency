import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

// ──────────────────────────────────────────────────────
// GET /api/marketing/analytics
// Returns chart-ready data for the marketing analytics dashboard.
// Query params: period (7d/30d/90d/all), companyId
// Auth: Supabase session OR INGEST_API_KEY header.
// ──────────────────────────────────────────────────────

// Employees — excluded from revenue calculations and analytics
// Employees — excluded from revenue and analytics
// Alejandro Cordones (employee), 305 Staff Nick (manager)
const EMPLOYEE_SHIFTOS_IDS = new Set([79299, 71048]);

const PERIOD_DAYS: Record<string, number | null> = {
  '3d': 3,
  '7d': 7,
  '30d': 30,
  'mtd': null, // handled specially below
  '90d': 90,
  'all': null,
};

interface ReservationRow {
  id: string;
  customer_id: string;
  shiftos_user_id: number;
  calendar_name: string;
  revenue: number;
  booking_time: string;
  coupon_code: string | null;
}

// ── Sim tiers ────────────────────────────────────────
const SIM_TIERS: Record<string, string> = {
  'Hamilton-Mia': 'Ultimate',
  'Verstappen-Mia': 'Ultimate',
  'Norris-Mia': 'Haptic',
  'Piastri-Mia': 'Haptic',
  'Russell-Mia': 'Haptic',
  'Leclerc-Mia': 'Haptic',
  'Antonelli-Mia': 'Non-Motion',
  'Sainz-Mia': 'Non-Motion',
};
const ALL_SIM_NAMES = Object.keys(SIM_TIERS);

interface CustomerRow {
  id: string;
  shiftos_user_id: number;
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
    let companyId = params.get('companyId');

    // Default to Shift Arcade Miami if no companyId provided
    if (!companyId) {
      const supabase = getAdminSupabase();
      const { data: company } = await supabase
        .from('clients')
        .select('id')
        .ilike('name', '%shift%arcade%')
        .limit(1)
        .single();
      companyId = company?.id ?? null;
      if (!companyId) {
        return NextResponse.json({ error: 'No company found' }, { status: 400 });
      }
    }

    const now = new Date();
    let cutoff: Date | null = null;
    let periodDays: number | null = null;
    if (period === 'mtd') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
      periodDays = now.getDate(); // days into current month
    } else {
      periodDays = PERIOD_DAYS[period] ?? 30;
      cutoff = periodDays !== null ? new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000) : null;
    }

    const supabase = getAdminSupabase();

    // ── Fetch data in parallel ──
    const [reservationsRes, allReservationsRes, customersRes] = await Promise.all([
      fetchReservations(supabase, companyId, cutoff),
      fetchReservations(supabase, companyId, null), // all reservations for sim utilization
      fetchCustomers(supabase, companyId),
    ]);

    // Filter out employees
    const reservations = reservationsRes.filter((r) => !EMPLOYEE_SHIFTOS_IDS.has(r.shiftos_user_id));
    const allReservations = allReservationsRes.filter((r) => !EMPLOYEE_SHIFTOS_IDS.has(r.shiftos_user_id));
    const customers = customersRes.filter((c) => !EMPLOYEE_SHIFTOS_IDS.has(c.shiftos_user_id));

    // ── Revenue trend ──
    const revenueTrend = computeRevenueTrend(reservations, periodDays);

    // ── Status distribution ──
    const statusDist = computeStatusDistribution(customers, now);

    // ── Spend tiers ──
    const spendTiers = computeSpendTiers(customers);

    // ── Coupon analysis ──
    const couponAnalysis = computeCouponAnalysis(reservations, customers);

    // ── Sim utilization (all-time, no date filter) ──
    const simUtilization = computeSimUtilization(allReservations);

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

    // Pull monthly revenue from daily_metrics (imported from CSV — real ShiftOS + Square data)
    const now2 = new Date();
    const thisMonthStr = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`;
    const lastMonth = new Date(now2.getFullYear(), now2.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const { data: thisMonthMetrics } = await supabase
      .from('daily_metrics')
      .select('cost_per_conversion')
      .eq('client_id', companyId)
      .eq('platform', 'shiftos')
      .gte('date', `${thisMonthStr}-01`)
      .lt('date', `${thisMonthStr}-32`);

    const { data: lastMonthMetrics } = await supabase
      .from('daily_metrics')
      .select('cost_per_conversion')
      .eq('client_id', companyId)
      .eq('platform', 'shiftos')
      .gte('date', `${lastMonthStr}-01`)
      .lt('date', `${lastMonthStr}-32`);

    const revenueThisMonth = (thisMonthMetrics ?? []).reduce((s, m) => s + Number(m.cost_per_conversion ?? 0), 0);
    const revenueLastMonth = (lastMonthMetrics ?? []).reduce((s, m) => s + Number(m.cost_per_conversion ?? 0), 0);

    // Avg lifetime value from ALL customers with bookings
    const custWithBookings = customers.filter((c) => c.total_bookings > 0);
    const avgLTV = custWithBookings.length > 0
      ? Math.round(custWithBookings.reduce((s, c) => s + c.total_revenue, 0) / custWithBookings.length)
      : 0;

    // Build revenue trend from daily_metrics CSV data (more accurate than reservation-based)
    const { data: dailyRevMetrics } = await supabase
      .from('daily_metrics')
      .select('date, cost_per_conversion, impressions, reach, video_views, leads')
      .eq('client_id', companyId)
      .eq('platform', 'shiftos')
      .order('date', { ascending: true });

    const csvRevenueTrend = (dailyRevMetrics ?? []).map((m) => ({
      period: m.date,
      revenue: Number(m.cost_per_conversion ?? 0),
      shiftos_revenue: Number(m.impressions ?? 0) / 100,
      square_revenue: Number(m.reach ?? 0) / 100,
      bookings: Number(m.video_views ?? 0) + Number(m.leads ?? 0),
      coupon_revenue: 0,
    }));

    // Merchant fees estimate (Stripe ~2.9%+30c, Square ~2.6%+10c)
    const STRIPE_RATE = 0.029;
    const STRIPE_FIXED = 0.30;
    const SQUARE_RATE = 0.026;
    const SQUARE_FIXED = 0.10;

    const totalLifetimeRevenue = (dailyRevMetrics ?? []).reduce((s, m) => s + Number(m.cost_per_conversion ?? 0), 0);
    const totalShiftOSRev = (dailyRevMetrics ?? []).reduce((s, m) => s + Number(m.impressions ?? 0) / 100, 0);
    const totalSquareRev = (dailyRevMetrics ?? []).reduce((s, m) => s + Number(m.reach ?? 0) / 100, 0);
    const totalShiftosTxns = (dailyRevMetrics ?? []).reduce((s, m) => s + Number(m.video_views ?? 0), 0);
    const totalSquareTxns = (dailyRevMetrics ?? []).reduce((s, m) => s + Number(m.leads ?? 0), 0);

    const stripeFees = totalShiftOSRev * STRIPE_RATE + totalShiftosTxns * STRIPE_FIXED;
    const squareFees = totalSquareRev * SQUARE_RATE + totalSquareTxns * SQUARE_FIXED;
    const totalMerchantFees = stripeFees + squareFees;

    // Franchise fees: 7% royalty + 1% marketing = 8% total on gross revenue
    const FRANCHISE_ROYALTY_RATE = 0.07;
    const FRANCHISE_MARKETING_RATE = 0.01;
    const franchiseRoyalty = totalLifetimeRevenue * FRANCHISE_ROYALTY_RATE;
    const franchiseMarketing = totalLifetimeRevenue * FRANCHISE_MARKETING_RATE;
    const totalFranchiseFees = franchiseRoyalty + franchiseMarketing;

    const totalDeductions = totalMerchantFees + totalFranchiseFees;
    const netProfit = totalLifetimeRevenue - totalDeductions;

    const r = (n: number) => Math.round(n * 100) / 100;

    return NextResponse.json({
      revenue_trend: csvRevenueTrend.length > 0 ? csvRevenueTrend : revenueTrend,
      status_distribution: statusDist,
      spend_tiers: spendTiers,
      coupon_analysis: couponAnalysis,
      sim_utilization: simUtilization,
      scatter_data: scatterData,
      revenue_this_month: revenueThisMonth,
      revenue_last_month: revenueLastMonth,
      revenue_lifetime: totalLifetimeRevenue,
      avg_lifetime_value: avgLTV,
      merchant_fees: {
        stripe: r(stripeFees),
        square: r(squareFees),
        total: r(totalMerchantFees),
        net_revenue: r(netProfit),
      },
      franchise_fees: {
        royalty: r(franchiseRoyalty),
        marketing: r(franchiseMarketing),
        total: r(totalFranchiseFees),
      },
      pnl: {
        gross_revenue: r(totalLifetimeRevenue),
        shiftos_revenue: r(totalShiftOSRev),
        square_revenue: r(totalSquareRev),
        stripe_fees: r(stripeFees),
        square_fees: r(squareFees),
        total_merchant_fees: r(totalMerchantFees),
        franchise_royalty: r(franchiseRoyalty),
        franchise_marketing: r(franchiseMarketing),
        total_franchise_fees: r(totalFranchiseFees),
        total_deductions: r(totalDeductions),
        net_profit: r(netProfit),
        margin_pct: r((netProfit / totalLifetimeRevenue) * 100),
      },
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
  // Paginate to get ALL reservations
  const all: ReservationRow[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    let query = supabase
      .from('shiftos_reservations')
      .select('id, customer_id, shiftos_user_id, calendar_name, revenue, booking_time, coupon_code')
      .eq('company_id', companyId)
      .eq('paid', true)
      .order('booking_time', { ascending: true })
      .range(from, from + PAGE - 1);

    if (cutoff) {
      query = query.gte('booking_time', cutoff.toISOString());
    }

    const { data, error } = await query;
    if (error) throw new Error(`Reservations query failed: ${error.message}`);
    if (!data?.length) break;
    all.push(...(data as ReservationRow[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function fetchCustomers(
  supabase: ReturnType<typeof getAdminSupabase>,
  companyId: string,
): Promise<CustomerRow[]> {
  // Paginate to get ALL customers (Supabase defaults to 1000 row limit)
  const all: CustomerRow[] = [];
  let from = 0;
  const PAGE = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('shiftos_customers')
      .select('id, shiftos_user_id, first_name, last_name, total_bookings, total_revenue, last_booking_at')
      .eq('company_id', companyId)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Customers query failed: ${error.message}`);
    if (!data?.length) break;
    all.push(...(data as CustomerRow[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
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
  // Group by day if <= 30 days, by week if <= 90, by month otherwise
  const useDaily = periodDays !== null && periodDays <= 30;
  const useWeekly = periodDays !== null && periodDays <= 90 && !useDaily;
  const bucketMap = new Map<string, TrendBucket>();

  for (const r of reservations) {
    const date = new Date(r.booking_time);
    const key = useDaily ? getDayKey(date) : useWeekly ? getWeekKey(date) : getMonthKey(date);
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

function getDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
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
): { active: number; medium_risk: number; high_risk: number; churned: number } {
  let active = 0;
  let mediumRisk = 0;
  let highRisk = 0;
  let churned = 0;

  for (const c of customers) {
    const daysSince = c.last_booking_at
      ? Math.floor((now.getTime() - new Date(c.last_booking_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;
    const status = computeStatus(daysSince, false);
    if (status === 'active') active += 1;
    else if (status === 'medium_risk') mediumRisk += 1;
    else if (status === 'high_risk') highRisk += 1;
    else churned += 1;
  }

  return { active, medium_risk: mediumRisk, high_risk: highRisk, churned };
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

// ── Sim utilization ──────────────────────────────────

interface SimUtilBySimEntry {
  name: string;
  tier: string;
  bookings: number;
  pct: number;
}

interface SimUtilByWeekEntry {
  week: string;
  [simName: string]: string | number; // week is string, rest are numbers
}

interface SimUtilization {
  by_sim: SimUtilBySimEntry[];
  by_week: SimUtilByWeekEntry[];
  total_bookings: number;
  avg_per_sim_per_day: number;
}

function computeSimUtilization(reservations: readonly ReservationRow[]): SimUtilization {
  const simCounts = new Map<string, number>();
  const weekSimCounts = new Map<string, Map<string, number>>();

  // Initialize all sims to 0
  for (const name of ALL_SIM_NAMES) {
    simCounts.set(name, 0);
  }

  let totalBookings = 0;

  for (const r of reservations) {
    if (!r.calendar_name) continue;
    // Split comma-separated sim names
    const sims = r.calendar_name.split(',').map((s) => s.trim());
    const weekKey = getWeekKey(new Date(r.booking_time));

    for (const sim of sims) {
      if (!SIM_TIERS[sim]) continue; // skip unknown sims
      simCounts.set(sim, (simCounts.get(sim) ?? 0) + 1);
      totalBookings += 1;

      const weekMap = weekSimCounts.get(weekKey) ?? new Map<string, number>();
      weekMap.set(sim, (weekMap.get(sim) ?? 0) + 1);
      weekSimCounts.set(weekKey, weekMap);
    }
  }

  const bySim: SimUtilBySimEntry[] = ALL_SIM_NAMES.map((name) => {
    const bookings = simCounts.get(name) ?? 0;
    return {
      name,
      tier: SIM_TIERS[name],
      bookings,
      pct: totalBookings > 0 ? Math.round((bookings / totalBookings) * 100) : 0,
    };
  }).sort((a, b) => b.bookings - a.bookings);

  const byWeek: SimUtilByWeekEntry[] = [...weekSimCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([week, simMap]) => {
      const entry: SimUtilByWeekEntry = { week };
      for (const name of ALL_SIM_NAMES) {
        entry[name] = simMap.get(name) ?? 0;
      }
      return entry;
    });

  // Calculate avg per sim per day
  let daySpan = 1;
  if (reservations.length > 0) {
    const dates = reservations.map((r) => new Date(r.booking_time).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    daySpan = Math.max(1, Math.round((maxDate - minDate) / (1000 * 60 * 60 * 24)));
  }
  const avgPerSimPerDay = ALL_SIM_NAMES.length > 0
    ? Math.round((totalBookings / ALL_SIM_NAMES.length / daySpan) * 10) / 10
    : 0;

  return { by_sim: bySim, by_week: byWeek, total_bookings: totalBookings, avg_per_sim_per_day: avgPerSimPerDay };
}

// ── Shared utility ───────────────────────────────────

function computeStatus(
  daysSinceLast: number | null,
  hasFutureBooking: boolean,
): 'active' | 'medium_risk' | 'high_risk' | 'churned' {
  if (hasFutureBooking) return 'active';
  if (daysSinceLast === null) return 'churned';
  if (daysSinceLast < 30) return 'active';
  if (daysSinceLast < 60) return 'medium_risk';
  if (daysSinceLast < 90) return 'high_risk';
  return 'churned';
}
