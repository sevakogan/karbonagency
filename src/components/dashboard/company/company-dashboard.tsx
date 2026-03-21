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
      <div className="grid grid-cols-12 gap-2">
        {/* Row 1: Health score + KPIs in one compact strip */}
        <BentoCard colSpan={12} className="py-2 px-3">
          <div className="flex items-center gap-4">
            <HealthScoreRing context={dashData.kpis._context} />
            <div className="h-8 w-px" style={{ background: 'var(--separator)' }} />
            <div className="grid grid-cols-6 gap-3 flex-1">
              <KpiInline label="Ad Spend" value={`$${fmt(dashData.kpis.spend.value)}`} d={dashData.kpis.spend.delta} />
              <KpiInline label="Impressions" value={fmt(dashData.kpis.impressions.value)} d={dashData.kpis.impressions.delta} />
              <KpiInline label="Clicks" value={fmt(dashData.kpis.clicks.value)} d={dashData.kpis.clicks.delta} />
              <KpiInline label="Conversions" value={fmt(dashData.kpis.conversions.value)} d={dashData.kpis.conversions.delta} />
              <KpiInline label="CTR" value={`${dashData.kpis.ctr.value.toFixed(1)}%`} d={dashData.kpis.ctr.delta} />
              <KpiInline label="CPC" value={`$${fmt(dashData.kpis.cpc.value)}`} d={dashData.kpis.cpc.delta} />
            </div>
          </div>
        </BentoCard>

        {/* Row 2: Bookings Attribution (col-4) + Spend Trend (col-8) */}
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

        <BentoCard colSpan={8}>
          <SpendTrendChart chartData={dashData.chartData} activePlatforms={dashData.activePlatforms} showOverlay={dashData.showOverlay} activeColor={activeColor} />
        </BentoCard>

        {/* Row 3: Donut + Clicks/Conv + Efficiency — all in one row */}
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

        <BentoCard colSpan={4} className="py-2.5">
          <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>💰 Efficiency</p>
          <div className="space-y-2">
            <EfficiencyStat label="Reach" value={fmt(dashData.kpis.reach.value)} d={dashData.kpis.reach.delta} />
            <EfficiencyStat
              label="Cost / Conv"
              value={dashData.kpis.conversions.value > 0 ? `$${(dashData.kpis.spend.value / dashData.kpis.conversions.value).toFixed(2)}` : '—'}
            />
            <EfficiencyStat
              label="CPM"
              value={`$${dashData.kpis.impressions.value > 0 ? ((dashData.kpis.spend.value / dashData.kpis.impressions.value) * 1000).toFixed(2) : '0.00'}`}
            />
            <EfficiencyStat
              label="Frequency"
              value={dashData.kpis.reach.value > 0 ? `${(dashData.kpis.impressions.value / dashData.kpis.reach.value).toFixed(1)}x` : '—'}
            />
          </div>
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

function KpiInline({ label, value, d }: {
  label: string; value: string; d: { value: number; isUp: boolean };
}) {
  return (
    <div>
      <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-quaternary)' }}>{label}</p>
      <p className="text-sm font-bold tabular-nums leading-tight" style={{ color: 'var(--text-primary)' }}>{value}</p>
      {d.value > 0 && (
        <span className="text-[8px] font-semibold inline-flex items-center gap-0.5" style={{ color: d.isUp ? 'var(--system-green)' : 'var(--system-red)' }}>
          {d.isUp ? <TrendingUp size={7} /> : <TrendingDown size={7} />}
          {d.value.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

function KpiCardMini({ label, value, format, d }: {
  label: string; value: number; format: 'currency' | 'number' | 'pct';
  d: { value: number; isUp: boolean };
}) {
  return (
    <BentoCard colSpan={2} className="py-2.5 px-3">
      <p className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
      <p className="text-base font-bold tabular-nums leading-tight mt-0.5" style={{ color: 'var(--text-primary)' }}>
        {format === 'currency' ? `$${fmt(value)}` : format === 'pct' ? `${value.toFixed(1)}%` : fmt(value)}
      </p>
      {d.value > 0 && (
        <span className="text-[9px] font-semibold inline-flex items-center gap-0.5" style={{ color: d.isUp ? 'var(--system-green)' : 'var(--system-red)' }}>
          {d.isUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
          {d.value.toFixed(1)}%
        </span>
      )}
    </BentoCard>
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

function EfficiencyStat({ label, value, d }: {
  label: string; value: string; d?: { value: number; isUp: boolean };
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</span>
        {d && d.value > 0 && (
          <span className="text-[8px] font-semibold" style={{ color: d.isUp ? 'var(--system-green)' : 'var(--system-red)' }}>
            {d.isUp ? '↑' : '↓'}{d.value.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
}
