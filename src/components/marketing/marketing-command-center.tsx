'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Component, type ReactNode } from 'react';
import { PulseBar } from './pulse-bar';
import { ChartGrid, type ReviewsData, type OrganicData, type CreativesData } from './chart-grid';
import { ActiveFilters } from './active-filters';
import { CustomerList } from './customer-list';
import { formatTimeAgo } from '@/hooks/use-live-poll';

// Error boundary to prevent crashes
class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(e: Error) { return { error: e.message }; }
  render() {
    if (this.state.error) return <div className="p-8 text-center text-sm" style={{ color: 'var(--system-red)' }}>Something went wrong: {this.state.error}</div>;
    return this.props.children;
  }
}

export interface MarketingFilters {
  status: 'all' | 'active' | 'medium_risk' | 'high_risk' | 'churned';
  search: string;
  sort: string;
  order: 'asc' | 'desc';
  spendMin?: number;
  spendMax?: number;
  couponCode?: string;
  period: '3d' | '7d' | '30d' | 'mtd' | '90d' | 'all';
  page: number;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'at_risk' | 'churned';
  lifetime_spend: number;
  total_bookings: number;
  days_since_last: number;
  avg_gap_days: number;
  first_booking_date: string;
  last_booking_date: string;
  next_predicted_date: string | null;
  coupon_codes: string[];
  thirty_day_spend: number;
  monthly_spend: number[];
  bookings: BookingRecord[];
}

export interface BookingRecord {
  id: string;
  date: string;
  amount: number;
  package_name: string;
  coupon_code: string | null;
  source: string;
}

export interface ScatterPoint {
  customer_id: string;
  name: string;
  total_bookings: number;
  lifetime_spend: number;
  days_since_last: number | null;
  status: 'active' | 'at_risk' | 'churned';
}

export interface AnalyticsData {
  summary: {
    total: number;
    active: number;
    medium_risk: number;
    high_risk: number;
    churned: number;
    revenue_this_month: number;
    revenue_last_month: number;
    avg_lifetime_value: number;
  };
  scatter_data: ScatterPoint[];
  revenue_lifetime: number;
  merchant_fees: { stripe: number; square: number; total: number; net_revenue: number };
  franchise_fees: { royalty: number; marketing: number; total: number };
  pnl: {
    gross_revenue: number; shiftos_revenue: number; square_revenue: number;
    stripe_fees: number; square_fees: number; total_merchant_fees: number;
    franchise_royalty: number; franchise_marketing: number; total_franchise_fees: number;
    total_deductions: number; net_profit: number; margin_pct: number;
  } | null;
  revenue_trend: Array<{
    period: string;
    date?: string;
    revenue: number;
    bookings: number;
    coupon_revenue: number;
  }>;
  coupon_impact: Array<{
    code: string;
    first_time: number;
    repeat: number;
    repeat_rate: number;
  }>;
  sim_utilization: {
    by_sim: Array<{ name: string; tier: string; bookings: number; pct: number }>;
    by_week: Array<Record<string, string | number>>;
    total_bookings: number;
    avg_per_sim_per_day: number;
  } | null;
  attribution: Record<string, number>;
  refunds: {
    total_refunded: number;
    net_after_refunds: number;
    refund_rate_pct: number;
  } | null;
}

const DEFAULT_FILTERS: MarketingFilters = {
  status: 'all',
  search: '',
  sort: 'lifetime_spend',
  order: 'desc',
  period: '30d',
  page: 1,
};

export function MarketingCommandCenter() {
  const [filters, setFilters] = useState<MarketingFilters>(DEFAULT_FILTERS);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [organicData, setOrganicData] = useState<OrganicData | null>(null);
  const [creativesData, setCreativesData] = useState<CreativesData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cohortData, setCohortData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [churnData, setChurnData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [forecastData, setForecastData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  // Separate chart period from filters to avoid full page re-render
  const [chartPeriod, setChartPeriod] = useState<string>('30d');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [timeAgo, setTimeAgo] = useState('just now');
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const updateFilter = useCallback(<K extends keyof MarketingFilters>(
    key: K,
    value: MarketingFilters[K],
  ) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' ? { page: 1 } : {}),
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.status !== 'all') params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    params.set('sort', filters.sort);
    params.set('order', filters.order);
    if (filters.spendMin !== undefined) params.set('spendMin', String(filters.spendMin));
    if (filters.spendMax !== undefined) params.set('spendMax', String(filters.spendMax));
    if (filters.couponCode) params.set('couponCode', filters.couponCode);
    params.set('period', filters.period);
    params.set('page', String(filters.page));
    return params.toString();
  }, [filters]);

  // Fetch customers
  useEffect(() => {
    setLoading(true);
    fetch(`/api/marketing/customers?${queryString}`)
      .then((r) => (r.ok ? r.json() : { customers: [], total: 0 }))
      .then((data) => {
        // Ensure all array/number fields have safe defaults
        const safe = (data.customers ?? []).map((c: any) => ({
          ...c,
          lifetime_spend: c.lifetime_spend ?? c.total_revenue ?? 0,
          thirty_day_spend: c.thirty_day_spend ?? c.spend_30d ?? 0,
          total_bookings: c.total_bookings ?? 0,
          days_since_last: c.days_since_last ?? 999,
          avg_gap_days: c.avg_gap_days ?? c.avg_booking_gap ?? 0,
          coupon_codes: c.coupon_codes ?? [],
          monthly_spend: c.monthly_spend ?? [],
          bookings: c.bookings ?? c.booking_history ?? [],
          name: c.name ?? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim(),
          status: c.status ?? 'churned',
          first_booking_date: c.first_booking_date ?? c.first_booking_at ?? '',
          last_booking_date: c.last_booking_date ?? c.last_booking_at ?? '',
          next_predicted_date: c.next_predicted_date ?? c.next_future_booking ?? null,
          sparkline_4w: c.sparkline_4w ?? [],
        }));
        setCustomers(safe);
        setTotalCount(data.total ?? 0);
      })
      .catch(() => {
        setCustomers([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [queryString]);

  // Fetch analytics ONCE with all data — filter client-side by chartPeriod
  useEffect(() => {
    setAnalyticsLoading(true);
    const params = new URLSearchParams();
    params.set('period', 'all'); // always fetch all, filter in UI
    fetch(`/api/marketing/analytics?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => {
        if (!raw) { setAnalytics(null); return; }
        // Map API response shape to AnalyticsData interface
        const sd = raw.status_distribution ?? {};
        const mapped: AnalyticsData = {
          summary: {
            total: (sd.active ?? 0) + (sd.medium_risk ?? 0) + (sd.high_risk ?? 0) + (sd.churned ?? 0),
            active: sd.active ?? 0,
            medium_risk: sd.medium_risk ?? 0,
            high_risk: sd.high_risk ?? 0,
            churned: sd.churned ?? 0,
            revenue_this_month: raw.revenue_this_month ?? (raw.revenue_trend ?? []).reduce((s: number, r: any) => s + (r.revenue ?? 0), 0),
            revenue_last_month: raw.revenue_last_month ?? 0,
            avg_lifetime_value: raw.avg_lifetime_value ?? 0,
          },
          scatter_data: (raw.scatter_data ?? []).filter((c: any) => c.total_bookings > 0),
          revenue_trend: raw.revenue_trend ?? [],
          revenue_lifetime: raw.revenue_lifetime ?? 0,
          merchant_fees: raw.merchant_fees ?? { stripe: 0, square: 0, total: 0, net_revenue: 0 },
          franchise_fees: raw.franchise_fees ?? { royalty: 0, marketing: 0, total: 0 },
          pnl: raw.pnl ?? null,
          coupon_impact: (raw.coupon_analysis ?? []).map((c: any) => ({
            code: c.code,
            first_time: c.uses - Math.round(c.uses * (c.repeat_rate ?? 0)),
            repeat: Math.round(c.uses * (c.repeat_rate ?? 0)),
            repeat_rate: c.repeat_rate ?? 0,
          })),
          attribution: raw.attribution ?? {},
          refunds: raw.refunds ?? null,
        };
        setAnalytics(mapped);
      })
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, []); // fetch once on mount, filter client-side

  // Fetch reviews, organic, and creatives data
  useEffect(() => {
    const safeFetch = (url: string, setter: (v: any) => void) => {
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => setter(data?.error ? null : data ?? null))
        .catch(() => setter(null));
    };
    safeFetch('/api/marketing/reviews', setReviewsData);
    safeFetch('/api/marketing/organic', setOrganicData);
    safeFetch('/api/meta/creative-performance', setCreativesData);
    safeFetch('/api/marketing/cohorts', setCohortData);
    safeFetch('/api/marketing/churn', setChurnData);
    safeFetch('/api/marketing/forecast', setForecastData);
  }, []);

  // Live polling — refresh every 5 min with countdown
  const [countdown, setCountdown] = useState(300);

  useEffect(() => {
    const tick = () => {
      setTimeAgo(formatTimeAgo(lastUpdated));
      setCountdown((prev) => (prev <= 1 ? 300 : prev - 1));
    };
    tick();
    const clockTimer = setInterval(tick, 1_000); // every 1s for countdown

    pollRef.current = setInterval(() => {
      setFilters((prev) => ({ ...prev }));
      setLastUpdated(new Date());
      setCountdown(300);
    }, 300_000); // 5 min

    return () => {
      clearInterval(clockTimer);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [lastUpdated]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.status !== 'all') count++;
    if (filters.search) count++;
    if (filters.spendMin !== undefined) count++;
    if (filters.spendMax !== undefined) count++;
    if (filters.couponCode) count++;
    if (filters.period !== '30d') count++;
    return count;
  }, [filters]);

  return (
    <ErrorBoundary>
    <div className="flex flex-col gap-4">
      {/* Page title + live indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Marketing Command Center
          </h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Customer lifecycle analytics and retention insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--system-green)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--system-green)' }} />
          </span>
          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>
            Live &middot; {timeAgo}
          </span>
          <span className="text-[10px] font-medium tabular-nums" style={{ color: 'var(--text-secondary)' }}>
            Next update {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Pulse bar */}
      <PulseBar
        analytics={analytics}
        loading={analyticsLoading}
        activeStatus={filters.status}
        onStatusClick={(status) => updateFilter('status', status)}
      />

      {/* Charts */}
      <ChartGrid
        analytics={analytics}
        loading={analyticsLoading}
        period={chartPeriod}
        onPeriodChange={setChartPeriod}
        onStatusClick={(status) => updateFilter('status', status)}
        reviewsData={reviewsData}
        organicData={organicData}
        creativesData={creativesData}
        cohortData={cohortData}
        churnData={churnData}
        forecastData={forecastData}
      />

      {/* Active filters bar */}
      {activeFilterCount > 0 && (
        <ActiveFilters
          filters={filters}
          totalCount={totalCount}
          filteredCount={customers.length}
          onRemoveFilter={updateFilter}
          onClearAll={clearFilters}
        />
      )}

      {/* Customer list */}
      <CustomerList
        customers={customers}
        loading={loading}
        totalCount={totalCount}
        filters={filters}
        onFilterChange={updateFilter}
      />
    </div>
    </ErrorBoundary>
  );
}
