"use client";

import { useState, useMemo, useCallback } from "react";
import type { DailyMetrics } from "@/types";
import DailySpendChart from "./daily-spend-chart";
import ConversionsChart from "./conversions-chart";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CampaignInfo {
  readonly id: string;
  readonly name: string;
}

interface Props {
  readonly metrics: readonly DailyMetrics[];
  readonly campaigns: readonly CampaignInfo[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Aggregate multiple rows for the same date into one combined row */
function aggregateByDate(rows: readonly DailyMetrics[]): DailyMetrics[] {
  const byDate = new Map<string, DailyMetrics>();

  for (const row of rows) {
    const existing = byDate.get(row.date);
    if (!existing) {
      byDate.set(row.date, { ...row });
      continue;
    }

    // Sum all additive metrics
    const merged: DailyMetrics = {
      ...existing,
      spend: Number(existing.spend) + Number(row.spend),
      impressions: existing.impressions + row.impressions,
      reach: existing.reach + row.reach,
      clicks: existing.clicks + row.clicks,
      conversions: existing.conversions + row.conversions,
      video_views: existing.video_views + row.video_views,
      leads: existing.leads + row.leads,
      link_clicks: existing.link_clicks + row.link_clicks,
      // Recalculate derived metrics
      ctr:
        existing.impressions + row.impressions > 0
          ? ((existing.clicks + row.clicks) /
              (existing.impressions + row.impressions)) *
            100
          : 0,
      cpc:
        existing.clicks + row.clicks > 0
          ? (Number(existing.spend) + Number(row.spend)) /
            (existing.clicks + row.clicks)
          : 0,
      cpm:
        existing.impressions + row.impressions > 0
          ? ((Number(existing.spend) + Number(row.spend)) /
              (existing.impressions + row.impressions)) *
            1000
          : 0,
      cost_per_conversion:
        existing.conversions + row.conversions > 0
          ? (Number(existing.spend) + Number(row.spend)) /
            (existing.conversions + row.conversions)
          : null,
      roas: null, // Recalculated below if needed
    };

    byDate.set(row.date, merged);
  }

  return Array.from(byDate.values()).sort(
    (a, b) => a.date.localeCompare(b.date)
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CampaignChartFilter({ metrics, campaigns }: Props) {
  // Build a unique set of campaign IDs from the metrics data
  const campaignIds = useMemo(() => {
    const ids = new Set<string | null>();
    for (const m of metrics) {
      ids.add(m.campaign_id ?? null);
    }
    return ids;
  }, [metrics]);

  // Map campaign IDs to their names
  const campaignMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of campaigns) {
      map.set(c.id, c.name);
    }
    return map;
  }, [campaigns]);

  // Only show filter if there are multiple campaigns in the data
  const filterableCampaigns = useMemo(() => {
    const list: { id: string | null; name: string }[] = [];
    for (const id of campaignIds) {
      if (id === null) {
        list.push({ id: null, name: "Uncategorized" });
      } else {
        list.push({ id, name: campaignMap.get(id) ?? "Unknown Campaign" });
      }
    }
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [campaignIds, campaignMap]);

  // All campaigns enabled by default
  const [enabledCampaigns, setEnabledCampaigns] = useState<Set<string | null>>(
    () => new Set(filterableCampaigns.map((c) => c.id))
  );

  const toggleCampaign = useCallback((campaignId: string | null) => {
    setEnabledCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(campaignId)) {
        // Don't allow unchecking ALL campaigns
        if (next.size <= 1) return prev;
        next.delete(campaignId);
      } else {
        next.add(campaignId);
      }
      return next;
    });
  }, []);

  // Filter and aggregate metrics based on enabled campaigns
  const filteredMetrics = useMemo(() => {
    const filtered = metrics.filter((m) => enabledCampaigns.has(m.campaign_id ?? null));
    return aggregateByDate(filtered);
  }, [metrics, enabledCampaigns]);

  const showFilter = filterableCampaigns.length > 1;

  return (
    <div>
      {/* Campaign filter pills */}
      {showFilter && (
        <div className="mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mr-1">
              Campaigns
            </span>
            {filterableCampaigns.map((campaign) => {
              const isEnabled = enabledCampaigns.has(campaign.id);
              return (
                <button
                  key={campaign.id ?? "__null__"}
                  type="button"
                  onClick={() => toggleCampaign(campaign.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                    isEnabled
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-gray-50 text-gray-400 border border-gray-200 line-through"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isEnabled ? "bg-red-500" : "bg-gray-300"
                    }`}
                  />
                  {campaign.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DailySpendChart metrics={filteredMetrics} />
        <ConversionsChart metrics={filteredMetrics} />
      </div>
    </div>
  );
}
