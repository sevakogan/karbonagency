import { useMemo } from 'react';
import { normSlug, PLATFORM_NAMES, PLATFORM_COLORS } from './platform-config';
import { fmtDate, delta } from './format-utils';

export type DateRange = 'today' | '3d' | '7d' | '30d' | 'mtd' | 'ytd' | '90d' | 'custom';

export interface DailyRow {
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

interface DashboardDataInput {
  dailyMetrics: DailyRow[];
  dateRange: DateRange;
  selectedPlatforms: Set<string>;
  connectedPlatforms: string[];
}

export function useDashboardData({ dailyMetrics, dateRange, selectedPlatforms, connectedPlatforms }: DashboardDataInput) {
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
      case 'ytd': cutoff = new Date(now.getFullYear(), 0, 1); days = Math.ceil((now.getTime() - cutoff.getTime()) / 86400000); break;
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
      name: PLATFORM_NAMES[platform] ?? platform,
      slug: platform,
      value: data.spend > 0 ? data.spend : data.impressions,
      color: PLATFORM_COLORS[platform] ?? '#888',
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

  const showOverlay = filtered.length === 0;

  return {
    filtered,
    previousFiltered,
    kpis,
    chartData,
    platformBreakdown,
    weeklySpend,
    activePlatforms,
    isAllSelected,
    showOverlay,
  };
}
