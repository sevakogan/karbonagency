'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';

// ── Types ──────────────────────────────────────────────

interface CustomerSearchResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_bookings: number;
  total_revenue: number;
  first_booking_at: string | null;
  last_booking_at: string | null;
}

interface TimelineEvent {
  date: string;
  type: 'signup' | 'booking' | 'charge' | 'refund';
  description: string;
  amount: number;
  details: string;
  gapDays: number | null;
}

interface CustomerJourney {
  customer: CustomerSearchResult & { signup_date: string; next_predicted_date?: string | null };
  timeline: TimelineEvent[];
  summary: {
    lifetime_spend: number;
    total_bookings: number;
    days_as_customer: number;
  };
}

interface ChurnStatus {
  churn_score: number;
  risk_level: 'safe' | 'watch' | 'at_risk' | 'critical';
}

interface OverviewStats {
  total_customers: number;
  avg_signup_to_first_booking_days: number | null;
  avg_rebooking_gap_days: number | null;
  fastest_converter: { name: string; days: number } | null;
  most_loyal: { name: string; bookings: number } | null;
  top_10_by_ltv: Array<{ id: string; name: string; total_revenue: number; total_bookings: number }>;
}

interface PatternsData {
  day_of_week: Array<{ day: string; bookings: number; revenue: number; avg_ticket: number }>;
  time_of_day: Array<{ slot: string; bookings: number; revenue: number }>;
  heatmap: Array<Record<string, string | number>>;
  peak: { day: string; slot: string; count: number; pct: number };
  total_bookings: number;
}

// ── Helpers ──────────────────────────────────────────────

function fmt$(n: number): string {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Component ──────────────────────────────────────────

export function LifelineView() {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [journey, setJourney] = useState<CustomerJourney | null>(null);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [patterns, setPatterns] = useState<PatternsData | null>(null);
  const [churnStatus, setChurnStatus] = useState<ChurnStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Fetch overview stats on mount
  useEffect(() => {
    fetch('/api/lifeline/overview')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setOverview(data))
      .catch(() => setOverview(null));
  }, []);

  // Fetch patterns on mount
  useEffect(() => {
    fetch('/api/lifeline/patterns')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setPatterns(data))
      .catch(() => setPatterns(null));
  }, []);

  // Debounced search
  useEffect(() => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/lifeline/customer?search=${encodeURIComponent(search)}`)
        .then((r) => (r.ok ? r.json() : { customers: [] }))
        .then((data) => setSearchResults(data.customers ?? []))
        .catch(() => setSearchResults([]))
        .finally(() => setSearchLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch journey + churn status when customer selected
  const selectCustomer = useCallback((id: string) => {
    setSelectedCustomer(id);
    setSearchResults([]);
    setSearch('');
    setLoading(true);
    setChurnStatus(null);
    setActionToast(null);

    fetch(`/api/lifeline/customer?customerId=${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setJourney(data);
        // Fetch churn status for this customer
        if (data?.customer?.email) {
          fetch('/api/marketing/churn')
            .then((r) => (r.ok ? r.json() : null))
            .then((churnData) => {
              const customers = churnData?.customers ?? [];
              const match = customers.find(
                (c: { customer_id?: string; email?: string }) =>
                  c.customer_id === id || c.email === data.customer.email,
              );
              if (match) {
                setChurnStatus({
                  churn_score: match.churn_score ?? 0,
                  risk_level: match.risk_level ?? 'safe',
                });
              }
            })
            .catch(() => setChurnStatus(null));
        }
      })
      .catch(() => setJourney(null))
      .finally(() => setLoading(false));
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!actionToast) return;
    const t = setTimeout(() => setActionToast(null), 3000);
    return () => clearTimeout(t);
  }, [actionToast]);

  const handleAction = (label: string) => {
    setActionToast(`${label} — action triggered (placeholder)`);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Toast notification */}
      {actionToast && (
        <div
          className="fixed top-4 right-4 z-[100] rounded-lg px-4 py-3 text-sm font-medium shadow-lg animate-in fade-in slide-in-from-top-2"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {actionToast}
        </div>
      )}

      {/* Page header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Customer Lifeline
        </h1>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
          Individual customer journeys, timing patterns, and booking behavior
        </p>
      </div>

      {/* ── Top Section: Search + Overview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div className="lg:col-span-1 glass-card p-4 relative">
          <label className="text-xs font-semibold mb-2 block" style={{ color: 'var(--text-secondary)' }}>
            Find a Customer
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
          {/* Dropdown results */}
          {(searchResults.length > 0 || searchLoading) && (
            <div
              className="absolute left-4 right-4 top-[76px] z-50 rounded-lg shadow-xl max-h-64 overflow-y-auto"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
            >
              {searchLoading && (
                <div className="p-3 text-xs" style={{ color: 'var(--text-tertiary)' }}>Searching...</div>
              )}
              {searchResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCustomer(c.id)}
                  className="w-full text-left px-3 py-2 hover:opacity-80 transition-opacity"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {c.name}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {c.email} · {c.total_bookings} bookings · {fmt$(c.total_revenue)}
                  </div>
                </button>
              ))}
            </div>
          )}
          {/* Selected customer quick info */}
          {journey && !loading && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {journey.customer.name}
                </div>
                {/* Churn Risk Badge */}
                {churnStatus && <ChurnBadge status={churnStatus} />}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {journey.customer.email}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                {journey.customer.phone}
              </div>

              {/* Predicted Next Booking */}
              {journey.customer.next_predicted_date && (
                <PredictedBookingCard dateIso={journey.customer.next_predicted_date} />
              )}
            </div>
          )}
        </div>

        {/* Quick stats */}
        <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <QuickStat label="Total Customers" value={overview?.total_customers ?? '...'} />
          <QuickStat
            label="Avg Signup → Booking"
            value={overview?.avg_signup_to_first_booking_days != null ? `${overview.avg_signup_to_first_booking_days}d` : '...'}
          />
          <QuickStat
            label="Avg Rebooking Gap"
            value={overview?.avg_rebooking_gap_days != null ? `${overview.avg_rebooking_gap_days}d` : '...'}
          />
          <QuickStat
            label="Most Loyal"
            value={overview?.most_loyal?.name ?? '...'}
            sub={overview?.most_loyal ? `${overview.most_loyal.bookings} visits` : undefined}
          />
        </div>
      </div>

      {/* ── Middle Section: Customer Timeline ── */}
      {loading && (
        <div className="glass-card p-8 text-center">
          <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading journey...</div>
        </div>
      )}

      {journey && !loading && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
            Journey Timeline — {journey.customer.name}
          </h2>
          <div className="relative ml-4">
            {journey.timeline.map((event, i) => {
              const isFirst = event.type === 'signup' || (event.type === 'booking' && i === (journey.timeline[0]?.type === 'signup' ? 1 : 0));
              const isRefund = event.type === 'refund';
              const isLongGap = (event.gapDays ?? 0) > 30;

              // Color: signup=gray, first booking=blue, repeat=green, refund=red, long gap line=orange
              let dotColor = 'var(--system-green)';
              if (event.type === 'signup') dotColor = 'var(--text-tertiary)';
              else if (isFirst) dotColor = 'var(--system-blue, #3b82f6)';
              else if (isRefund) dotColor = 'var(--system-red)';

              return (
                <div key={`${event.date}-${i}`} className="relative pb-6 last:pb-0">
                  {/* Gap indicator */}
                  {event.gapDays != null && event.gapDays > 0 && (
                    <div
                      className="absolute -left-4 -top-3 text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{
                        color: isLongGap ? 'var(--system-orange, #f59e0b)' : 'var(--text-tertiary)',
                        background: isLongGap ? 'rgba(245,158,11,0.1)' : 'transparent',
                      }}
                    >
                      {event.gapDays}d
                    </div>
                  )}

                  {/* Vertical line */}
                  {i < journey.timeline.length - 1 && (
                    <div
                      className="absolute left-[5px] top-[14px] w-[2px]"
                      style={{
                        height: 'calc(100% - 2px)',
                        background: isLongGap ? 'var(--system-orange, #f59e0b)' : 'var(--border)',
                      }}
                    />
                  )}

                  {/* Dot */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 rounded-full mt-0.5 flex-shrink-0"
                      style={{ background: dotColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {fmtDate(event.date)} — {event.description}
                        </span>
                        {event.amount !== 0 && (
                          <span
                            className="text-xs font-semibold flex-shrink-0"
                            style={{ color: isRefund ? 'var(--system-red)' : 'var(--system-green)' }}
                          >
                            {isRefund ? '-' : ''}{fmt$(Math.abs(event.amount))}
                          </span>
                        )}
                      </div>
                      {event.details && (
                        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                          {event.details}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary bar */}
          <div
            className="mt-4 pt-3 flex items-center gap-4 text-xs font-medium"
            style={{ borderTop: '1px solid var(--border)', color: 'var(--text-secondary)' }}
          >
            <span>Total: {fmt$(journey.summary.lifetime_spend)} lifetime</span>
            <span>&middot;</span>
            <span>{journey.summary.total_bookings} bookings</span>
            <span>&middot;</span>
            <span>{journey.summary.days_as_customer} days as customer</span>
          </div>

          {/* Customer Actions */}
          <div
            className="mt-3 pt-3 flex flex-wrap items-center gap-2"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider mr-1" style={{ color: 'var(--text-tertiary)' }}>
              Actions
            </span>
            {(['Send Re-engagement', 'Add to VIP List', 'Flag for Review'] as const).map((label) => (
              <button
                key={label}
                onClick={() => handleAction(label)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-80"
                style={{
                  background: 'var(--glass-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Top 10 by LTV */}
      {overview && overview.top_10_by_ltv.length > 0 && (
        <div className="glass-card p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
            Top 10 Customers by Lifetime Value
          </h2>
          <div className="space-y-2">
            {overview.top_10_by_ltv.map((c, i) => (
              <button
                key={c.id}
                onClick={() => selectCustomer(c.id)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg transition-opacity hover:opacity-80"
                style={{ background: 'var(--glass-bg)' }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'var(--accent)', color: '#fff' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {c.name}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  <span>{c.total_bookings} visits</span>
                  <span className="font-semibold" style={{ color: 'var(--system-green)' }}>
                    {fmt$(c.total_revenue)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Bottom Section: Booking Patterns (Feature 20) ── */}
      <BookingPatterns data={patterns} />
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────

function QuickStat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass-card p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </div>
      <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
        {value}
      </div>
      {sub && (
        <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{sub}</div>
      )}
    </div>
  );
}

const CHURN_BADGE_CONFIG: Record<ChurnStatus['risk_level'], { label: string; color: string; bg: string }> = {
  safe: { label: 'Safe', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  watch: { label: 'Watch', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
  at_risk: { label: 'At Risk', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

function ChurnBadge({ status }: { status: ChurnStatus }) {
  const config = CHURN_BADGE_CONFIG[status.risk_level] ?? CHURN_BADGE_CONFIG.safe;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: config.bg, color: config.color }}
      title={`Churn score: ${status.churn_score}/100`}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: config.color }}
      />
      {config.label}
    </span>
  );
}

function PredictedBookingCard({ dateIso }: { dateIso: string }) {
  const target = new Date(dateIso);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffDays = Math.max(0, Math.ceil(diffMs / 86400000));

  const dateStr = target.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  // Confidence: closer = higher
  const confidence = diffDays <= 7 ? 'High' : diffDays <= 21 ? 'Medium' : 'Low';
  const confidenceColor = diffDays <= 7 ? '#22c55e' : diffDays <= 21 ? '#eab308' : '#9ca3af';

  return (
    <div
      className="mt-3 rounded-lg p-3"
      style={{ background: 'var(--glass-bg)', border: '1px solid var(--border)' }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>
        Predicted Next Visit
      </div>
      <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
        {dateStr}{' '}
        <span className="text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>
          (in {diffDays} {diffDays === 1 ? 'day' : 'days'})
        </span>
      </div>
      <div className="flex items-center gap-1.5 mt-1">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: confidenceColor }}
        />
        <span className="text-[10px] font-medium" style={{ color: confidenceColor }}>
          {confidence} confidence
        </span>
      </div>
    </div>
  );
}

function BookingPatterns({ data }: { data: PatternsData | null }) {
  if (!data) {
    return (
      <div className="glass-card p-8 text-center">
        <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading booking patterns...</div>
      </div>
    );
  }

  const TIME_SLOT_ORDER = ['Morning', 'Afternoon', 'Evening', 'Late Night'];
  const HEATMAP_COLORS = { low: '#fef3c7', medium: '#f59e0b', high: '#dc2626' };

  // Find max for heatmap normalization
  const allCounts = data.heatmap.flatMap((row) =>
    TIME_SLOT_ORDER.map((slot) => Number(row[slot]) || 0),
  );
  const maxCount = Math.max(...allCounts, 1);

  function heatColor(count: number): string {
    const ratio = count / maxCount;
    if (ratio < 0.33) return HEATMAP_COLORS.low;
    if (ratio < 0.66) return HEATMAP_COLORS.medium;
    return HEATMAP_COLORS.high;
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Booking Patterns
          </h2>
          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
            Day-of-week and time-of-day analysis across {data.total_bookings.toLocaleString()} bookings
          </p>
        </div>
        {data.peak.day && (
          <div
            className="text-[10px] font-medium px-2 py-1 rounded-full"
            style={{ background: 'rgba(245,158,11,0.15)', color: 'var(--system-orange, #f59e0b)' }}
          >
            Peak: {data.peak.day} {data.peak.slot}s — {data.peak.pct}% of bookings
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Day of week bar chart */}
        <div>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Bookings by Day of Week
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.day_of_week} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                  tickFormatter={(v: string) => v.slice(0, 3)}
                />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 11,
                  }}
                  formatter={(value: number, name: string) => [
                    name === 'revenue' ? `$${value.toLocaleString()}` : value,
                    name === 'revenue' ? 'Revenue' : 'Bookings',
                  ]}
                />
                <Bar dataKey="bookings" radius={[4, 4, 0, 0]}>
                  {data.day_of_week.map((entry) => (
                    <Cell
                      key={entry.day}
                      fill={entry.day === data.peak.day ? '#f59e0b' : 'var(--accent)'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Time of day horizontal bars */}
        <div>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--text-tertiary)' }}>
            Bookings by Time of Day
          </h3>
          <div className="space-y-3">
            {TIME_SLOT_ORDER.map((slotLabel) => {
              const slot = data.time_of_day.find((s) => s.slot === slotLabel);
              if (!slot) return null;
              const maxSlotBookings = Math.max(...data.time_of_day.map((s) => s.bookings), 1);
              const widthPct = Math.max(4, (slot.bookings / maxSlotBookings) * 100);
              const isPeak = slotLabel === data.peak.slot;

              return (
                <div key={slotLabel}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: 'var(--text-secondary)' }}>{slotLabel}</span>
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      {slot.bookings} bookings · ${slot.revenue.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-4 rounded-full overflow-hidden" style={{ background: 'var(--glass-bg)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${widthPct}%`,
                        background: isPeak ? '#f59e0b' : 'var(--accent)',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="mt-6">
        <h3 className="text-xs font-semibold mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Day x Time Heatmap
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full" style={{ minWidth: 480 }}>
            <thead>
              <tr>
                <th className="text-[10px] font-medium text-left pb-2 pr-2" style={{ color: 'var(--text-tertiary)' }} />
                {data.heatmap.map((row) => (
                  <th
                    key={String(row.day)}
                    className="text-[10px] font-medium text-center pb-2 px-1"
                    style={{ color: 'var(--text-tertiary)' }}
                  >
                    {String(row.day).slice(0, 3)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOT_ORDER.map((slot) => (
                <tr key={slot}>
                  <td className="text-[10px] font-medium pr-2 py-1" style={{ color: 'var(--text-tertiary)' }}>
                    {slot}
                  </td>
                  {data.heatmap.map((row) => {
                    const count = Number(row[slot]) || 0;
                    return (
                      <td key={`${row.day}-${slot}`} className="px-1 py-1 text-center">
                        <div
                          className="rounded-md px-2 py-1.5 text-[10px] font-bold"
                          style={{
                            background: count > 0 ? heatColor(count) : 'var(--glass-bg)',
                            color: count > 0 && count / maxCount > 0.5 ? '#fff' : 'var(--text-primary)',
                          }}
                        >
                          {count}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Low</span>
          <div className="flex gap-0.5">
            {[HEATMAP_COLORS.low, HEATMAP_COLORS.medium, HEATMAP_COLORS.high].map((c) => (
              <div key={c} className="w-5 h-3 rounded-sm" style={{ background: c }} />
            ))}
          </div>
          <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>High</span>
        </div>
      </div>
    </div>
  );
}
