'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Settings, Plug, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import type { Company, CompanyIntegration } from '@/types';

interface DailyRow {
  date: string;
  platform: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  conversions: number;
  costPerConversion: number;
  roas: number;
  videoViews: number;
  leads: number;
  linkClicks: number;
}

interface Props {
  company: Company;
  integrations: CompanyIntegration[];
  dailyMetrics: DailyRow[];
}

type DateRange = '7d' | '30d' | 'mtd' | '90d';
type PlatformFilter = 'all' | string;

const platformNames: Record<string, string> = {
  meta: 'Meta Ads',
  meta_ads: 'Meta Ads',
  google_analytics: 'Google Analytics',
  google_ads: 'Google Ads',
  google_business: 'Google Business',
  tiktok_ads: 'TikTok',
};

const platformColors: Record<string, string> = {
  meta: '#E02030',
  meta_ads: '#E02030',
  google_analytics: '#30D158',
  google_ads: '#0A84FF',
  google_business: '#FF9F0A',
  tiktok_ads: '#5AC8FA',
};

function fmt(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toFixed(n < 10 && n > 0 ? 2 : 0);
}

function fmtDate(d: string) {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function delta(current: number, previous: number): { value: number; isUp: boolean } {
  if (previous === 0) return { value: 0, isUp: true };
  const pct = ((current - previous) / previous) * 100;
  return { value: Math.abs(pct), isUp: pct >= 0 };
}

export function CompanyOverviewClient({ company, integrations, dailyMetrics }: Props) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [refreshing, setRefreshing] = useState(false);

  const connectedPlatforms = useMemo(() => {
    const connected = integrations.filter((i) => i.status === 'connected');
    // Also check what platforms exist in the data
    const dataPlatforms = [...new Set(dailyMetrics.map((r) => r.platform))];
    const all = new Set([...connected.map((i) => i.platform_slug), ...dataPlatforms]);
    return [...all];
  }, [integrations, dailyMetrics]);

  // Filter by date range
  const { filtered, previousFiltered } = useMemo(() => {
    const now = new Date();
    let days: number;
    let cutoff: Date;
    switch (dateRange) {
      case '7d': days = 7; cutoff = new Date(now.getTime() - 7 * 86400000); break;
      case '30d': days = 30; cutoff = new Date(now.getTime() - 30 * 86400000); break;
      case 'mtd': cutoff = new Date(now.getFullYear(), now.getMonth(), 1); days = Math.ceil((now.getTime() - cutoff.getTime()) / 86400000); break;
      default: days = 90; cutoff = new Date(now.getTime() - 90 * 86400000);
    }
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const prevCutoff = new Date(cutoff.getTime() - days * 86400000).toISOString().split('T')[0];

    let rows = dailyMetrics.filter((r) => r.date >= cutoffStr);
    let prevRows = dailyMetrics.filter((r) => r.date >= prevCutoff && r.date < cutoffStr);

    if (platformFilter !== 'all') {
      rows = rows.filter((r) => r.platform === platformFilter);
      prevRows = prevRows.filter((r) => r.platform === platformFilter);
    }

    return { filtered: rows, previousFiltered: prevRows };
  }, [dailyMetrics, dateRange, platformFilter]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const sum = (rows: DailyRow[]) => ({
      spend: rows.reduce((s, r) => s + r.spend, 0),
      impressions: rows.reduce((s, r) => s + r.impressions, 0),
      clicks: rows.reduce((s, r) => s + r.clicks, 0),
      conversions: rows.reduce((s, r) => s + r.conversions, 0),
      reach: rows.reduce((s, r) => s + r.reach, 0),
      leads: rows.reduce((s, r) => s + r.leads, 0),
    });
    const curr = sum(filtered);
    const prev = sum(previousFiltered);
    return {
      spend: { value: curr.spend, delta: delta(curr.spend, prev.spend) },
      impressions: { value: curr.impressions, delta: delta(curr.impressions, prev.impressions) },
      clicks: { value: curr.clicks, delta: delta(curr.clicks, prev.clicks) },
      ctr: { value: curr.impressions > 0 ? (curr.clicks / curr.impressions) * 100 : 0, delta: delta(curr.impressions > 0 ? curr.clicks / curr.impressions : 0, prev.impressions > 0 ? prev.clicks / prev.impressions : 0) },
      cpc: { value: curr.clicks > 0 ? curr.spend / curr.clicks : 0, delta: delta(curr.clicks > 0 ? curr.spend / curr.clicks : 0, prev.clicks > 0 ? prev.spend / prev.clicks : 0) },
      conversions: { value: curr.conversions, delta: delta(curr.conversions, prev.conversions) },
      reach: { value: curr.reach, delta: delta(curr.reach, prev.reach) },
      roas: { value: curr.spend > 0 ? (curr.conversions * 50) / curr.spend : 0, delta: { value: 0, isUp: true } },
    };
  }, [filtered, previousFiltered]);

  // Chart data — aggregate by date
  const chartData = useMemo(() => {
    const byDate: Record<string, { spend: number; impressions: number; clicks: number; conversions: number }> = {};
    for (const r of filtered) {
      const d = byDate[r.date] ?? { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
      d.spend += r.spend;
      d.impressions += r.impressions;
      d.clicks += r.clicks;
      d.conversions += r.conversions;
      byDate[r.date] = d;
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date: fmtDate(date), ...d }));
  }, [filtered]);

  // Platform breakdown for pie
  const platformBreakdown = useMemo(() => {
    const byPlatform: Record<string, number> = {};
    for (const r of filtered) {
      byPlatform[r.platform] = (byPlatform[r.platform] ?? 0) + r.spend;
    }
    return Object.entries(byPlatform).map(([platform, spend]) => ({
      name: platformNames[platform] ?? platform,
      value: spend,
      color: platformColors[platform] ?? '#888',
    }));
  }, [filtered]);

  // Weekly spend for bar chart
  const weeklySpend = useMemo(() => {
    const weeks: Record<string, number> = {};
    for (const r of filtered) {
      const d = new Date(r.date + 'T00:00:00');
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      const key = weekStart.toISOString().split('T')[0];
      weeks[key] = (weeks[key] ?? 0) + r.spend;
    }
    return Object.entries(weeks)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8)
      .map(([date, spend]) => ({ week: fmtDate(date), spend }));
  }, [filtered]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try { await fetch(`/api/sync/${company.id}`, { method: 'POST' }); } catch {}
    setRefreshing(false);
    router.refresh();
  };

  const ranges: Array<{ key: DateRange; label: string }> = [
    { key: '7d', label: '7D' }, { key: '30d', label: '30D' },
    { key: 'mtd', label: 'MTD' }, { key: '90d', label: '90D' },
  ];

  // Widget card wrapper
  const W = ({ children, className = '', span = 1 }: { children: React.ReactNode; className?: string; span?: number }) => (
    <div
      className={className}
      style={{
        background: 'var(--bg-elevated)',
        borderRadius: 16,
        padding: '14px 16px',
        border: '1px solid var(--glass-border)',
        gridColumn: span > 1 ? `span ${span}` : undefined,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Top gloss */}
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, var(--gloss-highlight), transparent)' }} />
      {children}
    </div>
  );

  const KpiMini = ({ label, value, format, d }: { label: string; value: number; format: 'currency' | 'number' | 'pct'; d: { value: number; isUp: boolean } }) => (
    <W>
      <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0', fontWeight: 600 }}>{label}</p>
      <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 2px 0', fontVariantNumeric: 'tabular-nums' }}>
        {format === 'currency' ? `$${fmt(value)}` : format === 'pct' ? `${value.toFixed(1)}%` : fmt(value)}
      </p>
      {d.value > 0 && (
        <span style={{ fontSize: '10px', fontWeight: 600, color: d.isUp ? 'var(--system-green)' : 'var(--system-red)', display: 'inline-flex', alignItems: 'center', gap: 2 }}>
          {d.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {d.value.toFixed(1)}%
        </span>
      )}
    </W>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <ArrowLeft size={18} />
          </button>
          {company.logo_url ? (
            <img src={company.logo_url} alt="" style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-muted)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16 }}>
              {company.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{company.name}</h1>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0 }}>
              {connectedPlatforms.length} platform{connectedPlatforms.length !== 1 ? 's' : ''} connected
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={handleRefresh} style={{ background: 'var(--fill-quaternary)', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} /> Refresh
          </button>
          <Link href={`/dashboard/companies/${company.id}/platforms`} style={{ background: 'var(--fill-quaternary)', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Plug size={12} /> Platforms
          </Link>
          <Link href={`/dashboard/companies/${company.id}/settings`} style={{ background: 'var(--fill-quaternary)', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Settings size={12} />
          </Link>
        </div>
      </div>

      {/* Filters row: platform pills + date range */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        {/* Platform pills */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          <button
            onClick={() => setPlatformFilter('all')}
            style={{
              padding: '5px 12px', borderRadius: 20, border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              background: platformFilter === 'all' ? 'var(--accent)' : 'var(--fill-quaternary)',
              color: platformFilter === 'all' ? 'white' : 'var(--text-secondary)',
            }}
          >
            All
          </button>
          {connectedPlatforms.map((slug) => {
            const color = platformColors[slug] ?? '#888';
            const active = platformFilter === slug;
            return (
              <button
                key={slug}
                onClick={() => setPlatformFilter(slug)}
                style={{
                  padding: '5px 12px', borderRadius: 20, border: 'none', fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                  background: active ? `color-mix(in srgb, ${color} 20%, transparent)` : 'var(--fill-quaternary)',
                  color: active ? color : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, boxShadow: active ? `0 0 6px ${color}` : 'none' }} />
                {platformNames[slug] ?? slug}
              </button>
            );
          })}
        </div>

        {/* Date range */}
        <div style={{ display: 'flex', background: 'var(--fill-quaternary)', borderRadius: 20, padding: 2 }}>
          {ranges.map((r) => (
            <button
              key={r.key}
              onClick={() => setDateRange(r.key)}
              style={{
                padding: '4px 10px', borderRadius: 18, border: 'none', fontSize: '10px', fontWeight: 600, cursor: 'pointer',
                background: dateRange === r.key ? 'var(--accent)' : 'transparent',
                color: dateRange === r.key ? 'white' : 'var(--text-tertiary)',
              }}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Widget grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {/* KPI row */}
        <KpiMini label="Ad Spend" value={kpis.spend.value} format="currency" d={kpis.spend.delta} />
        <KpiMini label="Impressions" value={kpis.impressions.value} format="number" d={kpis.impressions.delta} />
        <KpiMini label="Clicks" value={kpis.clicks.value} format="number" d={kpis.clicks.delta} />
        <KpiMini label="Conversions" value={kpis.conversions.value} format="number" d={kpis.conversions.delta} />

        {/* Spend trend chart — spans 2 cols */}
        <W span={2}>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 600 }}>Spend Over Time</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} width={35} tickFormatter={(v) => `$${fmt(v)}`} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="spend" stroke="var(--accent)" strokeWidth={2} fill="url(#spendGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-quaternary)', textAlign: 'center', padding: '40px 0' }}>No data</p>
          )}
        </W>

        {/* CTR + CPC */}
        <KpiMini label="CTR" value={kpis.ctr.value} format="pct" d={kpis.ctr.delta} />
        <KpiMini label="CPC" value={kpis.cpc.value} format="currency" d={kpis.cpc.delta} />

        {/* Clicks chart — spans 2 */}
        <W span={2}>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 600 }}>Clicks & Conversions</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0A84FF" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#0A84FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} width={35} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)', borderRadius: 8, fontSize: 11 }} />
                <Area type="monotone" dataKey="clicks" stroke="#0A84FF" strokeWidth={2} fill="url(#clickGrad)" />
                <Area type="monotone" dataKey="conversions" stroke="var(--system-green)" strokeWidth={1.5} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-quaternary)', textAlign: 'center', padding: '40px 0' }}>No data</p>
          )}
        </W>

        {/* Weekly spend bars */}
        <W>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 600 }}>Weekly Spend</p>
          {weeklySpend.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={weeklySpend}>
                <Bar dataKey="spend" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)', borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`$${fmt(v)}`, 'Spend']} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontSize: '11px', color: 'var(--text-quaternary)', textAlign: 'center' }}>No data</p>
          )}
        </W>

        {/* Platform breakdown pie */}
        <W>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 600 }}>By Platform</p>
          {platformBreakdown.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ResponsiveContainer width={80} height={80}>
                <PieChart>
                  <Pie data={platformBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={22} outerRadius={36} paddingAngle={2}>
                    {platformBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 4 }}>
                {platformBreakdown.map((p) => (
                  <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '9px', color: 'var(--text-secondary)' }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: p.color }} />
                    {p.name}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '11px', color: 'var(--text-quaternary)', textAlign: 'center' }}>No data</p>
          )}
        </W>

        {/* Daily table — spans full width */}
        <W span={4}>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 600 }}>Daily Breakdown</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
              <thead>
                <tr>
                  {['Date', 'Spend', 'Impr.', 'Clicks', 'CTR', 'CPC', 'Conv.'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '4px 8px', color: 'var(--text-quaternary)', fontWeight: 600, fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--separator)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.slice().reverse().slice(0, 14).map((row) => (
                  <tr key={row.date} style={{ borderBottom: '1px solid var(--separator)' }}>
                    <td style={{ padding: '5px 8px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{row.date}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>${row.spend.toFixed(2)}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{row.impressions.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{row.clicks.toLocaleString()}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(1) : '0'}%</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>${row.clicks > 0 ? (row.spend / row.clicks).toFixed(2) : '0.00'}</td>
                    <td style={{ padding: '5px 8px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{row.conversions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </W>
      </div>
    </div>
  );
}
