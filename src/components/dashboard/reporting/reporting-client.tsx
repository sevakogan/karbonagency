"use client";

import { useState, useCallback, useTransition } from "react";
import { getClientMetrics } from "@/lib/actions/metrics";
import DateRangePicker, {
  type DateRange,
} from "@/components/dashboard/reporting/date-range-picker";
import ReportingKpiGrid, {
  type ReportingKpiData,
} from "@/components/dashboard/reporting/reporting-kpi-grid";
import SpendOverviewChart, {
  type SpendDataPoint,
} from "@/components/dashboard/reporting/spend-overview-chart";
import CampaignBreakdownTable, {
  type CampaignRow,
} from "@/components/dashboard/reporting/campaign-breakdown-table";
import DemographicsChart, {
  type DemographicDataPoint,
} from "@/components/dashboard/reporting/demographics-chart";
import PlacementChart, {
  type PlacementDataPoint,
} from "@/components/dashboard/reporting/placement-chart";
import type { DailyMetrics } from "@/types";

interface ReportingClientProps {
  clientId: string;
  initialKpi: ReportingKpiData;
  initialDaily: readonly DailyMetrics[];
  initialCampaigns: readonly CampaignRow[];
  initialDemographics: readonly DemographicDataPoint[];
  initialPlacements: readonly PlacementDataPoint[];
}

function buildKpiFromDaily(daily: readonly DailyMetrics[]): ReportingKpiData {
  if (daily.length === 0) {
    return {
      spend: 0,
      impressions: 0,
      clicks: 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      conversions: 0,
      roas: null,
      leads: 0,
    };
  }

  const spend = daily.reduce((s, m) => s + Number(m.spend), 0);
  const impressions = daily.reduce((s, m) => s + m.impressions, 0);
  const clicks = daily.reduce((s, m) => s + m.clicks, 0);
  const conversions = daily.reduce((s, m) => s + m.conversions, 0);
  const leads = daily.reduce((s, m) => s + m.leads, 0);

  const roasValues = daily.filter(
    (m) => m.roas !== null && m.roas > 0
  );
  const avgRoas =
    roasValues.length > 0
      ? roasValues.reduce((s, m) => s + (m.roas ?? 0), 0) / roasValues.length
      : null;

  return {
    spend,
    impressions,
    clicks,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    conversions,
    roas: avgRoas,
    leads,
  };
}

function buildSpendData(
  daily: readonly DailyMetrics[]
): readonly SpendDataPoint[] {
  return daily.map((m) => ({
    date: m.date,
    spend: Number(m.spend),
    impressions: m.impressions,
  }));
}

export default function ReportingClient({
  clientId,
  initialKpi,
  initialDaily,
  initialCampaigns,
  initialDemographics,
  initialPlacements,
}: ReportingClientProps) {
  const [kpi, setKpi] = useState<ReportingKpiData>(initialKpi);
  const [spendData, setSpendData] = useState<readonly SpendDataPoint[]>(
    buildSpendData(initialDaily)
  );
  const [campaigns] = useState<readonly CampaignRow[]>(initialCampaigns);
  const [demographics] = useState<readonly DemographicDataPoint[]>(
    initialDemographics
  );
  const [placements] = useState<readonly PlacementDataPoint[]>(
    initialPlacements
  );
  const [isPending, startTransition] = useTransition();

  const handleDateChange = useCallback(
    (range: DateRange) => {
      startTransition(async () => {
        const metrics = await getClientMetrics(
          clientId,
          range.since,
          range.until
        );
        const newKpi = buildKpiFromDaily(metrics.daily);
        setKpi(newKpi);
        setSpendData(buildSpendData(metrics.daily));
      });
    },
    [clientId]
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Reporting</h1>
          <p className="text-sm text-gray-500">
            Meta Ads performance overview across all campaigns.
          </p>
        </div>
        <DateRangePicker defaultDays={30} onChange={handleDateChange} />
      </div>

      {/* Loading overlay */}
      <div className={isPending ? "opacity-60 pointer-events-none transition-opacity" : "transition-opacity"}>
        {/* KPI Grid */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Key Metrics
          </h2>
          <ReportingKpiGrid metrics={kpi} />
        </section>

        {/* Spend Overview Chart */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Daily Spend & Impressions
          </h2>
          <SpendOverviewChart data={spendData} />
        </section>

        {/* Campaign Breakdown */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Campaign Breakdown
          </h2>
          <CampaignBreakdownTable campaigns={campaigns} />
        </section>

        {/* Demographics & Placements side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Demographics (Age & Gender)
            </h2>
            <DemographicsChart data={demographics} />
          </section>

          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Platform Placements
            </h2>
            <PlacementChart data={placements} />
          </section>
        </div>
      </div>
    </div>
  );
}
