"use client";

import { useState, useCallback, useTransition } from "react";
import {
  getCampaignReportingSnapshot,
  triggerCampaignMetaSync,
} from "@/lib/actions/reporting";
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

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CampaignReportingProps {
  readonly campaignId: string;
  readonly clientId: string;
  readonly adAccountId: string;
  readonly isAdmin: boolean;
  readonly initialKpi: ReportingKpiData;
  readonly initialDaily: readonly DailyMetrics[];
  readonly initialCampaigns: readonly CampaignRow[];
  readonly initialDemographics: readonly DemographicDataPoint[];
  readonly initialPlacements: readonly PlacementDataPoint[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildSpendData(
  daily: readonly DailyMetrics[]
): readonly SpendDataPoint[] {
  return daily.map((m) => ({
    date: m.date,
    spend: Number(m.spend),
    impressions: m.impressions,
  }));
}

// ---------------------------------------------------------------------------
// Sync Button (admin-only)
// ---------------------------------------------------------------------------

function SyncButton({
  clientId,
  adAccountId,
  onSyncComplete,
}: {
  readonly clientId: string;
  readonly adAccountId: string;
  readonly onSyncComplete: () => void;
}) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSync = useCallback(async () => {
    setIsSyncing(true);
    setSyncResult(null);
    try {
      const result = await triggerCampaignMetaSync(clientId, adAccountId);
      setSyncResult({
        success: result.success,
        message: result.success
          ? `Synced ${result.rowsSynced} days of data`
          : result.error ?? "Sync failed",
      });
      if (result.success) {
        onSyncComplete();
      }
    } catch {
      setSyncResult({
        success: false,
        message: "Unexpected error during sync",
      });
    } finally {
      setIsSyncing(false);
    }
  }, [clientId, adAccountId, onSyncComplete]);

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleSync}
        disabled={isSyncing}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSyncing ? (
          <>
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Syncing...
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182"
              />
            </svg>
            Sync Meta Data
          </>
        )}
      </button>

      {syncResult && (
        <span
          className={`text-sm ${
            syncResult.success ? "text-green-600" : "text-red-600"
          }`}
        >
          {syncResult.message}
        </span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main campaign reporting component
// ---------------------------------------------------------------------------

export default function CampaignReporting({
  campaignId: _campaignId,
  clientId,
  adAccountId,
  isAdmin,
  initialKpi,
  initialDaily,
  initialCampaigns,
  initialDemographics,
  initialPlacements,
}: CampaignReportingProps) {
  const [kpi, setKpi] = useState<ReportingKpiData>(initialKpi);
  const [spendData, setSpendData] = useState<readonly SpendDataPoint[]>(
    buildSpendData(initialDaily)
  );
  const [campaigns, setCampaigns] =
    useState<readonly CampaignRow[]>(initialCampaigns);
  const [demographics, setDemographics] =
    useState<readonly DemographicDataPoint[]>(initialDemographics);
  const [placements, setPlacements] =
    useState<readonly PlacementDataPoint[]>(initialPlacements);
  const [isPending, startTransition] = useTransition();
  const [currentRange, setCurrentRange] = useState<DateRange>(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);
    return {
      since: thirtyDaysAgo.toISOString().split("T")[0],
      until: now.toISOString().split("T")[0],
    };
  });

  // Suppress unused variable warning -- campaignId is accepted for future use
  void _campaignId;

  const refreshData = useCallback(
    (range: DateRange) => {
      startTransition(async () => {
        const snapshot = await getCampaignReportingSnapshot(
          clientId,
          adAccountId,
          range.since,
          range.until
        );
        setKpi(snapshot.kpi);
        setSpendData(buildSpendData(snapshot.daily));
        setCampaigns(snapshot.campaigns);
        setDemographics(snapshot.demographics);
        setPlacements(snapshot.placements);
      });
    },
    [clientId, adAccountId]
  );

  const handleDateChange = useCallback(
    (range: DateRange) => {
      setCurrentRange(range);
      refreshData(range);
    },
    [refreshData]
  );

  const handleSyncComplete = useCallback(() => {
    refreshData(currentRange);
  }, [currentRange, refreshData]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">
            Meta Reporting
          </h2>
          <p className="text-sm text-gray-500">
            Meta Ads performance for this project&apos;s ad account.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {isAdmin && (
            <SyncButton
              clientId={clientId}
              adAccountId={adAccountId}
              onSyncComplete={handleSyncComplete}
            />
          )}
          <DateRangePicker defaultDays={30} onChange={handleDateChange} />
        </div>
      </div>

      {/* Loading overlay */}
      <div
        className={
          isPending
            ? "opacity-60 pointer-events-none transition-opacity"
            : "transition-opacity"
        }
      >
        {/* KPI Grid */}
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Key Metrics
          </h3>
          <ReportingKpiGrid metrics={kpi} />
        </section>

        {/* Spend Overview Chart */}
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Daily Spend & Impressions
          </h3>
          <SpendOverviewChart data={spendData} />
        </section>

        {/* Campaign Breakdown */}
        <section className="mb-8">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Campaign Breakdown
          </h3>
          <CampaignBreakdownTable campaigns={campaigns} />
        </section>

        {/* Demographics & Placements side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <section>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Demographics (Age & Gender)
            </h3>
            <DemographicsChart data={demographics} />
          </section>

          <section>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Platform Placements
            </h3>
            <PlacementChart data={placements} />
          </section>
        </div>
      </div>
    </div>
  );
}
