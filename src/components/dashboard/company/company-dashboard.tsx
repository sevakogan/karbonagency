'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { TrendingUp, TrendingDown, BarChart3, Filter, DollarSign, Route, Users, Receipt } from 'lucide-react';
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

  // --- Derived data for V2 sections ---

  const overallHealth = scoreMetric('overall', 0, dashData.kpis._context);
  const healthyCount = [
    dashData.kpis.ctr.value > 1.5 ? 1 : 0,
    dashData.kpis.cpc.value > 0 && dashData.kpis.cpc.value < 1.5 ? 1 : 0,
    dashData.kpis.conversions.value > 0 ? 1 : 0,
    dashData.kpis.reach.value > 0 ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const roas = dashData.kpis.spend.value > 0
    ? `${((dashData.kpis.conversions.value * 136) / dashData.kpis.spend.value).toFixed(1)}x`
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
    if (dashData.kpis.spend.value > 0) {
      const estRoas = dashData.kpis.conversions.value > 0
        ? ((dashData.kpis.conversions.value * 136) / dashData.kpis.spend.value).toFixed(1)
        : '0';
      insights.push({
        type: 'forecast', confidence: 0.71,
        text: `Estimated ROAS: ${estRoas}x based on $136 avg ticket`,
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
  }, [dashData]);

  const channelData = useMemo(() => {
    return dashData.platformBreakdown.map((p) => ({
      name: p.name,
      icon: PLATFORM_ICONS[p.slug] ?? '\u{1F4CA}',
      spend: p.spend,
      clicks: p.clicks,
      sessions: p.clicks,
      bookings: p.conversions,
      revenue: p.conversions * 136,
      color: PLATFORM_COLORS[p.slug] ?? '#888',
      daily: dashData.chartData.map((d) => (d[`clicks_${p.slug}`] as number) ?? 0),
      ctr: p.impressions > 0 ? `${((p.clicks / p.impressions) * 100).toFixed(1)}%` : '\u2014',
      cvr: p.clicks > 0 ? `${((p.conversions / p.clicks) * 100).toFixed(2)}%` : '\u2014',
      trend: dashData.kpis.clicks.delta.isUp
        ? `+${dashData.kpis.clicks.delta.value.toFixed(0)}%`
        : `-${dashData.kpis.clicks.delta.value.toFixed(0)}%`,
    }));
  }, [dashData]);

  const funnelSteps = useMemo(() => [
    { label: 'Ad Impressions', value: dashData.kpis.impressions.value, color: '#0A84FF' },
    { label: 'Clicks / Sessions', value: dashData.kpis.clicks.value, color: '#64D2FF' },
    { label: 'Bookings', value: dashData.kpis.conversions.value, color: '#30D158' },
    { label: 'Est. Revenue', value: Math.round(dashData.kpis.conversions.value * 136), prefix: '$', color: '#FF9F0A' },
  ], [dashData]);

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

  const dailyRevenueData = useMemo(
    () => dashData.chartData.map((d) => d.conversions * 136),
    [dashData.chartData],
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

  // --- Mock data for sections not yet connected to real sources ---

  // TODO: Replace with real Square + ShiftOS revenue data
  const mockRevenue = {
    totalRevenue: dashData.kpis.conversions.value * 136,
    shiftOSRevenue: Math.round(dashData.kpis.conversions.value * 136 * 0.72),
    squareRevenue: Math.round(dashData.kpis.conversions.value * 136 * 0.28),
    transactions: dashData.kpis.conversions.value,
    avgTicket: 136,
  };

  // TODO: Replace with real customer journey data from attribution tracking
  const mockJourneySteps = [
    { time: '2h ago', channel: 'Meta Ads', action: 'Clicked "Weekend Racing Special" ad', device: 'iPhone 15', status: 'session' as const },
    { time: '1h ago', channel: 'Google', action: 'Searched "sim racing near me"', device: 'iPhone 15', status: 'intent' as const },
    { time: '45m ago', channel: 'Direct', action: 'Visited booking page', device: 'iPhone 15', status: 'intent' as const },
    { time: '30m ago', channel: 'Shift OS', action: 'Booked 2-hour group session', device: 'iPhone 15', status: 'booked' as const },
    { time: '30m ago', channel: 'Square', action: '$272 payment processed', device: 'POS Terminal', status: 'revenue' as const },
  ];

  // TODO: Replace with real transaction data from Square + ShiftOS APIs
  const mockTransactions = [
    { time: '30m ago', source: 'Shift OS' as const, customer: 'Mike R.', amount: 272, package: '2hr Group Session', channel: 'Meta Ads', confidence: 0.92 },
    { time: '1h ago', source: 'Square' as const, customer: 'Sarah L.', amount: 136, package: '1hr Solo Session', channel: 'Google Ads', confidence: 0.78 },
    { time: '3h ago', source: 'Shift OS' as const, customer: 'James K.', amount: 408, package: '3hr Party Package', channel: 'Instagram', confidence: 0.65 },
  ];

  return (
    <div>
      {/* 1. Header */}
      <DashboardHeader
        company={company}
        connectedPlatforms={connectedPlatforms}
        selectedPlatforms={selectedPlatforms}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {/* 2. Platform filter bar + calendar */}
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
      />

      <div className="flex flex-col gap-3">
        {/* 3. HERO ROW */}
        <div className="grid gap-2" style={{ gridTemplateColumns: '1.3fr 0.7fr 1fr' }}>
          <BentoCard>
            <HeroRevenue {...mockRevenue} />
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
        <div className="grid grid-cols-6 gap-2">
          <KpiStripCard label="Ad Spend" value={`$${fmt(dashData.kpis.spend.value)}`} d={dashData.kpis.spend.delta} />
          <KpiStripCard label="Impressions" value={fmt(dashData.kpis.impressions.value)} d={dashData.kpis.impressions.delta} />
          <KpiStripCard label="Clicks" value={fmt(dashData.kpis.clicks.value)} d={dashData.kpis.clicks.delta} />
          <KpiStripCard label="CTR" value={`${dashData.kpis.ctr.value.toFixed(1)}%`} d={dashData.kpis.ctr.delta} />
          <KpiStripCard label="CPC" value={`$${fmt(dashData.kpis.cpc.value)}`} d={dashData.kpis.cpc.delta} />
          <KpiStripCard label="Bookings" value={fmt(dashData.kpis.conversions.value)} d={dashData.kpis.conversions.delta} />
        </div>

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
                Daily Revenue (est.)
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

        {/* 8. SECTION: Customer Journey */}
        <section>
          <SectionHeaderV2 icon={<Route size={16} />} title="Customer Journey" />
          <BentoCard>
            <CustomerJourney steps={mockJourneySteps} />
          </BentoCard>
        </section>

        {/* 9. SECTION: Recent Transactions */}
        <section>
          <SectionHeaderV2 icon={<Receipt size={16} />} title="Recent Transactions" />
          <RecentTransactions transactions={mockTransactions} />
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

function KpiStripCard({ label, value, d }: {
  label: string; value: string; d: { value: number; isUp: boolean };
}) {
  return (
    <BentoCard className="py-2 px-3">
      <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-quaternary)' }}>{label}</p>
      <p className="text-sm font-bold tabular-nums leading-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {d.value > 0 && (
        <span className="text-[8px] font-semibold inline-flex items-center gap-0.5" style={{ color: d.isUp ? 'var(--system-green)' : 'var(--system-red)' }}>
          {d.isUp ? <TrendingUp size={7} /> : <TrendingDown size={7} />}
          {d.value.toFixed(1)}%
        </span>
      )}
    </BentoCard>
  );
}
