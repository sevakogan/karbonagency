'use client';

import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/lib/dashboard/platform-config';
import { fmt } from '@/lib/dashboard/format-utils';

interface Props {
  chartData: any[];
  activePlatforms: string[];
  showOverlay: boolean;
}

interface RowData {
  date: string;
  platform: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
}

function buildRows(chartData: any[], activePlatforms: string[], showOverlay: boolean): RowData[] {
  if (!showOverlay) {
    return chartData.map((d) => ({
      date: d.date ?? d.rawDate ?? '',
      platform: activePlatforms[0] ?? 'all',
      spend: d.spend ?? 0,
      impressions: d.impressions ?? 0,
      clicks: d.clicks ?? 0,
      ctr: d.ctr ?? 0,
      cpc: d.cpc ?? 0,
      conversions: d.conversions ?? 0,
    }));
  }

  const rows: RowData[] = [];
  for (const d of chartData) {
    for (const slug of activePlatforms) {
      const prefix = `${slug}_`;
      rows.push({
        date: d.date ?? d.rawDate ?? '',
        platform: slug,
        spend: d[`${prefix}spend`] ?? d[slug] ?? 0,
        impressions: d[`${prefix}impressions`] ?? 0,
        clicks: d[`${prefix}clicks`] ?? 0,
        ctr: d[`${prefix}ctr`] ?? 0,
        cpc: d[`${prefix}cpc`] ?? 0,
        conversions: d[`${prefix}conversions`] ?? 0,
      });
    }
  }
  return rows.filter((r) => r.spend > 0 || r.impressions > 0);
}

export function DailyBreakdownTable({ chartData, activePlatforms, showOverlay }: Props) {
  const rows = buildRows(chartData, activePlatforms, showOverlay);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-[11px]">
        <thead>
          <tr className="border-b border-[var(--separator)] text-[10px] font-semibold
                         uppercase tracking-wider text-[var(--text-quaternary)]">
            <th className="py-2 pr-3">Date</th>
            <th className="py-2 pr-3">Platform</th>
            <th className="py-2 pr-3 text-right">Spend</th>
            <th className="py-2 pr-3 text-right">Impr.</th>
            <th className="py-2 pr-3 text-right">Clicks</th>
            <th className="py-2 pr-3 text-right">CTR</th>
            <th className="py-2 pr-3 text-right">CPC</th>
            <th className="py-2 text-right">Conv.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const color = PLATFORM_COLORS[row.platform] ?? '#888';
            return (
              <tr
                key={`${row.date}-${row.platform}-${i}`}
                className="border-b border-[var(--separator)]/30 text-[var(--text-secondary)]
                           transition-colors hover:bg-[var(--bg-elevated)]"
              >
                <td className="py-1.5 pr-3 text-[var(--text-tertiary)]">{row.date}</td>
                <td className="py-1.5 pr-3">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block h-1 w-1 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {PLATFORM_NAMES[row.platform] ?? row.platform}
                  </span>
                </td>
                <td className="py-1.5 pr-3 text-right font-medium text-[var(--text-primary)]">
                  ${fmt(row.spend)}
                </td>
                <td className="py-1.5 pr-3 text-right">{fmt(row.impressions)}</td>
                <td className="py-1.5 pr-3 text-right">{fmt(row.clicks)}</td>
                <td className="py-1.5 pr-3 text-right">{row.ctr.toFixed(1)}%</td>
                <td className="py-1.5 pr-3 text-right">${row.cpc.toFixed(2)}</td>
                <td className="py-1.5 text-right">{fmt(row.conversions)}</td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={8} className="py-6 text-center text-[var(--text-quaternary)]">
                No data for the selected period
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
