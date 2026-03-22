'use client';

import { useMemo, useState, useRef, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  ScatterChart, Scatter, ZAxis,
  BarChart, Bar, Legend,
} from 'recharts';
import type { AnalyticsData, CustomerRecord } from './marketing-command-center';

// Safe number helper — prevents "Cannot read properties of undefined (reading 'toFixed'/'toLocaleString')"
function n(v: unknown): number {
  if (typeof v === 'number' && !isNaN(v)) return v;
  const parsed = Number(v);
  return isNaN(parsed) ? 0 : parsed;
}

export interface ReviewsData {
  overall_rating: number;
  total_reviews: number;
  platforms: {
    google: { rating: number; count: number };
    yelp: { rating: number; count: number };
  };
  recent: Array<{
    author: string;
    rating: number;
    text: string;
    date: string;
    platform: 'google' | 'yelp';
  }>;
  historical_avg: number;
}

export interface OrganicData {
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  daily: Array<{ date: string; clicks: number }>;
  top_queries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
}

export interface CreativeRecord {
  name: string;
  status: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  roas?: number;
}

export interface CreativesData {
  creatives: CreativeRecord[];
}

interface ChartGridProps {
  analytics: AnalyticsData | null;
  loading: boolean;
  period: string;
  onPeriodChange: (period: string) => void;
  onStatusClick: (status: 'all' | 'active' | 'at_risk' | 'churned') => void;
  reviewsData?: ReviewsData | null;
  organicData?: OrganicData | null;
  creativesData?: CreativesData | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cohortData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  churnData?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  forecastData?: any;
}

// Internal period state to prevent parent re-render on period toggle
function usePeriodToggle(externalPeriod: string, onExternalChange: (p: string) => void) {
  const [localPeriod, setLocalPeriod] = useState(externalPeriod);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((p: string) => {
    setLocalPeriod(p); // instant UI update
    // Debounce the external change to prevent re-mount
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onExternalChange(p), 50);
  }, [onExternalChange]);

  return { period: localPeriod, setPeriod: handleChange };
}

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  medium_risk: '#fbbf24',
  high_risk: '#f97316',
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

function ChartCard({ title, trailing, children, className }: {
  title: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-3.5 backdrop-blur-xl flex flex-col ${className ?? ''}`}
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
      {payload.length > 1 && (() => {
        const revenueEntries = payload.filter((e: any) => e.name !== 'Bookings');
        if (revenueEntries.length > 1) {
          const total = revenueEntries.reduce((s: number, e: any) => s + (e.value ?? 0), 0);
          return (
            <p className="flex items-center gap-1.5 mt-1 pt-1" style={{ borderTop: '1px solid var(--separator)' }}>
              <span className="w-2 h-2" />
              <span className="font-bold">Total:</span>
              <span className="font-bold">${total.toLocaleString()}</span>
            </p>
          );
        }
        return null;
      })()}
    </div>
  );
}

function InsightBar({ text }: { text: string }) {
  return (
    <div className="mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-1.5" style={{ background: 'rgba(99, 102, 241, 0.08)' }}>
      <span className="text-[10px] mt-px">💡</span>
      <p className="text-[10px] font-medium leading-tight" style={{ color: 'var(--text-secondary)' }}>
        {text}
      </p>
    </div>
  );
}

function useRevenueInsight(data: AnalyticsData['revenue_trend'], period: string): string {
  return useMemo(() => {
    if (!data.length) return 'No revenue data available for the selected period';
    const revenues = data.map((d) => d.revenue + d.coupon_revenue);
    const avg = revenues.reduce((s, v) => s + v, 0) / revenues.length;
    const latest = revenues[revenues.length - 1];
    const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;

    if (avg > 0) {
      const pctDiff = Math.round(((latest - avg) / avg) * 100);
      if (latest > avg * 1.2) {
        return `Revenue is trending up — ${pctDiff}% above your ${periodLabel} average`;
      }
      if (latest < avg * 0.8) {
        return `Revenue dipped ${Math.abs(pctDiff)}% below average — check ad spend or seasonal patterns`;
      }
    }

    // Find peak day if we have date info
    const peakEntry = data.reduce((best, cur) =>
      (cur.revenue + cur.coupon_revenue) > (best.revenue + best.coupon_revenue) ? cur : best
    , data[0]);
    const peakTotal = peakEntry.revenue + peakEntry.coupon_revenue;
    if (peakEntry.date || peakEntry.period) {
      return `Revenue is steady — peak: ${peakEntry.date ?? peakEntry.period} with ${formatShort(peakTotal)}`;
    }
    return `Revenue is steady — consistent with your ${periodLabel} average`;
  }, [data, period]);
}

function filterByPeriod<T extends { period: string }>(data: T[], period: string): T[] {
  if (period === 'all') return data;
  const now = new Date();
  let cutoff: Date;
  if (period === 'mtd') {
    cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    const days = parseInt(period) || 30;
    cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  }
  const cutoffStr = cutoff.toISOString().substring(0, 10);
  return data.filter((d) => d.period >= cutoffStr);
}

function RevenueTrendChart({ data, period, onPeriodChange }: {
  data: AnalyticsData['revenue_trend'];
  period: string;
  onPeriodChange: (p: string) => void;
}) {
  // Filter data client-side based on period — no API refetch needed
  const filteredData = useMemo(() => filterByPeriod(data, period), [data, period]);
  const insight = useRevenueInsight(filteredData, period);

  return (
    <ChartCard
      title="Revenue Trend"
      trailing={<PeriodToggle value={period} onChange={onPeriodChange} />}
    >
      <div className="h-52 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="shiftosGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="squareGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06d6a0" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#06d6a0" stopOpacity={0.02} />
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
              tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatShort}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<ChartTooltipContent />} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="shiftos_revenue"
              stackId="1"
              stroke="#818cf8"
              fill="url(#shiftosGrad)"
              strokeWidth={1.5}
              name="ShiftOS (Stripe)"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="square_revenue"
              stackId="1"
              stroke="#06d6a0"
              fill="url(#squareGrad)"
              strokeWidth={1.5}
              name="Square (iPad)"
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
      <InsightBar text={insight} />
    </ChartCard>
  );
}

function useHealthInsight(summary: AnalyticsData['summary'] | undefined): string {
  return useMemo(() => {
    if (!summary) return 'Loading customer health data...';
    const total = summary.total || (summary.active + (summary.medium_risk ?? 0) + (summary.high_risk ?? 0) + summary.churned);
    if (total === 0) return 'No customer data available yet';

    const churnedPct = Math.round((summary.churned / total) * 100);
    const highRiskPct = Math.round(((summary.high_risk ?? 0) / total) * 100);
    const mediumRiskPct = Math.round(((summary.medium_risk ?? 0) / total) * 100);
    const activePct = Math.round((summary.active / total) * 100);

    if (churnedPct > 70) {
      return `⚠️ ${churnedPct}% of customers haven't returned in 90+ days. Consider a win-back campaign`;
    }
    if (highRiskPct > 10) {
      return `⚠️ ${summary.high_risk ?? 0} customers are high risk — visited 60-90 days ago with no future booking`;
    }
    if (mediumRiskPct > 15) {
      return `${summary.medium_risk ?? 0} customers are slipping (30-60 days) — a timely offer could bring them back`;
    }
    if (activePct > 50) {
      return `Strong retention — ${activePct}% of your customer base is active`;
    }
    return `${activePct}% active, ${mediumRiskPct}% medium risk, ${highRiskPct}% high risk, ${churnedPct}% churned`;
  }, [summary]);
}

const HEALTH_COLORS = { active: '#06d6a0', medium_risk: '#fbbf24', high_risk: '#f97316', churned: '#ef476f' };

interface HealthProps {
  analytics: AnalyticsData | null;
  onStatusClick: (s: 'all' | 'active' | 'at_risk' | 'churned') => void;
}

function useHealthData(analytics: AnalyticsData | null) {
  return useMemo(() => {
    const s = analytics?.summary;
    const active = s?.active ?? 0;
    const mediumRisk = s?.medium_risk ?? 0;
    const highRisk = s?.high_risk ?? 0;
    const churned = s?.churned ?? 0;
    const total = active + mediumRisk + highRisk + churned;
    const score = total > 0 ? Math.round((active / total) * 100) : 0;
    return { active, mediumRisk, highRisk, churned, total, score };
  }, [analytics]);
}

/* ── Design 3: Three Radial Arcs ──────────────────────────────────── */
function RadialArc({ pct, color, count, label, onClick }: {
  pct: number;
  color: string;
  count: number;
  label: string;
  onClick: () => void;
}) {
  const radius = 42;
  const cx = 50;
  const cy = 55;
  // Semicircle arc from 180deg to 0deg
  const totalLen = Math.PI * radius; // half circumference
  const filled = (pct / 100) * totalLen;
  const gap = totalLen - filled;

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
    >
      <svg viewBox="0 0 100 65" className="w-[100px]">
        {/* Track */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.15"
        />
        {/* Filled */}
        <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${gap}`}
          opacity="0.9"
        />
        <text
          x={cx}
          y={cy - 4}
          textAnchor="middle"
          fill="var(--text-primary)"
          fontSize="15"
          fontWeight="700"
          fontFamily="system-ui"
        >
          {Math.round(pct)}%
        </text>
      </svg>
      <span
        className="text-base font-bold tabular-nums -mt-1"
        style={{ color: 'var(--text-primary)' }}
      >
        {count}
      </span>
      <span
        className="text-[9px] font-semibold uppercase tracking-wider"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
    </button>
  );
}

function HealthArcs({ analytics, onStatusClick }: HealthProps) {
  const { active, mediumRisk, highRisk, churned, total } = useHealthData(analytics);
  const insight = useHealthInsight(analytics?.summary);

  const activePct = total > 0 ? (active / total) * 100 : 0;
  const mediumRiskPct = total > 0 ? (mediumRisk / total) * 100 : 0;
  const highRiskPct = total > 0 ? (highRisk / total) * 100 : 0;
  const churnedPct = total > 0 ? (churned / total) * 100 : 0;

  return (
    <ChartCard title="Customer Health">
      <div className="flex justify-around items-end py-2">
        <RadialArc pct={activePct} color={HEALTH_COLORS.active} count={active} label="Active" onClick={() => onStatusClick('active')} />
        <RadialArc pct={mediumRiskPct} color={HEALTH_COLORS.medium_risk} count={mediumRisk} label="Medium Risk" onClick={() => onStatusClick('medium_risk' as any)} />
        <RadialArc pct={highRiskPct} color={HEALTH_COLORS.high_risk} count={highRisk} label="High Risk" onClick={() => onStatusClick('high_risk' as any)} />
        <RadialArc pct={churnedPct} color={HEALTH_COLORS.churned} count={churned} label="Churned" onClick={() => onStatusClick('churned')} />
      </div>
      <InsightBar text={insight} />
    </ChartCard>
  );
}

const SCATTER_COLORS: Record<string, string> = {
  active: '#06d6a0',
  medium_risk: '#fbbf24',
  high_risk: '#f97316',
  churned: '#ef476f',
};

function abbreviateName(fullName: string): string {
  const parts = (fullName || '').trim().split(' ');
  if (parts.length < 2) return parts[0] ?? '?';
  return `${parts[0]} ${parts[parts.length - 1][0]}.`;
}

function VipScatter({ scatterData: rawData, onStatusClick }: {
  scatterData: Array<{ customer_id: string; name: string; total_bookings: number; lifetime_spend: number; days_since_last: number | null; status: string }>;
  onStatusClick: (s: 'all' | 'active' | 'at_risk' | 'churned') => void;
}) {
  const scatterData = useMemo(() => {
    return rawData.map((c) => ({
      x: c.total_bookings,
      y: c.lifetime_spend ?? 0,
      z: Math.max(60, 300 - (c.days_since_last ?? 999) * 3),
      name: abbreviateName(c.name),
      fullName: c.name,
      status: c.status,
      days: c.days_since_last ?? 0,
      fill: SCATTER_COLORS[c.status] ?? '#6b7280',
    }));
  }, [rawData]);

  const ScatterTooltipContent = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    const statusLabels: Record<string, string> = { active: '🟢 Active', medium_risk: '🟡 Medium Risk', high_risk: '🟠 High Risk', churned: '🔴 Churned' };
    const statusLabel = statusLabels[d.status] ?? d.status;
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

  // Split by status for different colored scatter series
  const activeData = useMemo(() => scatterData.filter((d) => d.status === 'active'), [scatterData]);
  const mediumRiskData = useMemo(() => scatterData.filter((d) => d.status === 'medium_risk'), [scatterData]);
  const highRiskData = useMemo(() => scatterData.filter((d) => d.status === 'high_risk'), [scatterData]);
  const churnedData = useMemo(() => scatterData.filter((d) => d.status === 'churned'), [scatterData]);

  const scatterInsight = useMemo(() => {
    if (!rawData.length) return 'No customer value data available yet';
    const total = rawData.length;
    const vips = rawData.filter((c) => c.total_bookings >= 5 && c.lifetime_spend >= 500);
    if (vips.length > 0) {
      const vipRevenue = vips.reduce((s, c) => s + c.lifetime_spend, 0);
      return `You have ${vips.length} VIP customers driving ${formatShort(vipRevenue)} in revenue`;
    }
    const oneTimers = rawData.filter((c) => c.total_bookings === 1);
    if (oneTimers.length > 0) {
      const pct = Math.round((oneTimers.length / total) * 100);
      return `${oneTimers.length} customers only visited once — ${pct}% of your base`;
    }
    const atRiskHighSpenders = rawData.filter((c) => c.status === 'at_risk' && c.lifetime_spend >= 500);
    if (atRiskHighSpenders.length > 0) {
      return `\u26A0\uFE0F ${atRiskHighSpenders.length} high-value customers ($500+) are at risk of churning`;
    }
    return `${total} customers mapped — segment by visits and spend to find growth opportunities`;
  }, [rawData]);

  return (
    <ChartCard title="Customer Value Map">
      <div className="h-56 relative">
        {/* Legend */}
        <div className="absolute top-0 right-0 flex gap-3 text-[9px] font-semibold z-10" style={{ color: 'var(--text-primary)' }}>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: SCATTER_COLORS.active }} />Active ({activeData.length})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: SCATTER_COLORS.medium_risk }} />Med ({mediumRiskData.length})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: SCATTER_COLORS.high_risk }} />High ({highRiskData.length})</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ background: SCATTER_COLORS.churned }} />Churned ({churnedData.length})</span>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 12, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="2 4" stroke="var(--separator)" opacity={0.12} />
            <XAxis
              type="number"
              dataKey="x"
              name="Visits"
              tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--separator)', strokeWidth: 0.5 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Spend"
              tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--separator)', strokeWidth: 0.5 }}
              tickFormatter={formatShort}
              width={45}
            />
            <ZAxis type="number" dataKey="z" range={[60, 300]} />
            <Tooltip content={<ScatterTooltipContent />} />
            <Scatter
              name="Active"
              data={activeData}
              fill={SCATTER_COLORS.active}
              fillOpacity={0.8}
              strokeWidth={1.5}
              stroke="rgba(255,255,255,0.4)"
              onClick={(point) => point?.status && onStatusClick(point.status as any)}
              cursor="pointer"
            />
            <Scatter
              name="Medium Risk"
              data={mediumRiskData}
              fill={SCATTER_COLORS.medium_risk}
              fillOpacity={0.8}
              strokeWidth={1.5}
              stroke="rgba(255,255,255,0.4)"
              onClick={(point) => point?.status && onStatusClick(point.status as any)}
              cursor="pointer"
            />
            <Scatter
              name="High Risk"
              data={highRiskData}
              fill={SCATTER_COLORS.high_risk}
              fillOpacity={0.8}
              strokeWidth={1.5}
              stroke="rgba(255,255,255,0.4)"
              onClick={(point) => point?.status && onStatusClick(point.status as any)}
              cursor="pointer"
            />
            <Scatter
              name="Churned"
              data={churnedData}
              fill={SCATTER_COLORS.churned}
              fillOpacity={0.8}
              strokeWidth={1.5}
              stroke="rgba(255,255,255,0.4)"
              onClick={(point) => point?.status && onStatusClick(point.status as any)}
              cursor="pointer"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <InsightBar text={scatterInsight} />
    </ChartCard>
  );
}

function useCouponInsight(data: AnalyticsData['coupon_impact']): string {
  return useMemo(() => {
    if (!data.length) return 'No coupon data available from ShiftOS. Connect voucher tracking for promo analytics';
    const sorted = [...data].sort((a, b) => b.repeat_rate - a.repeat_rate);
    const top = sorted[0];
    const totalUses = top.first_time + top.repeat;
    return `Top coupon: ${top.code} with ${Math.round(top.repeat_rate)}% repeat rate — ${totalUses} total uses`;
  }, [data]);
}

function CouponImpactChart({ data }: { data: AnalyticsData['coupon_impact'] }) {
  const chartData = useMemo(() => data.slice(0, 8), [data]);
  const insight = useCouponInsight(data);

  return (
    <ChartCard title="Coupon Impact">
      <div className="h-28">
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
      <InsightBar text={insight} />
    </ChartCard>
  );
}

function formatPnlShort(n: number): string {
  const abs = Math.abs(n);
  const formatted = abs >= 1000 ? `$${(abs / 1000).toFixed(1)}k` : `$${abs.toFixed(0)}`;
  return n < 0 ? `-${formatted}` : formatted;
}

function PnlMiniCard({ value, label, color, pct }: {
  value: number;
  label: string;
  color: string;
  pct: number;
}) {
  return (
    <div className="group relative flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 transition-colors" style={{ background: 'var(--fill-quaternary)' }}>
      <span
        className="text-base font-bold tabular-nums leading-tight"
        style={{ color }}
        title={`$${Math.abs(value).toLocaleString()}`}
      >
        {formatPnlShort(value)}
      </span>
      <span className="text-[8px] font-semibold uppercase tracking-wider text-center leading-tight" style={{ color: 'var(--text-tertiary)' }}>
        {label}
      </span>
      {pct > 0 && (
        <span className="text-[8px] font-medium tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
          {n(pct).toFixed(1)}%
        </span>
      )}
      <div className="w-full h-1 rounded-full mt-0.5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function PnlFlowArrow() {
  return (
    <div className="flex items-center justify-center self-center" style={{ color: 'var(--text-tertiary)' }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function PnlDetailRow({ label, value, color }: { label: string; value: number; color?: string }) {
  const displayVal = value < 0 ? `-$${Math.abs(value).toLocaleString()}` : `$${value.toLocaleString()}`;
  return (
    <div className="flex justify-between items-baseline">
      <span className="text-[10px] font-medium" style={{ color: color ?? 'var(--text-secondary)' }}>{label}</span>
      <span className="text-[11px] font-semibold tabular-nums" style={{ color: color ?? 'var(--text-primary)' }}>{displayVal}</span>
    </div>
  );
}

function PnlCard({ analytics }: { analytics: AnalyticsData | null }) {
  const pnl = analytics?.pnl;
  const [detailsOpen, setDetailsOpen] = useState(false);

  if (!pnl) return null;

  const gross = pnl.gross_revenue;
  const merchantPct = gross > 0 ? (Math.abs(pnl.total_merchant_fees) / gross) * 100 : 0;
  const franchisePct = gross > 0 ? (Math.abs(pnl.total_franchise_fees) / gross) * 100 : 0;
  const netPct = gross > 0 ? (pnl.net_profit / gross) * 100 : 0;

  // Stacked bar segments (as percentages of gross)
  const barSegments = [
    { label: 'Net Profit', pct: netPct, color: '#06d6a0' },
    { label: 'Merchant Fees', pct: merchantPct, color: '#ef476f' },
    { label: 'Franchise Fees', pct: franchisePct, color: '#f97316' },
  ];

  return (
    <ChartCard title="Profit & Loss">
      {/* Mini cards flow */}
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] items-stretch gap-1">
        <PnlMiniCard value={gross} label="Gross Revenue" color="var(--text-primary)" pct={100} />
        <PnlFlowArrow />
        <PnlMiniCard value={-Math.abs(pnl.total_merchant_fees)} label="Merchant Fees" color="#ef476f" pct={merchantPct} />
        <PnlFlowArrow />
        <PnlMiniCard value={-Math.abs(pnl.total_franchise_fees)} label="Franchise Fees" color="#f97316" pct={franchisePct} />
        <PnlFlowArrow />
        <PnlMiniCard value={pnl.net_profit} label="Net Profit" color="#06d6a0" pct={netPct} />
      </div>

      {/* Stacked breakdown bar */}
      <div className="mt-3 space-y-1.5">
        <div className="flex w-full h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          {barSegments.map((seg) => (
            <div
              key={seg.label}
              className="h-full first:rounded-l-full last:rounded-r-full transition-all"
              style={{ width: `${seg.pct}%`, background: seg.color }}
              title={`${seg.label}: ${n(seg.pct).toFixed(1)}%`}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {barSegments.map((seg) => (
            <div key={seg.label} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: seg.color }} />
              <span className="text-[8px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
                {seg.label} ({n(seg.pct).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Expandable details */}
      <button
        type="button"
        onClick={() => setDetailsOpen((prev) => !prev)}
        className="mt-2 flex items-center gap-1 text-[10px] font-semibold transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <span>Details</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          className={`transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
        >
          <path d="M2.5 3.75L5 6.25L7.5 3.75" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {detailsOpen && (
        <div className="mt-1.5 space-y-1 rounded-lg px-2.5 py-2" style={{ background: 'var(--fill-quaternary)' }}>
          <p className="text-[8px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Revenue Sources</p>
          <PnlDetailRow label="ShiftOS (Stripe)" value={pnl.shiftos_revenue} color="#818cf8" />
          <PnlDetailRow label="Square (iPad)" value={pnl.square_revenue} color="#06d6a0" />
          <div className="h-px my-1" style={{ background: 'var(--separator)' }} />
          <p className="text-[8px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Merchant Fees</p>
          <PnlDetailRow label="Stripe Fees (2.9%+30¢)" value={-Math.abs(pnl.stripe_fees)} color="#ef476f" />
          <PnlDetailRow label="Square Fees (2.6%+10¢)" value={-Math.abs(pnl.square_fees)} color="#ef476f" />
          <div className="h-px my-1" style={{ background: 'var(--separator)' }} />
          <p className="text-[8px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Franchise Fees</p>
          <PnlDetailRow label="Royalty (7%)" value={-Math.abs(pnl.franchise_royalty)} color="#f97316" />
          <PnlDetailRow label="Marketing (1%)" value={-Math.abs(pnl.franchise_marketing)} color="#f97316" />
        </div>
      )}

      <InsightBar text={`You keep ${pnl.margin_pct}% of every dollar earned`} />
    </ChartCard>
  );
}

function RevenueBreakdown({ analytics }: { analytics: AnalyticsData | null }) {
  const fees = analytics?.merchant_fees;
  const lifetime = analytics?.revenue_lifetime ?? 0;

  const chartData = useMemo(() => {
    if (!fees || lifetime <= 0) return [];
    const shiftosRev = fees.net_revenue * 0.6; // approximate split from CSV
    const squareRev = fees.net_revenue * 0.4;
    return [
      { name: 'ShiftOS (Stripe)', value: Math.round(lifetime * 0.598), color: '#818cf8' },
      { name: 'Square (iPad)', value: Math.round(lifetime * 0.402), color: '#06d6a0' },
    ];
  }, [fees, lifetime]);

  if (!fees) return null;

  return (
    <ChartCard title="Revenue Breakdown">
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius="50%" outerRadius="85%" paddingAngle={3} dataKey="value">
                {chartData.map((e) => <Cell key={e.name} fill={e.color} stroke="none" />)}
              </Pie>
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2.5">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>Total Revenue</span>
            <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>${lifetime.toLocaleString()}</span>
          </div>
          <div className="h-px" style={{ background: 'var(--separator)' }} />
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#818cf8' }} />
              <span style={{ color: 'var(--text-secondary)' }}>ShiftOS (Stripe)</span>
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: '#818cf8' }}>${Math.round(lifetime * 0.598).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#06d6a0' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Square (iPad POS)</span>
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: '#06d6a0' }}>${Math.round(lifetime * 0.402).toLocaleString()}</span>
          </div>
        </div>
      </div>
      <InsightBar text="60% of revenue comes through online Stripe bookings, 40% from in-store Square iPad payments." />
    </ChartCard>
  );
}

function FeesChart({ analytics }: { analytics: AnalyticsData | null }) {
  const fees = analytics?.merchant_fees;
  const lifetime = analytics?.revenue_lifetime ?? 0;

  const chartData = useMemo(() => {
    if (!fees) return [];
    return [
      { name: 'Stripe', value: fees.stripe, color: '#ef476f' },
      { name: 'Square', value: fees.square, color: '#ffd166' },
    ];
  }, [fees]);

  if (!fees) return null;

  return (
    <ChartCard title="Merchant Fees">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius="45%" outerRadius="85%" paddingAngle={3} dataKey="value">
                {chartData.map((e) => <Cell key={e.name} fill={e.color} stroke="none" />)}
              </Pie>
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#ef476f' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Stripe (2.9% + 30¢)</span>
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: '#ef476f' }}>-${n(fees.stripe).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#ffd166' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Square (2.6% + 10¢)</span>
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: '#ffd166' }}>-${n(fees.square).toLocaleString()}</span>
          </div>
          <div className="h-px" style={{ background: 'var(--separator)' }} />
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>Total Fees</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>${n(fees.total).toLocaleString()} ({lifetime > 0 ? ((fees.total / lifetime) * 100).toFixed(1) : 0}%)</span>
          </div>
        </div>
      </div>
      <InsightBar text={`Processing fees are ${lifetime > 0 ? ((fees.total / lifetime) * 100).toFixed(1) : 0}% of gross revenue.`} />
    </ChartCard>
  );
}

function FranchiseFeesChart({ analytics }: { analytics: AnalyticsData | null }) {
  const franchise = analytics?.franchise_fees;
  const lifetime = analytics?.revenue_lifetime ?? 0;

  const chartData = useMemo(() => {
    if (!franchise) return [];
    return [
      { name: 'Royalty (7%)', value: franchise.royalty, color: '#f97316' },
      { name: 'Marketing (1%)', value: franchise.marketing, color: '#fb923c' },
    ];
  }, [franchise]);

  if (!franchise) return null;

  return (
    <ChartCard title="Franchise Fees">
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius="45%" outerRadius="85%" paddingAngle={3} dataKey="value">
                {chartData.map((e) => <Cell key={e.name} fill={e.color} stroke="none" />)}
              </Pie>
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11, color: '#fff' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#f97316' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Royalty (7%)</span>
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: '#f97316' }}>-${n(franchise.royalty).toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: '#fb923c' }} />
              <span style={{ color: 'var(--text-secondary)' }}>Marketing (1%)</span>
            </span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: '#fb923c' }}>-${n(franchise.marketing).toLocaleString()}</span>
          </div>
          <div className="h-px" style={{ background: 'var(--separator)' }} />
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>Total Franchise</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: '#f97316' }}>${n(franchise.total).toLocaleString()} ({lifetime > 0 ? ((franchise.total / lifetime) * 100).toFixed(0) : 0}%)</span>
          </div>
        </div>
      </div>
      <InsightBar text="Franchise fees are 8% of gross revenue — 7% royalty + 1% marketing fund." />
    </ChartCard>
  );
}

const ATTRIBUTION_COLORS: Record<string, string> = {
  meta_ad: '#0A84FF',
  google_ad: '#34A853',
  direct: '#8B5CF6',
  unknown: '#6B7280',
};

function AcquisitionSourcesChart({ attribution }: { attribution: Record<string, number> }) {
  const chartData = useMemo(() => {
    const entries = Object.entries(attribution);
    if (entries.length === 0) return [];
    return entries.map(([source, count]) => ({
      name: source.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value: count,
      color: ATTRIBUTION_COLORS[source] ?? '#6B7280',
    }));
  }, [attribution]);

  const total = useMemo(() => chartData.reduce((s, d) => s + d.value, 0), [chartData]);

  if (chartData.length === 0) return null;

  return (
    <ChartCard title="Acquisition Sources">
      <div className="flex items-center gap-4">
        <div className="w-28 h-28 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="50%"
                outerRadius="85%"
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((e) => (
                  <Cell key={e.name} fill={e.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => `${v} customers`}
                contentStyle={{
                  background: '#1a1a2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 11,
                  color: '#fff',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex justify-between items-baseline">
              <span className="text-[10px] font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
                <span style={{ color: 'var(--text-secondary)' }}>{entry.name}</span>
              </span>
              <span className="text-xs font-semibold tabular-nums" style={{ color: entry.color }}>
                {entry.value} ({total > 0 ? Math.round((entry.value / total) * 100) : 0}%)
              </span>
            </div>
          ))}
          <div className="h-px" style={{ background: 'var(--separator)' }} />
          <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>Total Attributed</span>
            <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{total}</span>
          </div>
        </div>
      </div>
      <InsightBar
        text={
          chartData.length > 0
            ? `Top source: ${chartData.sort((a, b) => b.value - a.value)[0].name} with ${Math.round((chartData[0].value / total) * 100)}% of attributed customers`
            : 'No attribution data available yet'
        }
      />
    </ChartCard>
  );
}

/* ── Section 13: Reviews / Reputation ──────────────────────────── */

function StarRow({ rating, max = 5 }: { rating: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => {
        const filled = rating >= i + 1;
        const half = !filled && rating >= i + 0.5;
        return (
          <svg key={i} width="14" height="14" viewBox="0 0 20 20">
            <path
              d="M10 1.5l2.47 5.01 5.53.8-4 3.9.94 5.49L10 14.27 5.06 16.7 6 11.21l-4-3.9 5.53-.8z"
              fill={filled ? '#fbbf24' : half ? 'url(#halfStar)' : 'rgba(255,255,255,0.1)'}
              stroke={filled || half ? '#fbbf24' : 'rgba(255,255,255,0.15)'}
              strokeWidth="0.5"
            />
            {half && (
              <defs>
                <linearGradient id="halfStar">
                  <stop offset="50%" stopColor="#fbbf24" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
                </linearGradient>
              </defs>
            )}
          </svg>
        );
      })}
    </div>
  );
}

function ReviewsCard({ data }: { data: ReviewsData | null | undefined }) {
  if (!data) {
    return (
      <ChartCard title="Reputation">
        <div className="h-40 flex items-center justify-center">
          <p className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Connecting...</p>
        </div>
      </ChartCard>
    );
  }

  const delta = data.historical_avg > 0
    ? +(n(data.overall_rating) - n(data.historical_avg)).toFixed(2)
    : 0;

  return (
    <ChartCard title="Reputation">
      {/* Overall rating */}
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl font-black tabular-nums leading-none" style={{ color: 'var(--text-primary)' }}>
          {n(data.overall_rating).toFixed(1)}
        </span>
        <div className="flex flex-col gap-0.5">
          <StarRow rating={data.overall_rating} />
          <span className="text-[10px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
            {(data.total_reviews ?? 0).toLocaleString()} reviews
            {delta !== 0 && (
              <span style={{ color: delta > 0 ? '#22c55e' : '#ef4444', marginLeft: 6 }}>
                {delta > 0 ? '+' : ''}{n(delta).toFixed(2)} vs avg
              </span>
            )}
          </span>
        </div>
      </div>

      {/* Per-platform */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="rounded-lg px-2.5 py-2" style={{ background: 'var(--fill-quaternary)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: '#4285F4' }} />
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Google</span>
          </div>
          <span className="text-sm font-bold tabular-nums" style={{ color: '#4285F4' }}>
            {n(data.platforms?.google?.rating).toFixed(1)}
          </span>
          <span className="text-[10px] ml-1" style={{ color: 'var(--text-tertiary)' }}>
            ({data.platforms.google.count})
          </span>
        </div>
        <div className="rounded-lg px-2.5 py-2" style={{ background: 'var(--fill-quaternary)' }}>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-2 h-2 rounded-full" style={{ background: '#FF1A1A' }} />
            <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Yelp</span>
          </div>
          <span className="text-sm font-bold tabular-nums" style={{ color: '#FF1A1A' }}>
            {n(data.platforms?.yelp?.rating).toFixed(1)}
          </span>
          <span className="text-[10px] ml-1" style={{ color: 'var(--text-tertiary)' }}>
            ({data.platforms.yelp.count})
          </span>
        </div>
      </div>

      {/* Recent reviews */}
      {data.recent.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Recent</p>
          {data.recent.slice(0, 3).map((review, i) => (
            <div key={i} className="rounded-lg px-2.5 py-1.5" style={{ background: 'var(--fill-quaternary)' }}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] font-semibold" style={{ color: 'var(--text-primary)' }}>{review.author}</span>
                <div className="flex items-center gap-1">
                  <StarRow rating={review.rating} />
                  <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>{review.date}</span>
                </div>
              </div>
              <p className="text-[10px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                {review.text.length > 120 ? `${review.text.slice(0, 120)}...` : review.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </ChartCard>
  );
}

/* ── Section 14: Organic Search ───────────────────────────────── */

function OrganicSearchCard({ data }: { data: OrganicData | null | undefined }) {
  if (!data) {
    return (
      <ChartCard title="Organic Search">
        <div className="h-40 flex items-center justify-center">
          <p className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>Connecting...</p>
        </div>
      </ChartCard>
    );
  }

  const dailyData = data.daily ?? [];
  const topQueries = (data.top_queries ?? []).slice(0, 5);

  return (
    <ChartCard title="Organic Search">
      {/* KPI row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {[
          { label: 'Clicks', value: (data.clicks ?? 0).toLocaleString(), color: '#34A853' },
          { label: 'Impressions', value: (data.impressions ?? 0).toLocaleString(), color: 'var(--text-primary)' },
          { label: 'Avg CTR', value: `${(data.ctr ?? 0).toFixed(1)}%`, color: '#34A853' },
          { label: 'Avg Position', value: (data.position ?? 0).toFixed(1), color: 'var(--text-primary)' },
        ].map((kpi) => (
          <div key={kpi.label} className="flex flex-col items-center rounded-lg py-1.5" style={{ background: 'var(--fill-quaternary)' }}>
            <span className="text-sm font-bold tabular-nums" style={{ color: kpi.color }}>{kpi.value}</span>
            <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{kpi.label}</span>
          </div>
        ))}
      </div>

      {/* Daily clicks mini chart */}
      {dailyData.length > 0 && (
        <div className="h-28 -mx-1 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="organicGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34A853" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#34A853" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" opacity={0.2} />
              <XAxis
                dataKey="date"
                tick={{ fill: 'var(--text-secondary)', fontSize: 8 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fill: 'var(--text-secondary)', fontSize: 9 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="#34A853"
                fill="url(#organicGrad)"
                strokeWidth={1.5}
                name="Clicks"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top queries table */}
      {topQueries.length > 0 && (
        <div>
          <p className="text-[8px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-tertiary)' }}>Top Queries</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr style={{ color: 'var(--text-tertiary)' }}>
                  <th className="text-left font-semibold pb-1">Query</th>
                  <th className="text-right font-semibold pb-1">Clicks</th>
                  <th className="text-right font-semibold pb-1">Impr</th>
                  <th className="text-right font-semibold pb-1">CTR</th>
                  <th className="text-right font-semibold pb-1">Pos</th>
                </tr>
              </thead>
              <tbody>
                {topQueries.map((q, i) => (
                  <tr key={i} className="border-t" style={{ borderColor: 'var(--separator)' }}>
                    <td className="py-1 font-medium" style={{ color: 'var(--text-primary)' }}>
                      {q.query.length > 35 ? `${q.query.slice(0, 35)}...` : q.query}
                    </td>
                    <td className="text-right tabular-nums" style={{ color: '#34A853' }}>{q.clicks}</td>
                    <td className="text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>{n(q.impressions).toLocaleString()}</td>
                    <td className="text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>{n(q.ctr).toFixed(1)}%</td>
                    <td className="text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>{n(q.position).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </ChartCard>
  );
}

/* ── Section 15: Creative Performance ─────────────────────────── */

const CREATIVE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  PAUSED: '#fbbf24',
};

function CreativePerformanceCard({ data }: { data: CreativesData | null | undefined }) {
  if (!data) {
    return (
      <ChartCard title="Ad Creatives">
        <div className="h-40 flex items-center justify-center">
          <p className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>No data yet</p>
        </div>
      </ChartCard>
    );
  }

  const creatives = useMemo(() => {
    const sorted = [...(data.creatives ?? [])].sort((a, b) => b.spend - a.spend);
    return sorted.slice(0, 10);
  }, [data.creatives]);

  const hasRoas = creatives.some((c) => c.roas !== undefined && c.roas !== null);

  if (creatives.length === 0) {
    return (
      <ChartCard title="Ad Creatives">
        <div className="h-40 flex items-center justify-center">
          <p className="text-[11px] font-medium" style={{ color: 'var(--text-tertiary)' }}>No creatives found</p>
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title="Ad Creatives">
      <div className="overflow-x-auto">
        <table className="w-full text-[10px]">
          <thead>
            <tr style={{ color: 'var(--text-tertiary)' }}>
              <th className="text-left font-semibold pb-1.5">Name</th>
              <th className="text-center font-semibold pb-1.5">Status</th>
              <th className="text-right font-semibold pb-1.5">Spend</th>
              <th className="text-right font-semibold pb-1.5">Impr</th>
              <th className="text-right font-semibold pb-1.5">Clicks</th>
              <th className="text-right font-semibold pb-1.5">CTR</th>
              <th className="text-right font-semibold pb-1.5">CPC</th>
              <th className="text-right font-semibold pb-1.5">Conv</th>
              {hasRoas && <th className="text-right font-semibold pb-1.5">ROAS</th>}
            </tr>
          </thead>
          <tbody>
            {creatives.map((c, i) => {
              const statusColor = CREATIVE_STATUS_COLORS[c.status?.toUpperCase()] ?? '#6B7280';
              return (
                <tr key={i} className="border-t" style={{ borderColor: 'var(--separator)' }}>
                  <td className="py-1.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {c.name.length > 40 ? `${c.name.slice(0, 40)}...` : c.name}
                  </td>
                  <td className="text-center">
                    <span
                      className="inline-block px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase"
                      style={{ background: `${statusColor}20`, color: statusColor }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="text-right tabular-nums" style={{ color: 'var(--text-primary)' }}>${(c.spend ?? 0).toLocaleString()}</td>
                  <td className="text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>{(c.impressions ?? 0).toLocaleString()}</td>
                  <td className="text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>{(c.clicks ?? 0).toLocaleString()}</td>
                  <td className="text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>{n(c.ctr).toFixed(2)}%</td>
                  <td className="text-right tabular-nums" style={{ color: 'var(--text-secondary)' }}>${n(c.cpc).toFixed(2)}</td>
                  <td className="text-right tabular-nums" style={{ color: 'var(--text-primary)' }}>{c.conversions}</td>
                  {hasRoas && (
                    <td className="text-right tabular-nums font-semibold" style={{ color: (c.roas ?? 0) >= 1 ? '#22c55e' : '#ef4444' }}>
                      {c.roas !== undefined && c.roas !== null ? `${n(c.roas).toFixed(2)}x` : '—'}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}

function formatCohortMonth(ym: string): string {
  const [y, m] = ym.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[parseInt(m, 10) - 1]} ${y}`;
}

function getCohortHeatmapColor(value: number, maxValue: number): string {
  if (value === 0 || maxValue === 0) return 'transparent';
  const intensity = Math.min(value / maxValue, 1);
  // Map to 0.1 – 0.9 opacity range
  const opacity = 0.1 + intensity * 0.8;
  return `rgba(34, 197, 94, ${opacity.toFixed(2)})`;
}

function getRetentionColor(pct: number): string {
  if (pct === 0) return 'transparent';
  const intensity = Math.min(pct / 100, 1);
  const opacity = 0.1 + intensity * 0.8;
  return `rgba(34, 197, 94, ${opacity.toFixed(2)})`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CohortAnalysisSection({ data }: { data: any }) {
  if (!data) {
    return (
      <ChartCard title="Cohort Analysis">
        <div className="flex items-center justify-center h-32">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Loading cohort data...</p>
        </div>
      </ChartCard>
    );
  }

  const { cohorts, months } = data as {
    cohorts: Array<{
      cohort: string;
      customer_count: number;
      total_revenue: number;
      avg_revenue_per_customer: number;
      monthly: Record<string, { revenue: number; bookings: number; active_customers: number }>;
      retention: Record<string, number>;
    }>;
    months: string[];
  };

  if (!cohorts?.length || !months?.length) {
    return (
      <ChartCard title="Cohort Analysis">
        <div className="flex items-center justify-center h-32">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>No cohort data available</p>
        </div>
      </ChartCard>
    );
  }

  // Calculate max revenue for heatmap color scaling
  let maxRevenue = 0;
  for (const c of cohorts) {
    for (const m of months) {
      const rev = c.monthly[m]?.revenue ?? 0;
      if (rev > maxRevenue) maxRevenue = rev;
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Revenue Heatmap */}
      <ChartCard title="Cohort Analysis — Revenue Heatmap">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[9px]" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th
                  className="sticky left-0 text-left px-2 py-1.5 font-semibold"
                  style={{ color: 'var(--text-secondary)', background: 'var(--glass-bg)' }}
                >
                  Cohort
                </th>
                <th
                  className="text-center px-2 py-1.5 font-semibold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Size
                </th>
                {months.map((m) => (
                  <th
                    key={m}
                    className="text-center px-2 py-1.5 font-semibold whitespace-nowrap"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {formatCohortMonth(m)}
                  </th>
                ))}
                <th
                  className="text-center px-2 py-1.5 font-semibold"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  LTV/Cust
                </th>
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.cohort} className="border-t" style={{ borderColor: 'var(--separator)' }}>
                  <td
                    className="sticky left-0 px-2 py-1.5 font-semibold whitespace-nowrap"
                    style={{ color: 'var(--text-primary)', background: 'var(--glass-bg)' }}
                  >
                    {formatCohortMonth(c.cohort)}
                  </td>
                  <td
                    className="text-center px-2 py-1.5 tabular-nums"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {c.customer_count}
                  </td>
                  {months.map((m) => {
                    const rev = c.monthly[m]?.revenue ?? 0;
                    return (
                      <td
                        key={m}
                        className="text-center px-2 py-1.5 tabular-nums rounded-sm"
                        style={{
                          background: getCohortHeatmapColor(rev, maxRevenue),
                          color: rev > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        }}
                      >
                        {rev > 0 ? `$${Math.round(rev).toLocaleString()}` : '—'}
                      </td>
                    );
                  })}
                  <td
                    className="text-center px-2 py-1.5 tabular-nums font-semibold"
                    style={{ color: '#22c55e' }}
                  >
                    ${Math.round(c.avg_revenue_per_customer).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>

      {/* Retention Heatmap */}
      <ChartCard title="Cohort Retention (% Active Customers)">
        <div className="overflow-x-auto -mx-1">
          <table className="w-full text-[9px]" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
            <thead>
              <tr>
                <th
                  className="sticky left-0 text-left px-2 py-1.5 font-semibold"
                  style={{ color: 'var(--text-secondary)', background: 'var(--glass-bg)' }}
                >
                  Cohort
                </th>
                {months.map((m) => (
                  <th
                    key={m}
                    className="text-center px-2 py-1.5 font-semibold whitespace-nowrap"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {formatCohortMonth(m)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohorts.map((c) => (
                <tr key={c.cohort} className="border-t" style={{ borderColor: 'var(--separator)' }}>
                  <td
                    className="sticky left-0 px-2 py-1.5 font-semibold whitespace-nowrap"
                    style={{ color: 'var(--text-primary)', background: 'var(--glass-bg)' }}
                  >
                    {formatCohortMonth(c.cohort)}
                  </td>
                  {months.map((m) => {
                    const pct = c.retention[m] ?? 0;
                    return (
                      <td
                        key={m}
                        className="text-center px-2 py-1.5 tabular-nums rounded-sm"
                        style={{
                          background: getRetentionColor(pct),
                          color: pct > 0 ? 'var(--text-primary)' : 'var(--text-tertiary)',
                        }}
                      >
                        {pct > 0 ? `${pct}%` : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </div>
  );
}

// ── Revenue Forecast Section ──────────────────────────

const FORECAST_LINE_COLOR = '#8B5CF6';
const FORECAST_BAND_COLOR = 'rgba(139, 92, 246, 0.15)';

function RevenueForecastSection({ data }: { data: any }) {
  if (!data) {
    return (
      <ChartCard title="Revenue Forecast">
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Loading revenue forecast...</p>
      </ChartCard>
    );
  }

  const { daily, summary, basis } = data;
  if (!daily || !summary) return null;

  const trendColor = summary.trend === 'growing' ? '#22c55e' : summary.trend === 'declining' ? '#ef4444' : '#9ca3af';
  const trendLabel = summary.trend === 'growing'
    ? `Growing +${summary.trend_pct}%`
    : summary.trend === 'declining'
    ? `Declining ${summary.trend_pct}%`
    : 'Stable';

  // Format chart data
  const chartData = (daily ?? []).map((d: any) => ({
    date: d.date?.substring(5) ?? '', // MM-DD
    predicted: d.predicted_revenue ?? 0,
    low: d.confidence_low ?? 0,
    high: d.confidence_high ?? 0,
    isWeekend: d.is_weekend ?? false,
  }));

  return (
    <ChartCard
      title="Revenue Forecast"
      trailing={
        <div className="flex items-center gap-2">
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${trendColor}22`, color: trendColor }}
          >
            {trendLabel}
          </span>
          <span className="text-[9px]" style={{ color: 'var(--text-tertiary)' }}>
            Based on {basis?.days_of_history ?? 0} days
          </span>
        </div>
      }
    >
      {/* Big number */}
      <div className="flex items-baseline gap-3 mb-3">
        <span className="text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
          ${(summary.projected_30d_revenue ?? 0).toLocaleString()}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
          projected 30d &middot; range ${(summary.confidence_low ?? 0).toLocaleString()} — ${(summary.confidence_high ?? 0).toLocaleString()}
        </span>
      </div>

      {/* Area chart */}
      <div className="w-full" style={{ height: 220 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={FORECAST_LINE_COLOR} stopOpacity={0.2} />
                <stop offset="100%" stopColor={FORECAST_LINE_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" strokeOpacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              interval={4}
            />
            <YAxis
              tick={{ fill: 'var(--text-tertiary)', fontSize: 9 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v}`}
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 8,
                fontSize: 11,
                color: 'var(--text-primary)',
              }}
              formatter={(value: number, name: string) => [
                `$${value.toLocaleString()}`,
                name === 'predicted' ? 'Forecast' : name === 'high' ? 'High' : 'Low',
              ]}
              labelFormatter={(label: string) => `Date: ${label}`}
            />
            {/* Confidence band — draw as two areas */}
            <Area
              type="monotone"
              dataKey="high"
              stroke="none"
              fill={FORECAST_BAND_COLOR}
              fillOpacity={1}
            />
            <Area
              type="monotone"
              dataKey="low"
              stroke="none"
              fill="var(--glass-bg)"
              fillOpacity={1}
            />
            {/* Main prediction line */}
            <Area
              type="monotone"
              dataKey="predicted"
              stroke={FORECAST_LINE_COLOR}
              strokeWidth={2}
              fill="url(#forecastBand)"
              fillOpacity={1}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2 mt-3">
        <div className="text-center">
          <p className="text-[9px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Avg Daily</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            ${(summary.avg_daily_projected ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Best Day</p>
          <p className="text-sm font-bold" style={{ color: '#22c55e' }}>
            {summary.best_day ?? '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Worst Day</p>
          <p className="text-sm font-bold" style={{ color: '#ef4444' }}>
            {summary.worst_day ?? '—'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[9px] uppercase" style={{ color: 'var(--text-tertiary)' }}>Wknd/Wkday</p>
          <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {summary.weekend_vs_weekday_ratio ?? '—'}x
          </p>
        </div>
      </div>
    </ChartCard>
  );
}

// ── Churn Prediction Section ─────────────────────────

const CHURN_COLORS: Record<string, string> = {
  safe: '#22c55e',
  watch: '#fbbf24',
  at_risk: '#f97316',
  critical: '#ef4444',
};

const URGENCY_COLORS: Record<string, string> = {
  low: '#9ca3af',
  medium: '#fbbf24',
  high: '#f97316',
  urgent: '#ef4444',
};

function ChurnPredictionSection({ data }: { data: any }) {
  if (!data) {
    return (
      <ChartCard title="Churn Prediction">
        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Loading churn predictions...</p>
      </ChartCard>
    );
  }

  const { customers, summary } = data;
  if (!summary) return null;

  const totalCustomers = (summary.safe ?? 0) + (summary.watch ?? 0) + (summary.at_risk ?? 0) + (summary.critical ?? 0);
  const top10 = (customers ?? []).slice(0, 10);

  // Summary bar widths
  const pct = (n: number) => totalCustomers > 0 ? (n / totalCustomers) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <ChartCard title="Churn Prediction">
        {/* Summary bar */}
        <div className="flex flex-col gap-2 mb-4">
          <div className="flex items-center gap-1.5">
            {([
              { key: 'safe', label: 'Safe', count: summary.safe ?? 0 },
              { key: 'watch', label: 'Watch', count: summary.watch ?? 0 },
              { key: 'at_risk', label: 'At Risk', count: summary.at_risk ?? 0 },
              { key: 'critical', label: 'Critical', count: summary.critical ?? 0 },
            ] as const).map(({ key, label, count }) => (
              <div key={key} className="flex items-center gap-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: CHURN_COLORS[key] }}
                />
                <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                  {label}
                </span>
                <span className="text-[10px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {count}
                </span>
              </div>
            ))}
          </div>

          {/* Stacked bar */}
          <div className="flex w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--fill-quaternary)' }}>
            {pct(summary.safe) > 0 && (
              <div style={{ width: `${pct(summary.safe)}%`, background: CHURN_COLORS.safe }} />
            )}
            {pct(summary.watch) > 0 && (
              <div style={{ width: `${pct(summary.watch)}%`, background: CHURN_COLORS.watch }} />
            )}
            {pct(summary.at_risk) > 0 && (
              <div style={{ width: `${pct(summary.at_risk)}%`, background: CHURN_COLORS.at_risk }} />
            )}
            {pct(summary.critical) > 0 && (
              <div style={{ width: `${pct(summary.critical)}%`, background: CHURN_COLORS.critical }} />
            )}
          </div>

          {/* Revenue at risk */}
          <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
            <span className="font-bold" style={{ color: '#ef4444' }}>
              ${(summary.total_at_risk_revenue ?? 0).toLocaleString()}
            </span>
            {' '}in lifetime value at risk of churning
          </p>
        </div>

        {/* Top 10 highest-risk customers table */}
        {top10.length > 0 && (
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-[10px]" style={{ color: 'var(--text-primary)' }}>
              <thead>
                <tr style={{ color: 'var(--text-tertiary)' }}>
                  <th className="text-left font-medium px-1 pb-1.5">Customer</th>
                  <th className="text-center font-medium px-1 pb-1.5">Score</th>
                  <th className="text-center font-medium px-1 pb-1.5">Days Since</th>
                  <th className="text-right font-medium px-1 pb-1.5">LTV</th>
                  <th className="text-left font-medium px-1 pb-1.5">Top Factor</th>
                  <th className="text-center font-medium px-1 pb-1.5">Urgency</th>
                </tr>
              </thead>
              <tbody>
                {top10.map((c: any) => {
                  const scoreColor = CHURN_COLORS[c.risk_level] ?? '#9ca3af';
                  const scorePct = Math.min(100, c.churn_score ?? 0);
                  const urgencyColor = URGENCY_COLORS[c.win_back_urgency] ?? '#9ca3af';

                  return (
                    <tr
                      key={c.customer_id}
                      className="border-t"
                      style={{ borderColor: 'var(--separator)' }}
                    >
                      <td className="px-1 py-1.5 font-medium truncate max-w-[120px]">
                        {c.name || 'Unknown'}
                      </td>
                      <td className="px-1 py-1.5">
                        <div className="flex items-center gap-1 justify-center">
                          <div
                            className="h-1.5 rounded-full"
                            style={{
                              width: 40,
                              background: 'var(--fill-quaternary)',
                            }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${scorePct}%`,
                                background: scoreColor,
                              }}
                            />
                          </div>
                          <span className="tabular-nums font-bold" style={{ color: scoreColor }}>
                            {c.churn_score ?? 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-1 py-1.5 text-center tabular-nums">
                        {c.last_booking_days ?? '—'}d
                      </td>
                      <td className="px-1 py-1.5 text-right tabular-nums">
                        ${(c.lifetime_value ?? 0).toLocaleString()}
                      </td>
                      <td
                        className="px-1 py-1.5 truncate max-w-[180px]"
                        style={{ color: 'var(--text-secondary)' }}
                        title={(c.factors ?? []).join('; ')}
                      >
                        {(c.factors ?? [])[0] ?? '—'}
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                          style={{
                            background: `${urgencyColor}22`,
                            color: urgencyColor,
                          }}
                        >
                          {c.win_back_urgency ?? '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>
    </div>
  );
}

export function ChartGrid({ analytics, loading, period, onPeriodChange, onStatusClick, reviewsData, organicData, creativesData, cohortData, churnData, forecastData }: ChartGridProps) {
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
    <div className="flex flex-col gap-2">
      {/* Row 1: Revenue Trend — full width */}
      <RevenueTrendChart
        data={analytics?.revenue_trend ?? []}
        period={period}
        onPeriodChange={onPeriodChange}
      />
      {/* Row 2: Customer Value Map — full width */}
      <VipScatter
        scatterData={analytics?.scatter_data ?? []}
        onStatusClick={onStatusClick}
      />
      {/* Row 3: Customer Health + P&L */}
      <div className="grid grid-cols-2 gap-2">
        <HealthArcs analytics={analytics} onStatusClick={onStatusClick} />
        <PnlCard analytics={analytics} />
      </div>
      {/* Row 4: Merchant Fees + Franchise Fees + Coupon */}
      <div className="grid grid-cols-3 gap-2">
        <FeesChart analytics={analytics} />
        <FranchiseFeesChart analytics={analytics} />
        <CouponImpactChart data={analytics?.coupon_impact ?? []} />
      </div>
      {/* Row 5: Acquisition Sources */}
      <AcquisitionSourcesChart attribution={analytics?.attribution ?? {}} />
      {/* Row 6: Reputation + Organic Search */}
      <div className="grid grid-cols-2 gap-2">
        <ReviewsCard data={reviewsData} />
        <OrganicSearchCard data={organicData} />
      </div>
      {/* Row 7: Creative Performance — full width */}
      <CreativePerformanceCard data={creativesData} />
      {/* Row 8: Cohort Analysis — full width */}
      <CohortAnalysisSection data={cohortData} />
      {/* Row 9: Revenue Forecast — full width */}
      <RevenueForecastSection data={forecastData} />
      {/* Row 10: Churn Prediction — full width */}
      <ChurnPredictionSection data={churnData} />
    </div>
  );
}
