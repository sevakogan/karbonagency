'use client';

import { useState, useEffect } from 'react';
import { BentoCard } from './bento-card';
import { Badge } from './badge';
import { AnimNum } from './anim-num';
import { MiniBar } from './mini-bar';

/* ── Types ────────────────────────────────────────────── */

interface VoucherRow {
  code: string;
  timesUsed: number;
  totalDiscount: number;
}

interface SimUtilization {
  name: string;
  bookings: number;
  revenue: number;
}

interface ShiftOSData {
  revenue: { today: number; month: number; lifetime: number };
  bookingsToday: number;
  avgTicket: number;
  customers: {
    newCount: number;
    returningCount: number;
    returnRate: number;
    totalCustomers: number;
    returnedCustomers: number;
    avgRebookingDays: number;
    rebookingTrend: number;
    avgCustomerValue: number;
  };
  topVouchers: VoucherRow[];
  simulators: SimUtilization[];
}

interface ShiftOSAnalyticsPanelProps {
  companyId: string;
}

/* ── Helpers ──────────────────────────────────────────── */

const LABEL: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--text-tertiary)',
  letterSpacing: '0.02em',
  textTransform: 'uppercase',
};

const BIG_NUM: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 700,
  color: 'var(--text-primary)',
  fontVariantNumeric: 'tabular-nums',
  lineHeight: 1.1,
};

const SUB: React.CSSProperties = {
  fontSize: 11,
  color: 'var(--text-tertiary)',
  marginTop: 2,
};

function EmptyState({ message }: { message: string }) {
  return (
    <p style={{ fontSize: 12, color: 'var(--text-quaternary)', textAlign: 'center', padding: '16px 0' }}>
      {message}
    </p>
  );
}

/* ── Section A: Revenue Hero Strip ────────────────────── */

function RevenueHero({ data }: { data: ShiftOSData }) {
  return (
    <BentoCard colSpan={12} platformColor="#00D26A">
      <div className="flex flex-col gap-2">
        <p style={LABEL}>Revenue Overview</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p style={{ ...BIG_NUM, color: '#00D26A' }}>
              <AnimNum value={data.revenue.today} prefix="$" />
            </p>
            <p style={SUB}>Today</p>
          </div>
          <div>
            <p style={BIG_NUM}>
              <AnimNum value={data.revenue.month} prefix="$" />
            </p>
            <p style={SUB}>This Month</p>
          </div>
          <div>
            <p style={BIG_NUM}>
              <AnimNum value={data.revenue.lifetime} prefix="$" />
            </p>
            <p style={SUB}>Lifetime</p>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>
          <AnimNum value={data.bookingsToday} /> bookings today&nbsp;&middot;&nbsp;
          $<AnimNum value={data.avgTicket} /> avg ticket
        </p>
      </div>
    </BentoCard>
  );
}

/* ── Section B: Customer Health Grid ──────────────────── */

function DonutChart({ newPct, returningPct }: { newPct: number; returningPct: number }) {
  const r = 32;
  const c = 2 * Math.PI * r;
  const newArc = (newPct / 100) * c;
  const retArc = (returningPct / 100) * c;

  return (
    <div className="flex items-center gap-3">
      <svg width={80} height={80} viewBox="0 0 80 80">
        <circle cx={40} cy={40} r={r} fill="none" stroke="var(--separator)" strokeWidth={8} />
        <circle
          cx={40} cy={40} r={r} fill="none" stroke="#3B82F6" strokeWidth={8}
          strokeDasharray={`${newArc} ${c - newArc}`}
          strokeDashoffset={c * 0.25}
          strokeLinecap="round"
        />
        <circle
          cx={40} cy={40} r={r} fill="none" stroke="#00D26A" strokeWidth={8}
          strokeDasharray={`${retArc} ${c - retArc}`}
          strokeDashoffset={c * 0.25 - newArc}
          strokeLinecap="round"
        />
      </svg>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: '#3B82F6' }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>New {newPct}%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: '#00D26A' }} />
          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Returning {returningPct}%</span>
        </div>
      </div>
    </div>
  );
}

function CustomerHealthGrid({ data }: { data: ShiftOSData }) {
  const { customers } = data;
  const total = customers.newCount + customers.returningCount;
  const newPct = total > 0 ? Math.round((customers.newCount / total) * 100) : 0;
  const retPct = total > 0 ? 100 - newPct : 0;

  return (
    <div className="grid grid-cols-2 gap-2" style={{ gridColumn: 'span 12' }}>
      <BentoCard>
        <p style={LABEL}>New vs Returning</p>
        <div style={{ marginTop: 8 }}>
          {total > 0 ? (
            <DonutChart newPct={newPct} returningPct={retPct} />
          ) : (
            <EmptyState message="No customer data yet" />
          )}
        </div>
      </BentoCard>

      <BentoCard>
        <p style={LABEL}>Return Rate</p>
        <p style={{ ...BIG_NUM, marginTop: 8 }}>
          <AnimNum value={customers.returnRate} suffix="%" />
        </p>
        <p style={SUB}>
          {customers.returnedCustomers} of {customers.totalCustomers} customers have returned
        </p>
      </BentoCard>

      <BentoCard>
        <p style={LABEL}>Avg Rebooking Cadence</p>
        <p style={{ ...BIG_NUM, marginTop: 8 }}>
          Every <AnimNum value={customers.avgRebookingDays} /> days
        </p>
        {customers.rebookingTrend !== 0 && (
          <p style={{ fontSize: 11, marginTop: 4, color: customers.rebookingTrend < 0 ? '#00D26A' : 'var(--system-red)' }}>
            {customers.rebookingTrend < 0 ? '\u2193' : '\u2191'} {Math.abs(customers.rebookingTrend)} days vs prior period
          </p>
        )}
      </BentoCard>

      <BentoCard>
        <p style={LABEL}>Avg Customer Value</p>
        <p style={{ ...BIG_NUM, marginTop: 8 }}>
          <AnimNum value={customers.avgCustomerValue} prefix="$" />
        </p>
        <p style={SUB}>Lifetime average per customer</p>
      </BentoCard>
    </div>
  );
}

/* ── Section C: Top Vouchers ──────────────────────────── */

function TopVouchers({ vouchers }: { vouchers: VoucherRow[] }) {
  return (
    <BentoCard colSpan={12}>
      <p style={LABEL}>Top Vouchers</p>
      {vouchers.length === 0 ? (
        <EmptyState message="No vouchers used in this period" />
      ) : (
        <div className="flex flex-col gap-1.5" style={{ marginTop: 8 }}>
          {vouchers.slice(0, 5).map((v, i) => (
            <div key={v.code} className="flex items-center gap-2" style={{ fontSize: 12 }}>
              <span style={{ width: 18, fontWeight: 700, color: 'var(--text-tertiary)', textAlign: 'right' }}>
                {i + 1}
              </span>
              <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)', flex: 1 }}>
                {v.code}
              </span>
              <Badge text={`${v.timesUsed}x`} color="#3B82F6" />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                -${v.totalDiscount.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </BentoCard>
  );
}

/* ── Section D: Simulator Utilization ─────────────────── */

function SimulatorUtilization({ simulators }: { simulators: SimUtilization[] }) {
  const maxBookings = simulators.reduce((m, s) => Math.max(m, s.bookings), 0);
  const sorted = [...simulators].sort((a, b) => b.bookings - a.bookings);

  return (
    <BentoCard colSpan={12}>
      <p style={LABEL}>Simulator Utilization</p>
      {sorted.length === 0 ? (
        <EmptyState message="No simulator data yet" />
      ) : (
        <div className="flex flex-col gap-2" style={{ marginTop: 8 }}>
          {sorted.map((s) => (
            <div key={s.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between" style={{ fontSize: 11 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{s.name}</span>
                <span style={{ color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
                  {s.bookings} bookings&nbsp;&middot;&nbsp;${s.revenue.toLocaleString()}
                </span>
              </div>
              <MiniBar value={s.bookings} max={maxBookings} color="#3B82F6" />
            </div>
          ))}
        </div>
      )}
    </BentoCard>
  );
}

/* ── Main Panel ───────────────────────────────────────── */

export function ShiftOSAnalyticsPanel({ companyId }: ShiftOSAnalyticsPanelProps) {
  const [data, setData] = useState<ShiftOSData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/shiftos/analytics?companyId=${encodeURIComponent(companyId)}`);
        if (!res.ok) {
          throw new Error(`Failed to fetch ShiftOS analytics (${res.status})`);
        }
        const json = await res.json();
        if (!cancelled) {
          setData(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [companyId]);

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-2" style={{ gridColumn: 'span 12' }}>
        <BentoCard colSpan={12}>
          <div className="flex items-center justify-center gap-2 py-8">
            <div
              className="w-4 h-4 rounded-full animate-pulse"
              style={{ background: '#00D26A44' }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Loading ShiftOS analytics...
            </span>
          </div>
        </BentoCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-12 gap-2" style={{ gridColumn: 'span 12' }}>
        <BentoCard colSpan={12}>
          <p style={{ fontSize: 12, color: 'var(--system-red)', textAlign: 'center', padding: '16px 0' }}>
            {error}
          </p>
        </BentoCard>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-12 gap-2" style={{ gridColumn: 'span 12' }}>
        <BentoCard colSpan={12}>
          <EmptyState message="No data yet — connect your ShiftOS account to see analytics" />
        </BentoCard>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-2" style={{ gridColumn: 'span 12' }}>
      <RevenueHero data={data} />
      <CustomerHealthGrid data={data} />
      <TopVouchers vouchers={data.topVouchers} />
      <SimulatorUtilization simulators={data.simulators} />
    </div>
  );
}
