'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Settings, Plug, TrendingUp, TrendingDown, Brain, Instagram } from 'lucide-react';
import Link from 'next/link';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import type { Company, CompanyIntegration } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

type DateRange = 'today' | '3d' | '7d' | '30d' | 'mtd' | '90d';

// ---------------------------------------------------------------------------
// Platform config
// ---------------------------------------------------------------------------

const platformNames: Record<string, string> = {
  meta: 'Meta Ads',
  meta_ads: 'Meta Ads',
  instagram: 'Instagram',
  google_analytics: 'Google Analytics',
  google_ads: 'Google Ads',
  google_business: 'Google Business',
  tiktok_ads: 'TikTok',
};

const platformColors: Record<string, string> = {
  meta: '#E02030',
  meta_ads: '#E02030',
  instagram: '#E1306C',
  google_analytics: '#30D158',
  google_ads: '#0A84FF',
  google_business: '#FF9F0A',
  tiktok_ads: '#5AC8FA',
};

const platformIcons: Record<string, string> = {
  meta_ads: '🔴',
  instagram: '📸',
  google_analytics: '🟢',
  google_ads: '🔵',
  google_business: '🟠',
  tiktok_ads: '🩵',
};

// ---------------------------------------------------------------------------
// AI Scoring — industry benchmarks
// ---------------------------------------------------------------------------

interface AiScore {
  score: number; // 0-5
  label: string;
  detail: string;
}

function scoreMetric(metric: string, value: number, context: { spend: number; impressions: number; clicks: number; conversions: number }): AiScore {
  switch (metric) {
    case 'ctr': {
      if (value >= 5) return { score: 5, label: 'Excellent', detail: 'CTR is well above the 2-3% industry average. Your ads are highly relevant to the audience.' };
      if (value >= 3) return { score: 4, label: 'Good', detail: 'CTR is above average. Your targeting and creative are performing well.' };
      if (value >= 1.5) return { score: 3, label: 'Average', detail: 'CTR is within the normal range. Consider testing new ad creatives to improve.' };
      if (value >= 0.5) return { score: 2, label: 'Below Avg', detail: 'CTR is below average. Review your targeting, ad copy, and creative assets.' };
      return { score: 1, label: 'Poor', detail: 'Very low CTR. Significant changes needed in targeting, creative, or offer.' };
    }
    case 'cpc': {
      if (value === 0) return { score: 0, label: 'No Data', detail: 'No click cost data available yet.' };
      if (value <= 0.3) return { score: 5, label: 'Excellent', detail: 'CPC is extremely low. You\'re getting very efficient clicks.' };
      if (value <= 0.7) return { score: 4, label: 'Good', detail: 'CPC is below average. Cost-efficient traffic acquisition.' };
      if (value <= 1.5) return { score: 3, label: 'Average', detail: 'CPC is within the typical range for social/search ads.' };
      if (value <= 3) return { score: 2, label: 'High', detail: 'CPC is above average. Consider broadening audiences or improving relevance.' };
      return { score: 1, label: 'Very High', detail: 'CPC is very high. Review keyword competition and audience targeting urgently.' };
    }
    case 'cpm': {
      const cpm = context.impressions > 0 ? (context.spend / context.impressions) * 1000 : 0;
      if (cpm === 0) return { score: 0, label: 'No Data', detail: 'No impression cost data yet.' };
      if (cpm <= 5) return { score: 5, label: 'Excellent', detail: 'CPM is very low. Great reach for the budget.' };
      if (cpm <= 12) return { score: 4, label: 'Good', detail: 'CPM is competitive. Efficient awareness building.' };
      if (cpm <= 20) return { score: 3, label: 'Average', detail: 'CPM is standard for social platforms.' };
      if (cpm <= 35) return { score: 2, label: 'High', detail: 'CPM is elevated. Audience might be too narrow or competitive.' };
      return { score: 1, label: 'Very High', detail: 'CPM is very high. Broaden targeting or test different placements.' };
    }
    case 'conversion_rate': {
      const rate = context.clicks > 0 ? (context.conversions / context.clicks) * 100 : 0;
      if (rate === 0) return { score: 0, label: 'No Data', detail: 'No conversion data yet.' };
      if (rate >= 10) return { score: 5, label: 'Excellent', detail: 'Outstanding conversion rate. Your funnel is highly optimized.' };
      if (rate >= 5) return { score: 4, label: 'Good', detail: 'Strong conversion rate. Above average performance.' };
      if (rate >= 2) return { score: 3, label: 'Average', detail: 'Conversion rate is typical. Test landing page improvements.' };
      if (rate >= 0.5) return { score: 2, label: 'Low', detail: 'Low conversion rate. Review landing page and offer alignment.' };
      return { score: 1, label: 'Very Low', detail: 'Conversion rate needs immediate attention. Check tracking and funnel.' };
    }
    case 'roas': {
      if (value === 0) return { score: 0, label: 'No Data', detail: 'No ROAS data available.' };
      if (value >= 5) return { score: 5, label: 'Excellent', detail: 'Outstanding return on ad spend. Every $1 returns $5+.' };
      if (value >= 3) return { score: 4, label: 'Good', detail: 'Healthy ROAS. Campaign is profitable and scalable.' };
      if (value >= 1.5) return { score: 3, label: 'Break Even', detail: 'Marginally profitable. Optimize to improve returns.' };
      if (value >= 0.5) return { score: 2, label: 'Unprofitable', detail: 'Spending more than earning. Review targeting and offers.' };
      return { score: 1, label: 'Losing', detail: 'Significant losses. Pause and restructure the campaign.' };
    }
    case 'reach_efficiency': {
      const freq = context.reach > 0 ? context.impressions / context.reach : 0;
      if (freq === 0) return { score: 0, label: 'No Data', detail: 'No reach data yet.' };
      if (freq <= 1.5) return { score: 5, label: 'Fresh', detail: 'Low frequency — audience is seeing ads for the first time. Maximum impact.' };
      if (freq <= 2.5) return { score: 4, label: 'Good', detail: 'Moderate frequency. Good balance of reach and reinforcement.' };
      if (freq <= 4) return { score: 3, label: 'Saturating', detail: 'Starting to show ads too often. Consider expanding audience.' };
      if (freq <= 6) return { score: 2, label: 'High', detail: 'Ad fatigue likely setting in. Rotate creatives and expand reach.' };
      return { score: 1, label: 'Fatigued', detail: 'Audience is oversaturated. Refresh creative and broaden targeting.' };
    }
    case 'overall': {
      // Average of available scores
      const scores = [
        scoreMetric('ctr', context.clicks > 0 ? (context.clicks / context.impressions) * 100 : 0, context),
        scoreMetric('cpc', context.clicks > 0 ? context.spend / context.clicks : 0, context),
        scoreMetric('conversion_rate', 0, context),
        scoreMetric('reach_efficiency', 0, context),
      ].filter(s => s.score > 0);
      const avg = scores.length > 0 ? scores.reduce((s, c) => s + c.score, 0) / scores.length : 0;
      const rounded = Math.round(avg);
      const labels = ['No Data', 'Poor', 'Below Avg', 'Average', 'Good', 'Excellent'];
      return { score: rounded, label: labels[rounded] ?? 'N/A', detail: `Overall campaign health based on ${scores.length} metrics.` };
    }
    default:
      return { score: 0, label: 'N/A', detail: '' };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Score Badge component
// ---------------------------------------------------------------------------

function ScoreBadge({ score }: { score: AiScore }) {
  if (score.score === 0) return null;

  const colors = [
    '', // 0 — unused
    '#FF3B30', // 1 — red
    '#FF9500', // 2 — orange
    '#FFCC00', // 3 — yellow
    '#34C759', // 4 — light green
    '#00C7BE', // 5 — teal
  ];

  const bgColor = colors[score.score] ?? '#888';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, padding: '6px 8px', borderRadius: 8, background: `color-mix(in srgb, ${bgColor} 10%, transparent)`, border: `1px solid color-mix(in srgb, ${bgColor} 20%, transparent)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        <Brain size={10} style={{ color: bgColor }} />
        <span style={{ fontSize: '10px', fontWeight: 700, color: bgColor }}>{score.score}/5</span>
      </div>
      <span style={{ fontSize: '9px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{score.detail}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function CompanyOverviewClient({ company, integrations, dailyMetrics }: Props) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>('today');
  // Multi-select: Set of selected platform slugs. Empty = all.
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const normSlug = (s: string) => s === 'meta' ? 'meta_ads' : s;

  const connectedPlatforms = useMemo(() => {
    const dataPlatforms = new Set(dailyMetrics.map((r) => normSlug(r.platform)));
    const connectedIntegrations = integrations
      .filter((i) => i.status === 'connected')
      .map((i) => normSlug(i.platform_slug));
    const all = new Set([...dataPlatforms, ...connectedIntegrations]);
    return [...all];
  }, [dailyMetrics, integrations]);

  // Multi-select toggle
  const togglePlatform = (slug: string) => {
    setSelectedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const selectAll = () => setSelectedPlatforms(new Set());
  const isAllSelected = selectedPlatforms.size === 0;
  const activePlatforms = isAllSelected ? connectedPlatforms : [...selectedPlatforms];

  // Filter by date range + multi-platform select
  const { filtered, previousFiltered } = useMemo(() => {
    const now = new Date();
    let days: number;
    let cutoff: Date;
    switch (dateRange) {
      case 'today': days = 1; cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate()); break;
      case '3d': days = 3; cutoff = new Date(now.getTime() - 3 * 86400000); break;
      case '7d': days = 7; cutoff = new Date(now.getTime() - 7 * 86400000); break;
      case '30d': days = 30; cutoff = new Date(now.getTime() - 30 * 86400000); break;
      case 'mtd': cutoff = new Date(now.getFullYear(), now.getMonth(), 1); days = Math.ceil((now.getTime() - cutoff.getTime()) / 86400000); break;
      default: days = 90; cutoff = new Date(now.getTime() - 90 * 86400000);
    }
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const prevCutoff = new Date(cutoff.getTime() - days * 86400000).toISOString().split('T')[0];

    let rows = dailyMetrics.filter((r) => r.date >= cutoffStr);
    let prevRows = dailyMetrics.filter((r) => r.date >= prevCutoff && r.date < cutoffStr);

    if (!isAllSelected) {
      rows = rows.filter((r) => selectedPlatforms.has(normSlug(r.platform)));
      prevRows = prevRows.filter((r) => selectedPlatforms.has(normSlug(r.platform)));
    }

    return { filtered: rows, previousFiltered: prevRows };
  }, [dailyMetrics, dateRange, selectedPlatforms, isAllSelected]);

  // Aggregate KPIs
  const kpis = useMemo(() => {
    const sum = (rows: DailyRow[]) => ({
      spend: rows.reduce((s, r) => s + r.spend, 0),
      impressions: rows.reduce((s, r) => s + r.impressions, 0),
      clicks: rows.reduce((s, r) => s + r.clicks, 0),
      conversions: rows.reduce((s, r) => s + r.conversions, 0),
      reach: rows.reduce((s, r) => s + r.reach, 0),
      leads: rows.reduce((s, r) => s + r.leads, 0),
      videoViews: rows.reduce((s, r) => s + r.videoViews, 0),
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
      _context: curr,
    };
  }, [filtered, previousFiltered]);

  // Chart data — per-platform for overlay view
  const chartData = useMemo(() => {
    const byDate: Record<string, Record<string, number> & { spend: number; impressions: number; clicks: number; conversions: number; reach: number }> = {};
    for (const r of filtered) {
      const slug = normSlug(r.platform);
      const d = byDate[r.date] ?? { spend: 0, impressions: 0, clicks: 0, conversions: 0, reach: 0 };
      d.spend += r.spend;
      d.impressions += r.impressions;
      d.clicks += r.clicks;
      d.conversions += r.conversions;
      d.reach += r.reach;
      d[`spend_${slug}`] = (d[`spend_${slug}`] ?? 0) + r.spend;
      d[`clicks_${slug}`] = (d[`clicks_${slug}`] ?? 0) + r.clicks;
      d[`impressions_${slug}`] = (d[`impressions_${slug}`] ?? 0) + r.impressions;
      d[`reach_${slug}`] = (d[`reach_${slug}`] ?? 0) + r.reach;
      d[`conversions_${slug}`] = (d[`conversions_${slug}`] ?? 0) + r.conversions;
      byDate[r.date] = d;
    }
    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({ date: fmtDate(date), rawDate: date, ...d }));
  }, [filtered]);

  // Platform breakdown for pie
  const platformBreakdown = useMemo(() => {
    const byPlatform: Record<string, { spend: number; impressions: number; clicks: number; conversions: number }> = {};
    for (const r of filtered) {
      const slug = normSlug(r.platform);
      const d = byPlatform[slug] ?? { spend: 0, impressions: 0, clicks: 0, conversions: 0 };
      d.spend += r.spend;
      d.impressions += r.impressions;
      d.clicks += r.clicks;
      d.conversions += r.conversions;
      byPlatform[slug] = d;
    }
    return Object.entries(byPlatform).map(([platform, data]) => ({
      name: platformNames[platform] ?? platform,
      slug: platform,
      value: data.spend > 0 ? data.spend : data.impressions,
      color: platformColors[platform] ?? '#888',
      ...data,
    }));
  }, [filtered]);

  // Weekly spend
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
    { key: 'today', label: 'Today' }, { key: '3d', label: '3D' },
    { key: '7d', label: '7D' }, { key: '30d', label: '30D' },
    { key: 'mtd', label: 'MTD' }, { key: '90d', label: '90D' },
  ];

  // Determine which platforms to render overlay lines for
  const showOverlay = activePlatforms.length > 1;

  // Widget card
  const W = ({ children, className = '', span = 1 }: { children: React.ReactNode; className?: string; span?: number }) => (
    <div
      className={className}
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
        borderRadius: 16, padding: '14px 16px',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-card)',
        gridColumn: span > 1 ? `span ${span}` : undefined,
        position: 'relative', overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1, background: 'linear-gradient(90deg, transparent, var(--gloss-highlight-strong), transparent)', pointerEvents: 'none' }} />
      {children}
    </div>
  );

  // Section header
  const SectionTitle = ({ title, icon }: { title: string; icon?: string }) => (
    <div style={{ gridColumn: 'span 4', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0 0 0' }}>
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{title}</h3>
    </div>
  );

  const KpiMini = ({ label, value, format, d, scoreKey }: { label: string; value: number; format: 'currency' | 'number' | 'pct'; d: { value: number; isUp: boolean }; scoreKey?: string }) => {
    const score = scoreKey ? scoreMetric(scoreKey, value, kpis._context) : null;
    return (
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
        {score && <ScoreBadge score={score} />}
      </W>
    );
  };

  // Active color
  const activeColor = !isAllSelected && selectedPlatforms.size === 1
    ? (platformColors[[...selectedPlatforms][0]] ?? '#E02030')
    : '#E02030';

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
              {!isAllSelected && ` · ${selectedPlatforms.size} selected`}
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

      {/* Filters row: MULTI-SELECT platform pills + date range */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {/* All button */}
          <button
            onClick={selectAll}
            style={{
              padding: '5px 12px', borderRadius: 20, border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
              background: isAllSelected ? 'var(--accent)' : 'var(--fill-quaternary)',
              color: isAllSelected ? 'white' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >
            All
          </button>
          {/* Individual pills — click to multi-select */}
          {connectedPlatforms.map((slug) => {
            const color = platformColors[slug] ?? '#888';
            const active = selectedPlatforms.has(slug);
            return (
              <button
                key={slug}
                onClick={() => togglePlatform(slug)}
                style={{
                  padding: '5px 12px', borderRadius: 20,
                  border: active ? `2px solid ${color}` : '2px solid transparent',
                  fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                  background: active ? `color-mix(in srgb, ${color} 15%, transparent)` : 'var(--fill-quaternary)',
                  color: active ? color : 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', gap: 5,
                  transition: 'all 0.15s',
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

      {/* AI Overall Score Banner */}
      {kpis._context.impressions > 0 && (() => {
        const overall = scoreMetric('overall', 0, kpis._context);
        const colors = ['', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE'];
        const bgColor = colors[overall.score] ?? '#888';
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, padding: '10px 16px',
            borderRadius: 12, background: `color-mix(in srgb, ${bgColor} 8%, var(--glass-bg))`,
            border: `1px solid color-mix(in srgb, ${bgColor} 20%, transparent)`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Brain size={16} style={{ color: bgColor }} />
              <span style={{ fontSize: '18px', fontWeight: 800, color: bgColor }}>{overall.score}/5</span>
            </div>
            <div>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>Campaign Health: {overall.label}</span>
              <p style={{ fontSize: '10px', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>{overall.detail}</p>
            </div>
          </div>
        );
      })()}

      {/* ===== WIDGET GRID ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>

        {/* ── Section: Overview KPIs ── */}
        <SectionTitle title="Performance Overview" icon="📊" />
        <KpiMini label="Ad Spend" value={kpis.spend.value} format="currency" d={kpis.spend.delta} />
        <KpiMini label="Impressions" value={kpis.impressions.value} format="number" d={kpis.impressions.delta} />
        <KpiMini label="Clicks" value={kpis.clicks.value} format="number" d={kpis.clicks.delta} />
        <KpiMini label="Conversions" value={kpis.conversions.value} format="number" d={kpis.conversions.delta} />

        {/* ── Section: Trends ── */}
        <SectionTitle title="Trends" icon="📈" />

        {/* Spend trend — spans 2 */}
        <W span={2}>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 600 }}>Spend Over Time</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={activeColor} stopOpacity={0} />
                  </linearGradient>
                  {connectedPlatforms.map((slug) => (
                    <linearGradient key={slug} id={`grad_${slug}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={platformColors[slug] ?? '#888'} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={platformColors[slug] ?? '#888'} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} width={35} tickFormatter={(v) => `$${fmt(v)}`} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)', borderRadius: 8, fontSize: 11 }} />
                {showOverlay ? (
                  activePlatforms.map((slug) => (
                    <Area key={slug} type="natural" dataKey={`spend_${slug}`} name={platformNames[slug] ?? slug} stroke={platformColors[slug] ?? '#888'} strokeWidth={2} fill={`url(#grad_${slug})`} />
                  ))
                ) : (
                  <Area type="natural" dataKey="spend" stroke={activeColor} strokeWidth={2} fill="url(#spendGrad)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-quaternary)', textAlign: 'center', padding: '40px 0' }}>No data</p>
          )}
        </W>

        <KpiMini label="CTR" value={kpis.ctr.value} format="pct" d={kpis.ctr.delta} scoreKey="ctr" />
        <KpiMini label="CPC" value={kpis.cpc.value} format="currency" d={kpis.cpc.delta} scoreKey="cpc" />

        {/* Clicks & Conversions — spans 2 */}
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
                {showOverlay ? (
                  activePlatforms.map((slug) => (
                    <Area key={slug} type="natural" dataKey={`clicks_${slug}`} name={platformNames[slug] ?? slug} stroke={platformColors[slug] ?? '#888'} strokeWidth={2} fill="none" />
                  ))
                ) : (
                  <>
                    <Area type="natural" dataKey="clicks" stroke={activeColor} strokeWidth={2} fill="url(#clickGrad)" />
                    <Area type="natural" dataKey="conversions" stroke="#30D158" strokeWidth={2} fill="none" strokeDasharray="4 2" />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-quaternary)', textAlign: 'center', padding: '40px 0' }}>No data</p>
          )}
          <ScoreBadge score={scoreMetric('conversion_rate', 0, kpis._context)} />
        </W>

        {/* Weekly spend bars */}
        <W>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 600 }}>Weekly Spend</p>
          {weeklySpend.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <BarChart data={weeklySpend}>
                <Bar dataKey="spend" fill="var(--accent)" radius={[8, 8, 2, 2]} />
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

        {/* ── Section: Efficiency ── */}
        <SectionTitle title="Efficiency & ROI" icon="💰" />

        <KpiMini label="Reach" value={kpis.reach.value} format="number" d={kpis.reach.delta} scoreKey="reach_efficiency" />
        <W>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0', fontWeight: 600 }}>Cost / Conversion</p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
            {kpis.conversions.value > 0 ? `$${(kpis.spend.value / kpis.conversions.value).toFixed(2)}` : '—'}
          </p>
          <p style={{ fontSize: '9px', color: 'var(--text-quaternary)', margin: '2px 0 0 0' }}>per conversion</p>
        </W>
        <W>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0', fontWeight: 600 }}>CPM</p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
            ${kpis.impressions.value > 0 ? ((kpis.spend.value / kpis.impressions.value) * 1000).toFixed(2) : '0.00'}
          </p>
          <p style={{ fontSize: '9px', color: 'var(--text-quaternary)', margin: '2px 0 0 0' }}>per 1,000 impressions</p>
          <ScoreBadge score={scoreMetric('cpm', 0, kpis._context)} />
        </W>
        <W>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 4px 0', fontWeight: 600 }}>Frequency</p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
            {kpis.reach.value > 0 ? (kpis.impressions.value / kpis.reach.value).toFixed(1) : '—'}
          </p>
          <p style={{ fontSize: '9px', color: 'var(--text-quaternary)', margin: '2px 0 0 0' }}>avg views per person</p>
          <ScoreBadge score={scoreMetric('reach_efficiency', 0, kpis._context)} />
        </W>

        {/* ── Section: Reach & Awareness ── */}
        <SectionTitle title="Reach & Awareness" icon="👁️" />

        {/* Impressions vs Reach — spans 2 */}
        <W span={2}>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 600 }}>Impressions vs Reach</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="imprGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF9F0A" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#FF9F0A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} width={35} tickFormatter={(v) => fmt(v)} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)', borderRadius: 8, fontSize: 11 }} />
                {showOverlay ? (
                  activePlatforms.map((slug) => (
                    <Area key={slug} type="natural" dataKey={`impressions_${slug}`} name={`${platformNames[slug] ?? slug} Impr.`} stroke={platformColors[slug] ?? '#888'} strokeWidth={2} fill="none" />
                  ))
                ) : (
                  <Area type="natural" dataKey="impressions" stroke="#FF9F0A" strokeWidth={2} fill="url(#imprGrad)" />
                )}
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-quaternary)', textAlign: 'center', padding: '30px 0' }}>No data</p>
          )}
        </W>

        {/* Conversions trend — spans 2 */}
        <W span={2}>
          <p style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px 0', fontWeight: 600 }}>Conversions Trend</p>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <BarChart data={chartData}>
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--text-quaternary)' }} axisLine={false} tickLine={false} width={25} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--separator)', borderRadius: 8, fontSize: 11 }} />
                {showOverlay ? (
                  activePlatforms.map((slug) => (
                    <Bar key={slug} dataKey={`conversions_${slug}`} name={platformNames[slug] ?? slug} fill={platformColors[slug] ?? '#888'} radius={[4, 4, 0, 0]} stackId="conv" />
                  ))
                ) : (
                  <Bar dataKey="conversions" fill="#30D158" radius={[8, 8, 2, 2]} />
                )}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ fontSize: '12px', color: 'var(--text-quaternary)', textAlign: 'center', padding: '30px 0' }}>No data</p>
          )}
        </W>

        {/* ── Section: Daily Breakdown ── */}
        <SectionTitle title="Daily Breakdown" icon="📅" />

        <W span={4}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Date', 'Platform', 'Spend', 'Impr.', 'Clicks', 'CTR', 'CPC', 'Conv.'].map((h) => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', color: 'var(--text-tertiary)', fontWeight: 600, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '1px solid var(--separator)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.slice().reverse().slice(0, 14).map((row) => {
                  // Show platform breakdown when multiple selected
                  const platformLabel = showOverlay
                    ? activePlatforms.map(s => platformNames[s]?.split(' ')[0] ?? s).join('+')
                    : activePlatforms.length === 1 ? platformNames[activePlatforms[0]] ?? '' : 'All';
                  return (
                    <tr
                      key={row.date}
                      style={{ borderBottom: '1px solid var(--separator)', cursor: 'default', transition: 'background 0.1s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--fill-quaternary)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <td style={{ padding: '8px 10px', color: 'var(--text-primary)', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{row.date}</td>
                      <td style={{ padding: '8px 10px', fontSize: '10px', color: 'var(--text-secondary)' }}>{platformLabel}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>${row.spend.toFixed(2)}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{row.impressions.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{row.clicks.toLocaleString()}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(1) : '0'}%</td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>${row.clicks > 0 ? (row.spend / row.clicks).toFixed(2) : '0.00'}</td>
                      <td style={{ padding: '8px 10px', color: 'var(--text-primary)', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{row.conversions}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </W>
      </div>
    </div>
  );
}
