"use client";

import { useState, useMemo, useCallback } from "react";
import Badge from "@/components/ui/badge";

export interface CampaignRow {
  readonly name: string;
  readonly status: "draft" | "active" | "paused" | "completed";
  readonly spend: number;
  readonly impressions: number;
  readonly clicks: number;
  readonly ctr: number;
  readonly cpc: number;
  readonly conversions: number;
  readonly roas: number;
}

type SortField = keyof Omit<CampaignRow, "status">;
type SortDirection = "asc" | "desc";

interface CampaignBreakdownTableProps {
  campaigns: readonly CampaignRow[];
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

const COLUMNS: readonly {
  key: SortField;
  label: string;
  align: "left" | "right";
  format: (v: number) => string;
}[] = [
  { key: "name", label: "Campaign", align: "left", format: () => "" },
  { key: "spend", label: "Spend", align: "right", format: (v) => `$${fmt(v, 2)}` },
  { key: "impressions", label: "Impressions", align: "right", format: (v) => fmt(v) },
  { key: "clicks", label: "Clicks", align: "right", format: (v) => fmt(v) },
  { key: "ctr", label: "CTR", align: "right", format: (v) => `${fmt(v, 2)}%` },
  { key: "cpc", label: "CPC", align: "right", format: (v) => `$${fmt(v, 2)}` },
  { key: "conversions", label: "Conv.", align: "right", format: (v) => fmt(v) },
  { key: "roas", label: "ROAS", align: "right", format: (v) => v > 0 ? `${fmt(v, 1)}x` : "\u2014" },
] as const;

export default function CampaignBreakdownTable({
  campaigns,
}: CampaignBreakdownTableProps) {
  const [sortField, setSortField] = useState<SortField>("spend");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const handleSort = useCallback(
    (field: SortField) => {
      if (field === sortField) {
        setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortDir("desc");
      }
    },
    [sortField]
  );

  const sorted = useMemo(() => {
    const multiplier = sortDir === "asc" ? 1 : -1;
    return [...campaigns].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return aVal.localeCompare(bVal) * multiplier;
      }
      return ((aVal as number) - (bVal as number)) * multiplier;
    });
  }, [campaigns, sortField, sortDir]);

  if (campaigns.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center text-gray-400 text-sm">
        No campaign data available.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`py-3 px-4 font-medium text-xs uppercase tracking-wide text-gray-500 cursor-pointer hover:text-gray-700 select-none ${
                    col.align === "right" ? "text-right" : "text-left"
                  }`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortField === col.key && (
                      <span className="text-red-500">
                        {sortDir === "asc" ? "\u2191" : "\u2193"}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              <th className="py-3 px-4 font-medium text-xs uppercase tracking-wide text-gray-500 text-left">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((campaign, idx) => (
              <tr
                key={campaign.name}
                className={`border-b border-gray-100 last:border-0 transition-colors ${
                  idx % 2 === 1 ? "bg-gray-50/50" : "bg-white"
                } hover:bg-gray-50`}
              >
                {COLUMNS.map((col) => (
                  <td
                    key={col.key}
                    className={`py-3 px-4 ${
                      col.align === "right" ? "text-right tabular-nums" : "text-left"
                    } ${col.key === "name" ? "font-medium text-gray-900" : "text-gray-600"}`}
                  >
                    {col.key === "name"
                      ? campaign.name
                      : col.format(campaign[col.key] as number)}
                  </td>
                ))}
                <td className="py-3 px-4">
                  <Badge variant={campaign.status}>{campaign.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
