'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Company, CompanyIntegration } from '@/types';
import { useDashboardData, type DailyRow, type DateRange } from '@/lib/dashboard/use-dashboard-data';
import { PLATFORM_COLORS, normSlug } from '@/lib/dashboard/platform-config';
import { scoreMetric, type AiScore } from '@/lib/dashboard/ai-scoring';
import { fmt } from '@/lib/dashboard/format-utils';

import { BentoCard } from './bento-card';
import { DashboardHeader } from './dashboard-header';
import { PlatformFilterBar } from './platform-filter-bar';
import { HealthScoreRing } from './health-score-ring';
import { ScoreBadge } from './score-badge';
import { SpendTrendChart } from './spend-trend-chart';
import { ClicksConversionsChart } from './clicks-conversions-chart';
import { PlatformDonut } from './platform-donut';
import { WeeklySpendBars } from './weekly-spend-bars';
import { DailyBreakdownTable } from './daily-breakdown-table';
import { BookingsAttribution } from './bookings-attribution';
import { InstagramSection } from '@/components/dashboard/instagram-section';

interface Props {
  company: Company;
  integrations: CompanyIntegration[];
  dailyMetrics: DailyRow[];
}

export function CompanyDashboard({ company, integrations, dailyMetrics }: Props) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<DateRange>('today');
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
  });

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

  const activeColor =
    !dashData.isAllSelected && selectedPlatforms.size === 1
      ? (PLATFORM_COLORS[[...selectedPlatforms][0]] ?? '#E02030')
      : '#E02030';

  return (
    <div>
      <DashboardHeader
        company={company}
        connectedPlatforms={connectedPlatforms}
        selectedPlatforms={selectedPlatforms}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      <PlatformFilterBar
        connectedPlatforms={connectedPlatforms}
        selectedPlatforms={selectedPlatforms}
        onTogglePlatform={togglePlatform}
        onSelectAll={selectAll}
        dateRange={dateRange}
        onDateRangeChange={setDateRange}
      />

      {/* 12-column bento grid */}
      <div className="grid grid-cols-12 gap-2.5">
        {/* Health Score Ring */}
        <BentoCard colSpan={12}>
          <HealthScoreRing context={dashData.kpis._context} />
        </BentoCard>

        {/* Section: Performance Overview — 6 compact cards */}
        <SectionHeader icon="📊" title="Performance Overview" />

        <KpiCard label="Ad Spend" value={dashData.kpis.spend.value} format="currency" d={dashData.kpis.spend.delta} colSpan={2} />
        <KpiCard label="Impressions" value={dashData.kpis.impressions.value} format="number" d={dashData.kpis.impressions.delta} colSpan={2} />
        <KpiCard label="Clicks" value={dashData.kpis.clicks.value} format="number" d={dashData.kpis.clicks.delta} colSpan={2} />
        <KpiCard label="Conversions" value={dashData.kpis.conversions.value} format="number" d={dashData.kpis.conversions.delta} colSpan={2} />
        <KpiCard label="CTR" value={dashData.kpis.ctr.value} format="pct" d={dashData.kpis.ctr.delta} scoreKey="ctr" colSpan={2} context={dashData.kpis._context} />
        <KpiCard label="CPC" value={dashData.kpis.cpc.value} format="currency" d={dashData.kpis.cpc.delta} scoreKey="cpc" colSpan={2} context={dashData.kpis._context} />

        {/* Section: Trends */}
        <SectionHeader icon="📈" title="Trends" />

        <BentoCard colSpan={8}>
          <SpendTrendChart chartData={dashData.chartData} activePlatforms={dashData.activePlatforms} showOverlay={dashData.showOverlay} activeColor={activeColor} />
        </BentoCard>

        <BentoCard colSpan={4}>
          <BookingsAttribution
            reservations={dashData.kpis.conversions.value}
            platformMetrics={dashData.platformBreakdown.map((p) => ({
              platform: p.slug,
              clicks: p.clicks,
              conversions: p.conversions,
              spend: p.spend,
            }))}
          />
        </BentoCard>

        <BentoCard colSpan={4}>
          <PlatformDonut breakdown={dashData.platformBreakdown} />
        </BentoCard>

        <BentoCard colSpan={4}>
          <ClicksConversionsChart
            chartData={dashData.chartData}
            activePlatforms={dashData.activePlatforms}
            showOverlay={dashData.showOverlay}
            activeColor={activeColor}
            conversionScore={scoreMetric('conversion_rate', 0, dashData.kpis._context)}
          />
        </BentoCard>

        <BentoCard colSpan={4}>
          <WeeklySpendBars data={dashData.weeklySpend} />
        </BentoCard>

        {/* Section: Efficiency & ROI */}
        <SectionHeader icon="💰" title="Efficiency & ROI" />

        <KpiCard label="Reach" value={dashData.kpis.reach.value} format="number" d={dashData.kpis.reach.delta} scoreKey="reach_efficiency" colSpan={3} context={dashData.kpis._context} />

        <BentoCard colSpan={3}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Cost / Conversion</p>
          <p className="text-[22px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {dashData.kpis.conversions.value > 0 ? `$${(dashData.kpis.spend.value / dashData.kpis.conversions.value).toFixed(2)}` : '—'}
          </p>
          <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-quaternary)' }}>per conversion</p>
        </BentoCard>

        <BentoCard colSpan={3}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>CPM</p>
          <p className="text-[22px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            ${dashData.kpis.impressions.value > 0 ? ((dashData.kpis.spend.value / dashData.kpis.impressions.value) * 1000).toFixed(2) : '0.00'}
          </p>
          <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-quaternary)' }}>per 1,000 impressions</p>
          <ScoreBadge score={scoreMetric('cpm', 0, dashData.kpis._context)} />
        </BentoCard>

        <BentoCard colSpan={3}>
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>Frequency</p>
          <p className="text-[22px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
            {dashData.kpis.reach.value > 0 ? (dashData.kpis.impressions.value / dashData.kpis.reach.value).toFixed(1) : '—'}
          </p>
          <p className="text-[9px] mt-0.5" style={{ color: 'var(--text-quaternary)' }}>avg views per person</p>
          <ScoreBadge score={scoreMetric('reach_efficiency', 0, dashData.kpis._context)} />
        </BentoCard>

        {/* Instagram Section */}
        {sessionToken && (
          <div className="col-span-12">
            <InstagramSection companyId={company.id} accessToken={sessionToken} />
          </div>
        )}

        {/* Section: Daily Breakdown */}
        <SectionHeader icon="📅" title="Daily Breakdown" />

        <div className="col-span-12">
          <BentoCard colSpan={12}>
            <DailyBreakdownTable
              chartData={dashData.chartData}
              activePlatforms={dashData.activePlatforms}
              showOverlay={dashData.showOverlay}
            />
          </BentoCard>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Internal sub-components
// ---------------------------------------------------------------------------

function SectionHeader({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="col-span-12 flex items-center gap-1.5 pt-2">
      <span className="text-sm">{icon}</span>
      <h3 className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{title}</h3>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  format: 'currency' | 'number' | 'pct';
  d: { value: number; isUp: boolean };
  scoreKey?: string;
  colSpan?: 2 | 3 | 4;
  context?: { spend: number; impressions: number; clicks: number; conversions: number };
}

function KpiCard({ label, value, format, d, scoreKey, colSpan = 2, context }: KpiCardProps) {
  const score = scoreKey && context ? scoreMetric(scoreKey, value, context) : null;

  return (
    <BentoCard colSpan={colSpan}>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-[22px] font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {format === 'currency' ? `$${fmt(value)}` : format === 'pct' ? `${value.toFixed(1)}%` : fmt(value)}
      </p>
      {d.value > 0 && (
        <span className="text-[10px] font-semibold inline-flex items-center gap-0.5" style={{ color: d.isUp ? 'var(--system-green)' : 'var(--system-red)' }}>
          {d.isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {d.value.toFixed(1)}%
        </span>
      )}
      {score && <ScoreBadge score={score} />}
    </BentoCard>
  );
}
