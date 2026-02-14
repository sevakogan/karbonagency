"use client";

import { useMemo } from "react";

export interface DemographicDataPoint {
  readonly age_range: string;
  readonly gender: string;
  readonly spend: number;
  readonly impressions: number;
  readonly clicks: number;
}

interface DemographicsChartProps {
  data: readonly DemographicDataPoint[];
}

const GENDER_COLORS: Record<string, { bar: string; label: string }> = {
  male: { bar: "bg-blue-400", label: "Male" },
  female: { bar: "bg-pink-400", label: "Female" },
  unknown: { bar: "bg-gray-300", label: "Unknown" },
};

function getGenderColor(gender: string): { bar: string; label: string } {
  const key = gender.toLowerCase();
  return GENDER_COLORS[key] ?? { bar: "bg-gray-300", label: gender };
}

interface AgeGroup {
  readonly ageRange: string;
  readonly segments: readonly {
    readonly gender: string;
    readonly spend: number;
    readonly impressions: number;
    readonly clicks: number;
  }[];
  readonly totalSpend: number;
}

export default function DemographicsChart({ data }: DemographicsChartProps) {
  const { ageGroups, maxSpend, genders } = useMemo(() => {
    if (data.length === 0) {
      return { ageGroups: [], maxSpend: 0, genders: [] };
    }

    // Group by age range
    const grouped = new Map<string, Map<string, DemographicDataPoint>>();
    const genderSet = new Set<string>();

    for (const point of data) {
      genderSet.add(point.gender);
      const existing = grouped.get(point.age_range) ?? new Map();
      existing.set(point.gender, point);
      grouped.set(point.age_range, existing);
    }

    // Sort age ranges
    const sortedAgeRanges = [...grouped.keys()].sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
      return numA - numB;
    });

    const groups: AgeGroup[] = sortedAgeRanges.map((ageRange) => {
      const genderMap = grouped.get(ageRange)!;
      const segments = [...genderMap.entries()].map(([gender, point]) => ({
        gender,
        spend: point.spend,
        impressions: point.impressions,
        clicks: point.clicks,
      }));
      const totalSpend = segments.reduce((sum, s) => sum + s.spend, 0);
      return { ageRange, segments, totalSpend };
    });

    const max = Math.max(...groups.map((g) => g.totalSpend), 1);

    return {
      ageGroups: groups,
      maxSpend: max,
      genders: [...genderSet],
    };
  }, [data]);

  if (ageGroups.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-center text-gray-400 text-sm">
        No demographic data available.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="space-y-3">
        {ageGroups.map((group) => (
          <div key={group.ageRange} className="flex items-center gap-3">
            <span className="text-xs text-gray-500 font-medium w-14 text-right shrink-0">
              {group.ageRange}
            </span>
            <div className="flex-1 flex h-7 rounded overflow-hidden bg-gray-100">
              {group.segments.map((segment) => {
                const widthPct =
                  maxSpend > 0 ? (segment.spend / maxSpend) * 100 : 0;
                const colors = getGenderColor(segment.gender);
                return (
                  <div
                    key={segment.gender}
                    className={`${colors.bar} transition-all relative group`}
                    style={{ width: `${Math.max(widthPct, 0.5)}%` }}
                    title={`${segment.gender}: $${segment.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })} spend, ${segment.impressions.toLocaleString()} impressions, ${segment.clicks.toLocaleString()} clicks`}
                  >
                    {/* Hover tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs whitespace-nowrap">
                        <p className="font-medium text-gray-700">
                          {colors.label} &middot; {group.ageRange}
                        </p>
                        <p className="text-gray-500">
                          Spend: ${segment.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-gray-500">
                          Clicks: {segment.clicks.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <span className="text-xs text-gray-400 font-mono w-16 text-right shrink-0">
              ${group.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500">
        {genders.map((g) => {
          const colors = getGenderColor(g);
          return (
            <div key={g} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${colors.bar}`} />
              {colors.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
