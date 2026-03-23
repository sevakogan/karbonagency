'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { TrendingUp, TrendingDown, BarChart3, Filter, DollarSign, Route, Users, Receipt, Activity, Radio } from 'lucide-react';
import type { Company, CompanyIntegration } from '@/types';
import { useDashboardData, type DailyRow, type DateRange } from '@/lib/dashboard/use-dashboard-data';
import { PLATFORM_COLORS, PLATFORM_ICONS, normSlug } from '@/lib/dashboard/platform-config';
import { scoreMetric } from '@/lib/dashboard/ai-scoring';
import { fmt } from '@/lib/dashboard/format-utils';

import { BentoCard } from './bento-card';
import { DashboardHeader } from './dashboard-header';
import { PlatformFilterBar } from './platform-filter-bar';
import { HeroRevenue } from './hero-revenue';
import { HeroHealth } from './hero-health';
import { AiInsightsCard } from './ai-insights-card';
import { SectionHeaderV2 } from './section-header-v2';
import { RevenueDonut } from './revenue-donut';
import { HBarChart } from './h-bar-chart';
import { StackedBars } from './stacked-bars';
import { ChannelCards } from './channel-cards';
import { FunnelSection } from './funnel-section';
import { AreaChartSvg } from './area-chart-svg';
import { CustomerJourney } from './customer-journey';
import { RecentTransactions } from './recent-transactions';
import { DailyBreakdownTable } from './daily-breakdown-table';
import { ShiftOSToggle } from './shiftos-toggle';
import { ShiftOSAnalyticsPanel } from './shiftos-analytics-panel';
import { InstagramSection } from '@/components/dashboard/instagram-section';

interface Props {
  company: Company;
  integrations: CompanyIntegration[];
  dailyMetrics: DailyRow[];
}

export function CompanyDashboard({ company, integrations, dailyMetrics }: Props) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const [customStart, setCustomStart] = useState<string | undefined>();
  const [customEnd, setCustomEnd] = useState<string | undefined>();
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [shiftosAnalytics, setShiftosAnalytics] = useState(true); // default ON

  // Fetch session token for Instagram API calls
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getSession().then(({ data }) => {
      setSessionToken(data.session?.access_token ?? null);
    });
  }, []);

  // Derive connected platforms from metrics data + integrations
  const connectedPlatforms = useMemo(() => {
    const dataPlatforms = new Set(dailyMetrics.map((r) => normSlug(r.platform)));
    const connectedIntegrations = integrations
      .filter((i) => i.status === 'connected')
      .map((i) => normSlug(i.platform_slug));
    return [...new Set([...dataPlatforms, ...connectedIntegrations])];
  }, [dailyMetrics, integrations]);

  // All data processing via hook
  const dashData = useDashboardData({
    dailyMetrics,
    dateRange,
    selectedPlatforms,
    connectedPlatforms,
    customStart,
    customEnd,
  });

  const handleCustomDateRange = (start: string, end: string) => {
    setCustomStart(start);
    setCustomEnd(end);
    setDateRange('custom');
  };

  const togglePlatform = (slug: string) => {
    setSelectedPlatforms((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const selectAll = () => setSelectedPlatforms(new Set());

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`/api/sync/${company.id}`, { method: 'POST' });
    } catch {
      /* sync errors handled server-side */
    }
    setRefreshing(false);
    router.refresh();
  };

  // --- Revenue: fetch from real marketing analytics + ShiftOS analytics ---
  const [marketingData, setMarketingData] = useState<{
    revenueThisMonth: number;
    revenueLifetime: number;
    shiftosRevenue: number;
    squareRevenue: number;
    avgLTV: number;
    totalCustomerBookings: number;
    revenueTrend: Array<{ period: string; revenue: number }>;
  }>({ revenueThisMonth: 0, revenueLifetime: 0, shiftosRevenue: 0, squareRevenue: 0, avgLTV: 0, totalCustomerBookings: 0, revenueTrend: [] });
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
    if (!company.id) return;
    Promise.all([
      fetch(`/api/marketing/analytics?companyId=${company.id}&period=30d`).then(r => r.ok ? r.json() : null),
      fetch(`/api/shiftos/analytics?companyId=${company.id}`).then(r => r.ok ? r.json() : null),
    ]).then(([mktg, shiftos]) => {
      if (mktg) {
        setMarketingData({
          revenueThisMonth: mktg.revenue_this_month ?? 0,
          revenueLifetime: mktg.revenue_lifetime ?? 0,
          shiftosRevenue: mktg.pnl?.shiftos_revenue ?? 0,
          squareRevenue: mktg.pnl?.square_revenue ?? 0,
          avgLTV: mktg.avg_lifetime_value ?? 0,
          totalCustomerBookings: (mktg.revenue_trend ?? []).reduce((s: number, r: { bookings?: number }) => s + (r.bookings ?? 0), 0),
          revenueTrend: (mktg.revenue_trend ?? []).map((r: { period: string; revenue: number }) => ({
            period: r.period,
            revenue: r.revenue ?? 0,
          })),
        });
      }
      if (shiftos?.revenue?.today != null) {
        setTodayRevenue(shiftos.revenue.today);
      }
    }).catch(() => {});
  }, [company.id]);

  // --- Attribution data for Customer Attribution Summary ---
  const [attributionData, setAttributionData] = useState<Record<string, number>>({});
  useEffect(() => {
    if (!company.id) return;
    fetch(`/api/marketing/analytics?companyId=${company.id}&period=30d`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.attribution) {
          setAttributionData(data.attribution);
        }
      })
      .catch(() => {});
  }, [company.id]);

  // --- Pixel health for CAPI monitor ---
  const [pixelHealth, setPixelHealth] = useState<{
    match_quality_score: number;
    event_match_rate: number;
    last_event_time: string;
    events_last_24h: number;
    capi_health: string;
  } | null>(null);
  useEffect(() => {
    fetch('/api/meta/pixel-health')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) setPixelHealth(data);
      })
      .catch(() => {});
  }, []);

  const revenueData = {
    totalRevenue: marketingData.revenueThisMonth,
    shiftOSRevenue: marketingData.shiftosRevenue,
    squareRevenue: marketingData.squareRevenue,
    transactions: marketingData.totalCustomerBookings,
    avgTicket: marketingData.totalCustomerBookings > 0
      ? marketingData.revenueLifetime / marketingData.totalCustomerBookings
      : 0,
  };

  // --- Derived data for V2 sections ---

  const overallHealth = scoreMetric('overall', 0, dashData.kpis._context);
  const healthyCount = [
    dashData.kpis.ctr.value > 1.5 ? 1 : 0,
    dashData.kpis.cpc.value > 0 && dashData.kpis.cpc.value < 1.5 ? 1 : 0,
    dashData.kpis.conversions.value > 0 ? 1 : 0,
    dashData.kpis.reach.value > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const roas = dashData.kpis.spend.value > 0 && marketingData.revenueThisMonth > 0
    ? `${(marketingData.revenueThisMonth / dashData.kpis.spend.value).toFixed(1)}x`
    : '—';
  const cpa = dashData.kpis.conversions.value > 0
    ? `$${(dashData.kpis.spend.value / dashData.kpis.conversions.value).toFixed(0)}`
    : '—';

  const aiInsights = useMemo(() => {
    const insights: Array<{ type: string; confidence: number; text: string; icon: string; color: string }> = [];
    if (dashData.kpis.conversions.value > 0) {
      insights.push({
        type: 'attribution', confidence: 0.85,
        text: `${dashData.kpis.conversions.value} conversions matched to ad clicks within reporting window`,
        icon: '\u{1F517}', color: '#0A84FF',
      });
    }
    if (dashData.kpis.ctr.value > 3) {
      insights.push({
        type: 'anomaly', confidence: 0.92,
        text: `CTR at ${dashData.kpis.ctr.value.toFixed(1)}% \u2014 well above 2-3% industry average`,
        icon: '\u26A1', color: '#30D158',
      });
    }
    if (dashData.kpis.cpc.value > 0 && dashData.kpis.cpc.value < 0.50) {
      insights.push({
        type: 'opportunity', confidence: 0.78,
        text: `CPC at $${dashData.kpis.cpc.value.toFixed(2)} \u2014 room to scale spend efficiently`,
        icon: '\u{1F4A1}', color: '#FF9F0A',
      });
    }
    if (dashData.kpis.spend.value > 0 && marketingData.revenueThisMonth > 0) {
      const realRoas = (marketingData.revenueThisMonth / dashData.kpis.spend.value).toFixed(1);
      insights.push({
        type: 'forecast', confidence: 0.95,
        text: `True ROAS: ${realRoas}x — $${Math.round(marketingData.revenueThisMonth).toLocaleString()} revenue vs $${Math.round(dashData.kpis.spend.value).toLocaleString()} ad spend`,
        icon: '\u{1F52E}', color: '#64D2FF',
      });
    }
    if (dashData.platformBreakdown.length > 1) {
      const sorted = [...dashData.platformBreakdown].sort((a, b) => b.value - a.value);
      const top = sorted[0];
      const totalValue = dashData.platformBreakdown.reduce((s, p) => s + p.value, 0);
      insights.push({
        type: 'pattern', confidence: 0.87,
        text: `${top.name} driving ${((top.value / totalValue) * 100).toFixed(0)}% of activity`,
        icon: '\u{1F4CA}', color: '#BF5AF2',
      });
    }
    return insights.slice(0, 5);
  }, [dashData, marketingData]);

  const channelData = useMemo(() => {
    const totalPlatformSpend = dashData.platformBreakdown.reduce((s, p) => s + p.spend, 0);
    return dashData.platformBreakdown.map((p) => ({
      name: p.name,
      icon: PLATFORM_ICONS[p.slug] ?? '\u{1F4CA}',
      spend: p.spend,
      clicks: p.clicks,
      sessions: p.clicks,
      bookings: p.conversions,
      revenue: totalPlatformSpend > 0 ? Math.round(marketingData.revenueThisMonth * (p.spend / totalPlatformSpend)) : 0,
      color: PLATFORM_COLORS[p.slug] ?? '#888',
      daily: dashData.chartData.map((d) => (d[`clicks_${p.slug}`] as number) ?? 0),
      ctr: p.impressions > 0 ? `${((p.clicks / p.impressions) * 100).toFixed(1)}%` : '\u2014',
      cvr: p.clicks > 0 ? `${((p.conversions / p.clicks) * 100).toFixed(2)}%` : '\u2014',
      trend: dashData.kpis.clicks.delta.isUp
        ? `+${dashData.kpis.clicks.delta.value.toFixed(0)}%`
        : `-${dashData.kpis.clicks.delta.value.toFixed(0)}%`,
    }));
  }, [dashData, marketingData]);

  const funnelSteps = useMemo(() => [
    { label: 'Ad Impressions', value: dashData.kpis.impressions.value, color: '#0A84FF' },
    { label: 'Clicks / Sessions', value: dashData.kpis.clicks.value, color: '#64D2FF' },
    { label: 'Bookings', value: dashData.kpis.conversions.value, color: '#30D158' },
    { label: 'Revenue', value: Math.round(marketingData.revenueThisMonth), prefix: '$', color: '#FF9F0A' },
  ], [dashData, marketingData]);

  const funnelConvRates = useMemo(() => {
    const clickRate = dashData.kpis.impressions.value > 0
      ? ((dashData.kpis.clicks.value / dashData.kpis.impressions.value) * 100).toFixed(2) + '%'
      : '\u2014';
    const bookRate = dashData.kpis.clicks.value > 0
      ? ((dashData.kpis.conversions.value / dashData.kpis.clicks.value) * 100).toFixed(2) + '%'
      : '\u2014';
    return [
      { label: 'Click Rate', value: clickRate, color: '#64D2FF' },
      { label: 'Booking Rate', value: bookRate, color: '#30D158' },
    ];
  }, [dashData]);

  // Build a lookup from marketing revenue trend, keyed by date
  const revenueTrendMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of marketingData.revenueTrend) {
      map.set(r.period, r.revenue);
    }
    return map;
  }, [marketingData.revenueTrend]);

  const dailyRevenueData = useMemo(
    () => dashData.chartData.map((d) => revenueTrendMap.get(d.date as string) ?? 0),
    [dashData.chartData, revenueTrendMap],
  );
  const dailySessionsData = useMemo(
    () => dashData.chartData.map((d) => d.clicks),
    [dashData.chartData],
  );
  const chartLabels = useMemo(
    () => dashData.chartData.map((d) => d.date as string),
    [dashData.chartData],
  );

  // Channel data for donut / bars
  const donutChannels = useMemo(
    () => channelData.map((ch) => ({ name: ch.name, revenue: ch.revenue, color: ch.color })),
    [channelData],
  );
  const barChannels = useMemo(
    () => channelData.map((ch) => ({ name: ch.name, bookings: ch.bookings, color: ch.color, icon: ch.icon })),
    [channelData],
  );
  const stackedData = useMemo(
    () => channelData.map((ch) => ({ label: ch.name, revenue: ch.revenue, spend: ch.spend, color: ch.color })),
    [channelData],
  );

  return (
    <div>
      {/* 1. Header */}
      <DashboardHeader
        company={company}
        connectedPlatforms={connectedPlatforms}
        selectedPlatforms={selectedPlatforms}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        lastSyncedAt={integrations.reduce((latest, i) => {
          if (!i.last_synced_at) return latest;
          return !latest || i.last_synced_at > latest ? i.last_synced_at : latest;
        }, null as string | null)}
      />

      {/* 2. Platform filter bar + ShiftOS toggle + calendar */}
      <PlatformFilterBar
        connectedPlatforms={connectedPlatforms}
        selectedPlatforms={selectedPlatforms}
        onTogglePlatform={togglePlatform}
        onSelectAll={selectAll}
        dateRange={dateRange}
        onDateRangeChange={(r) => { setDateRange(r); setCustomStart(undefined); setCustomEnd(undefined); }}
        onCustomDateRange={handleCustomDateRange}
        customStart={customStart}
        customEnd={customEnd}
        trailingElement={
          <ShiftOSToggle enabled={shiftosAnalytics} onToggle={() => setShiftosAnalytics(prev => !prev)} />
        }
      />

      <div className="flex flex-col gap-3">
        {/* 3. HERO ROW */}
        <div className="grid gap-2" style={{ gridTemplateColumns: '1.3fr 0.7fr 1fr' }}>
          <BentoCard>
            <HeroRevenue {...revenueData} />
          </BentoCard>
          <BentoCard>
            <HeroHealth
              score={overallHealth.score}
              label={overallHealth.label}
              metricsHealthy={healthyCount}
              roas={roas}
              cpa={cpa}
            />
          </BentoCard>
          <BentoCard>
            <AiInsightsCard insights={aiInsights} />
          </BentoCard>
        </div>

        {/* 4. KPI STRIP */}
        <div className="grid grid-cols-7 gap-2">
          <KpiStripCard label="Revenue (Month)" value={`$${fmt(marketingData.revenueThisMonth)}`} accent />
          <KpiStripCard label="Revenue Today" value={`$${fmt(todayRevenue)}`} />
          <KpiStripCard label="Ad Spend" value={`$${fmt(dashData.kpis.spend.value)}`} d={dashData.kpis.spend.delta} />
          <KpiStripCard label="True ROAS" value={roas} />
          <KpiStripCard label="Clicks" value={fmt(dashData.kpis.clicks.value)} d={dashData.kpis.clicks.delta} />
          <KpiStripCard label="CPC" value={`$${fmt(dashData.kpis.cpc.value)}`} d={dashData.kpis.cpc.delta} />
          <KpiStripCard label="Bookings" value={fmt(dashData.kpis.conversions.value)} d={dashData.kpis.conversions.delta} />
        </div>

        {/* 4b. SHIFTOS ANALYTICS PANEL (toggle-able) */}
        {shiftosAnalytics && (
          <ShiftOSAnalyticsPanel companyId={company.id} />
        )}

        {/* 5. SECTION: Channel Performance */}
        <section>
          <SectionHeaderV2 icon={<BarChart3 size={16} />} title="Channel Performance" />
          <div className="grid grid-cols-3 gap-2 mb-2">
            <BentoCard>
              <RevenueDonut channels={donutChannels} />
            </BentoCard>
            <BentoCard>
              <HBarChart channels={barChannels} />
            </BentoCard>
            <BentoCard>
              <StackedBars data={stackedData} />
            </BentoCard>
          </div>
          <ChannelCards channels={channelData} />
        </section>

        {/* 6. SECTION: Full Funnel */}
        <section>
          <SectionHeaderV2 icon={<Filter size={16} />} title="Full Funnel" />
          <BentoCard>
            <FunnelSection steps={funnelSteps} conversionRates={funnelConvRates} />
          </BentoCard>
        </section>

        {/* 7. SECTION: Revenue & Traffic */}
        <section>
          <SectionHeaderV2 icon={<DollarSign size={16} />} title="Revenue & Traffic" />
          <div className="grid grid-cols-2 gap-2">
            <BentoCard>
              <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Daily Revenue
              </p>
              <AreaChartSvg data={dailyRevenueData} color="#30D158" labels={chartLabels} />
            </BentoCard>
            <BentoCard>
              <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Daily Sessions
              </p>
              <AreaChartSvg data={dailySessionsData} color="#0A84FF" labels={chartLabels} />
            </BentoCard>
          </div>
        </section>

        {/* 8a. SECTION: Customer Attribution Summary */}
        <section>
          <SectionHeaderV2 icon={<Route size={16} />} title="Customer Attribution" />
          <BentoCard>
            {(() => {
              const entries = Object.entries(attributionData ?? {});
              const total = entries.reduce((sum, [, v]) => sum + (v ?? 0), 0);
              if (entries.length === 0 || total === 0) {
                return (
                  <p className="text-xs py-6 text-center" style={{ color: 'var(--text-tertiary)' }}>
                    No attribution data yet. Connect UTM tracking to see source breakdown.
                  </p>
                );
              }
              const sorted = [...entries].sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0));
              const SOURCE_LABELS: Record<string, string> = {
                meta_ad: 'Meta Ads',
                direct: 'Direct',
                unknown: 'Unknown',
                google_ad: 'Google Ads',
                organic: 'Organic',
                referral: 'Referral',
                email: 'Email',
              };
              const SOURCE_COLORS: Record<string, string> = {
                meta_ad: '#0A84FF',
                direct: '#30D158',
                unknown: '#636366',
                google_ad: '#FF9F0A',
                organic: '#BF5AF2',
                referral: '#FF375F',
                email: '#64D2FF',
              };
              return (
                <div className="space-y-2">
                  {sorted.map(([key, count]) => {
                    const pct = total > 0 ? ((count ?? 0) / total) * 100 : 0;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-[11px] w-20 shrink-0 truncate" style={{ color: 'var(--text-secondary)' }}>
                          {SOURCE_LABELS[key] ?? key}
                        </span>
                        <div className="flex-1 h-5 rounded-md overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                          <div
                            className="h-full rounded-md transition-all"
                            style={{
                              width: `${Math.max(pct, 2)}%`,
                              background: SOURCE_COLORS[key] ?? '#8E8E93',
                            }}
                          />
                        </div>
                        <span className="text-[11px] w-14 text-right tabular-nums" style={{ color: 'var(--text-primary)' }}>
                          {pct.toFixed(0)}% ({count ?? 0})
                        </span>
                      </div>
                    );
                  })}
                  <p className="text-[10px] pt-1" style={{ color: 'var(--text-tertiary)' }}>
                    {total} total conversions · last 30 days
                  </p>
                </div>
              );
            })()}
          </BentoCard>
        </section>

        {/* 8b. SECTION: Pixel Health Monitor */}
        <section>
          <SectionHeaderV2 icon={<Radio size={16} />} title="Pixel Health Monitor" />
          <BentoCard>
            {pixelHealth == null ? (
              <p className="text-xs py-6 text-center" style={{ color: 'var(--text-tertiary)' }}>
                Loading pixel health data…
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {/* CAPI Health */}
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <Activity size={18} style={{
                    color: (pixelHealth.capi_health ?? '').toLowerCase() === 'good' ? '#30D158'
                      : (pixelHealth.capi_health ?? '').toLowerCase() === 'degraded' ? '#FF9F0A'
                      : '#FF375F',
                  }} />
                  <span className="text-sm font-semibold capitalize" style={{ color: 'var(--text-primary)' }}>
                    {pixelHealth.capi_health ?? 'Unknown'}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>CAPI Status</span>
                </div>

                {/* Match Quality Score */}
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <div className="relative w-10 h-10">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15" fill="none" stroke="var(--bg-tertiary)" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15" fill="none"
                        stroke={(pixelHealth.match_quality_score ?? 0) >= 7 ? '#30D158' : (pixelHealth.match_quality_score ?? 0) >= 4 ? '#FF9F0A' : '#FF375F'}
                        strokeWidth="3"
                        strokeDasharray={`${((pixelHealth.match_quality_score ?? 0) / 10) * 94.25} 94.25`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>
                      {(pixelHealth.match_quality_score ?? 0).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Match Quality</span>
                </div>

                {/* Event Match Rate */}
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {((pixelHealth.event_match_rate ?? 0) * 100).toFixed(0)}%
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Event Match Rate</span>
                </div>

                {/* Events Last 24h */}
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {(pixelHealth.events_last_24h ?? 0).toLocaleString()}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Events (24h)</span>
                </div>
              </div>
            )}
            {pixelHealth?.last_event_time && (
              <p className="text-[10px] pt-2 text-center" style={{ color: 'var(--text-tertiary)' }}>
                Last event: {new Date(pixelHealth.last_event_time).toLocaleString()}
              </p>
            )}
          </BentoCard>
        </section>

        {/* 9. SECTION: Recent Bookings — live from ShiftOS */}
        <section>
          <SectionHeaderV2 icon={<Receipt size={16} />} title="Recent Bookings" />
          <RecentBookingsLive />
        </section>

        {/* 10. Instagram Section */}
        {sessionToken && (
          <InstagramSection companyId={company.id} accessToken={sessionToken} />
        )}

        {/* 11. Daily Breakdown Table */}
        <section>
          <SectionHeaderV2 icon={<Users size={16} />} title="Daily Breakdown" />
          <BentoCard>
            <DailyBreakdownTable
              chartData={dashData.chartData}
              activePlatforms={dashData.activePlatforms}
              showOverlay={dashData.showOverlay}
            />
          </BentoCard>
        </section>

        {/* 12. Footer */}
        <footer className="text-center py-4">
          <p className="text-[10px]" style={{ color: 'var(--text-quaternary)' }}>
            Karbon Agency Dashboard &middot; Data refreshed in real-time
          </p>
        </footer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI strip card — compact single-metric card
// ---------------------------------------------------------------------------

function KpiStripCard({ label, value, d, accent }: {
  label: string; value: string; d?: { value: number; isUp: boolean }; accent?: boolean;
}) {
  return (
    <BentoCard className="py-2 px-3" style={accent ? { borderColor: 'var(--system-green)', borderWidth: '1.5px' } : undefined}>
      <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: accent ? 'var(--system-green)' : 'var(--text-quaternary)' }}>{label}</p>
      <p className="text-sm font-bold tabular-nums leading-tight" style={{ color: accent ? 'var(--system-green)' : 'var(--text-primary)' }}>{value}</p>
      {d && d.value > 0 && (
        <span className="text-[8px] font-semibold inline-flex items-center gap-0.5" style={{ color: d.isUp ? 'var(--system-green)' : 'var(--system-red)' }}>
          {d.isUp ? <TrendingUp size={7} /> : <TrendingDown size={7} />}
          {d.value.toFixed(1)}%
        </span>
      )}
    </BentoCard>
  );
}

// ---------------------------------------------------------------------------
// Live bookings fetcher — calls /api/shiftos/recent
// ---------------------------------------------------------------------------

function RecentBookingsLive() {
  const [bookings, setBookings] = useState<Array<{
    id: string; time: string; source: string;
    customer: string; package: string; paid: boolean;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/shiftos/recent')
      .then(res => res.json())
      .then(data => setBookings(data.reservations ?? []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <BentoCard>
        <p className="text-xs py-4 text-center" style={{ color: 'var(--text-tertiary)' }}>Loading recent bookings...</p>
      </BentoCard>
    );
  }

  return <RecentTransactions bookings={bookings} />;
}
