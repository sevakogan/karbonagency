'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PulseBar } from './pulse-bar';
import { ChartGrid } from './chart-grid';
import { ActiveFilters } from './active-filters';
import { CustomerList } from './customer-list';
import { formatTimeAgo } from '@/hooks/use-live-poll';

export interface MarketingFilters {
  status: 'all' | 'active' | 'at_risk' | 'churned';
  search: string;
  sort: string;
  order: 'asc' | 'desc';
  spendMin?: number;
  spendMax?: number;
  couponCode?: string;
  period: '7d' | '30d' | '90d' | 'all';
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

export interface AnalyticsData {
  summary: {
    total: number;
    active: number;
    at_risk: number;
    churned: number;
    revenue_this_month: number;
    revenue_last_month: number;
    avg_lifetime_value: number;
  };
  revenue_trend: Array<{
    date: string;
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
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
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
        setCustomers(data.customers ?? []);
        setTotalCount(data.total ?? 0);
      })
      .catch(() => {
        setCustomers([]);
        setTotalCount(0);
      })
      .finally(() => setLoading(false));
  }, [queryString]);

  // Fetch analytics
  useEffect(() => {
    setAnalyticsLoading(true);
    const params = new URLSearchParams();
    params.set('period', filters.period);
    fetch(`/api/marketing/analytics?${params.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((raw) => {
        if (!raw) { setAnalytics(null); return; }
        // Map API response shape to AnalyticsData interface
        const sd = raw.status_distribution ?? {};
        const mapped: AnalyticsData = {
          summary: {
            total: (sd.active ?? 0) + (sd.at_risk ?? 0) + (sd.churned ?? 0),
            active: sd.active ?? 0,
            at_risk: sd.at_risk ?? 0,
            churned: sd.churned ?? 0,
            revenue_this_month: raw.revenue_trend?.reduce((s: number, r: any) => s + (r.revenue ?? 0), 0) ?? 0,
            revenue_last_month: 0,
            avg_lifetime_value: 0,
          },
          revenue_trend: raw.revenue_trend ?? [],
          coupon_impact: (raw.coupon_analysis ?? []).map((c: any) => ({
            code: c.code,
            first_time: c.uses - Math.round(c.uses * (c.repeat_rate ?? 0)),
            repeat: Math.round(c.uses * (c.repeat_rate ?? 0)),
            repeat_rate: c.repeat_rate ?? 0,
          })),
        };
        setAnalytics(mapped);
      })
      .catch(() => setAnalytics(null))
      .finally(() => setAnalyticsLoading(false));
  }, [filters.period]);

  // Live polling — refresh every 5 min
  useEffect(() => {
    const tick = () => setTimeAgo(formatTimeAgo(lastUpdated));
    tick();
    const clockTimer = setInterval(tick, 30_000); // update "X min ago" every 30s

    pollRef.current = setInterval(() => {
      // Re-trigger customer + analytics fetches by bumping a hidden counter
      setFilters((prev) => ({ ...prev }));
      setLastUpdated(new Date());
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
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
            Live &middot; {timeAgo}
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
        period={filters.period}
        onPeriodChange={(p) => updateFilter('period', p)}
        onStatusClick={(status) => updateFilter('status', status)}
        customers={customers}
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
  );
}
