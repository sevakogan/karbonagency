'use client';

import { useMemo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  ScatterChart, Scatter, ZAxis,
  BarChart, Bar, Legend,
} from 'recharts';
import type { AnalyticsData, CustomerRecord } from './marketing-command-center';

interface ChartGridProps {
  analytics: AnalyticsData | null;
  loading: boolean;
  period: string;
  onPeriodChange: (period: string) => void;
  onStatusClick: (status: 'all' | 'active' | 'at_risk' | 'churned') => void;
  customers: CustomerRecord[];
}

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  at_risk: '#eab308',
  churned: '#ef4444',
};

const PERIOD_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '3d', value: '3d' },
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: 'MTD', value: 'mtd' },
  { label: '90d', value: '90d' },
  { label: 'All', value: 'all' },
];

function ChartCard({ title, trailing, children }: {
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-3.5 backdrop-blur-xl"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        className="absolute top-0 left-[8%] right-[8%] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, var(--gloss-highlight-strong), transparent)' }}
      />
      <div className="flex items-center justify-between mb-3">
        <p
          className="text-[9px] font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-secondary)' }}
        >
          {title}
        </p>
        {trailing}
      </div>
      {children}
    </div>
  );
}

function PeriodToggle({ value, onChange }: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-0.5 rounded-full p-0.5" style={{ background: 'var(--fill-quaternary)' }}>
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="px-2 py-0.5 rounded-full text-[9px] font-semibold transition-colors"
          style={{
            background: value === opt.value ? 'var(--accent)' : 'transparent',
            color: value === opt.value ? '#fff' : 'var(--text-tertiary)',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function formatShort(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{
        background: 'var(--glass-bg-heavy)',
        border: '1px solid var(--glass-border-strong)',
        backdropFilter: 'blur(20px)',
        color: 'var(--text-primary)',
      }}
    >
      <p className="font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }) => (
        <p key={entry.name} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span style={{ color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <span className="font-semibold">{typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}</span>
        </p>
      ))}
    </div>
  );
}

function RevenueTrendChart({ data, period, onPeriodChange }: {
  data: AnalyticsData['revenue_trend'];
  period: string;
  onPeriodChange: (p: string) => void;
}) {
  return (
    <ChartCard
      title="Revenue Trend"
      trailing={<PeriodToggle value={period} onChange={onPeriodChange} />}
    >
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--system-green)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--system-green)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="couponGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--system-purple)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--system-purple)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" opacity={0.3} />
            <XAxis
              dataKey="period"
              tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: 'var(--text-quaternary)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatShort}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'var(--text-quaternary)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltipContent />} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="coupon_revenue"
              stackId="1"
              stroke="var(--system-purple)"
              fill="url(#couponGrad)"
              strokeWidth={1.5}
              name="Coupon Rev"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="revenue"
              stackId="1"
              stroke="var(--system-green)"
              fill="url(#revGrad)"
              strokeWidth={1.5}
              name="Revenue"
            />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="bookings"
              stroke="var(--system-blue)"
              fill="none"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              name="Bookings"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function HealthRing({ analytics, onStatusClick }: {
  analytics: AnalyticsData | null;
  onStatusClick: (s: 'all' | 'active' | 'at_risk' | 'churned') => void;
}) {
  const summary = analytics?.summary;
  const data = useMemo(() => [
    { name: 'Active', value: summary?.active ?? 0, color: STATUS_COLORS.active },
    { name: 'At Risk', value: summary?.at_risk ?? 0, color: STATUS_COLORS.at_risk },
    { name: 'Churned', value: summary?.churned ?? 0, color: STATUS_COLORS.churned },
  ], [summary]);

  const total = data.reduce((s, d) => s + d.value, 0);

  const handleClick = (_: unknown, index: number) => {
    const statusMap: Array<'active' | 'at_risk' | 'churned'> = ['active', 'at_risk', 'churned'];
    onStatusClick(statusMap[index]);
  };

  return (
    <ChartCard title="Health Ring">
      <div className="h-52 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              paddingAngle={2}
              dataKey="value"
              onClick={handleClick}
              cursor="pointer"
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltipContent />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {total}
          </p>
          <p className="text-[9px] font-medium" style={{ color: 'var(--text-secondary)' }}>
            customers
          </p>
        </div>
      </div>
    </ChartCard>
  );
}

const SCATTER_COLORS: Record<string, string> = {
  active: '#10b981',
  at_risk: '#f59e0b',
  churned: '#f43f5e',
};

function abbreviateName(fullName: string): string {
  const parts = (fullName || '').trim().split(' ');
  if (parts.length < 2) return parts[0] ?? '?';
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function VipScatter({ customers, onStatusClick }: {
  customers: CustomerRecord[];
  onStatusClick: (s: 'all' | 'active' | 'at_risk' | 'churned') => void;
}) {
  const scatterData = useMemo(() => {
    return customers
      .filter((c) => c.total_bookings > 0)
      .map((c) => ({
        x: c.total_bookings,
        y: c.lifetime_spend ?? 0,
        z: Math.max(60, 300 - (c.days_since_last ?? 999) * 3),
        name: abbreviateName(c.name),
        fullName: c.name,
        status: c.status,
        days: c.days_since_last ?? 0,
        fill: SCATTER_COLORS[c.status] ?? '#6b7280',
      }));
  }, [customers]);

  const ScatterTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const statusLabel = d.status === 'active' ? '🟢 Active' : d.status === 'at_risk' ? '🟡 At Risk' : '🔴 Churned';
    return (
      <div
        className="rounded-xl px-3.5 py-2.5 text-xs shadow-lg"
        style={{
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
        }}
      >
        <p className="font-bold text-sm mb-1">{d.fullName}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] opacity-80">
          <span>Spend</span><span className="font-semibold text-right">${(d.y ?? 0).toLocaleString()}</span>
          <span>Visits</span><span className="font-semibold text-right">{d.x}</span>
          <span>Last visit</span><span className="font-semibold text-right">{d.days}d ago</span>
          <span>Status</span><span className="text-right">{statusLabel}</span>
        </div>
      </div>
    );
  };

  return (
    <ChartCard title="Customer Value Map">
      <div className="h-56 relative">
        {/* Quadrant labels */}
        <div className="absolute inset-4 pointer-events-none grid grid-cols-2 grid-rows-2 text-[7px] font-bold uppercase tracking-widest z-0 opacity-20" style={{ color: 'var(--text-primary)' }}>
          <span className="self-start">💰 Big Spenders</span>
          <span className="self-start text-right">🏆 VIPs</span>
          <span className="self-end">👋 One-timers</span>
          <span className="self-end text-right">🔄 Regulars</span>
        </div>
        {/* Legend */}
        <div className="absolute top-1 right-1 flex gap-3 text-[8px] font-medium z-10" style={{ color: 'var(--text-secondary)' }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: SCATTER_COLORS.active }} />Active</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: SCATTER_COLORS.at_risk }} />At Risk</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: SCATTER_COLORS.churned }} />Churned</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 16, right: 8, bottom: 4, left: -6 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--separator)" opacity={0.15} />
            <XAxis
              type="number"
              dataKey="x"
              name="Visits"
              label={{ value: 'Visits →', position: 'insideBottomRight', offset: -4, style: { fill: 'var(--text-secondary)', fontSize: 9, fontWeight: 600 } }}
              tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Spend"
              label={{ value: 'Spend ↑', position: 'insideTopLeft', offset: 4, style: { fill: 'var(--text-secondary)', fontSize: 9, fontWeight: 600 } }}
              tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatShort}
            />
            <ZAxis type="number" dataKey="z" range={[40, 250]} />
            <Tooltip content={<ScatterTooltipContent />} />
            <Scatter
              data={scatterData}
              onClick={(point) => {
                if (point?.status) {
                  onStatusClick(point.status as 'active' | 'at_risk' | 'churned');
                }
              }}
              cursor="pointer"
              fillOpacity={0.85}
              strokeWidth={1}
              stroke="rgba(255,255,255,0.3)"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

function CouponImpactChart({ data }: { data: AnalyticsData['coupon_impact'] }) {
  const chartData = useMemo(() => data.slice(0, 8), [data]);

  return (
    <ChartCard title="Coupon Impact">
      <div className="h-52">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              No coupon data yet
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" opacity={0.2} />
              <XAxis
                dataKey="code"
                tick={{ fill: 'var(--text-quaternary)', fontSize: 8 }}
                tickLine={false}
                axisLine={false}
                angle={-30}
                textAnchor="end"
                height={40}
              />
              <YAxis
                tick={{ fill: 'var(--text-quaternary)', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Legend
                wrapperStyle={{ fontSize: 9, color: 'var(--text-secondary)' }}
              />
              <Bar dataKey="first_time" name="First Time" fill="var(--system-blue)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="repeat" name="Repeat" fill="var(--system-green)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </ChartCard>
  );
}

export function ChartGrid({ analytics, loading, period, onPeriodChange, onStatusClick, customers }: ChartGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl p-3.5 h-64"
            style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
          >
            <div className="skeleton h-4 w-24 rounded mb-4" />
            <div className="skeleton h-48 w-full rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <RevenueTrendChart
        data={analytics?.revenue_trend ?? []}
        period={period}
        onPeriodChange={onPeriodChange}
      />
      <HealthRing
        analytics={analytics}
        onStatusClick={onStatusClick}
      />
      <VipScatter
        customers={customers}
        onStatusClick={onStatusClick}
      />
      <CouponImpactChart
        data={analytics?.coupon_impact ?? []}
      />
    </div>
  );
}
