'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { pageVariants } from '@/lib/animations';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { RefreshButton } from '@/components/dashboard/refresh-button';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

interface DailyRow {
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface Props {
  companyId: string;
  companyName: string;
  platformSlug: string;
  platformName: string;
  kpis: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    totalReach: number;
    avgCtr: number;
    avgCpc: number;
    avgCpm: number;
  };
  dailyData: DailyRow[];
}

function formatDate(d: string) {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function PlatformDeepDive({ companyId, companyName, platformName, dailyData }: Props) {
  const router = useRouter();
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'mtd' | 'custom'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<string>('spend');

  // Filter data by selected date range
  const filteredData = useMemo(() => {
    const now = new Date();
    let cutoff: Date;
    switch (dateRange) {
      case '7d':
        cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'mtd':
        cutoff = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    }
    const cutoffStr = cutoff.toISOString().split('T')[0];
    return dailyData.filter((d) => d.date >= cutoffStr);
  }, [dailyData, dateRange]);

  // Recalculate KPIs from filtered data
  const totalSpend = filteredData.reduce((s, r) => s + r.spend, 0);
  const totalImpressions = filteredData.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = filteredData.reduce((s, r) => s + r.clicks, 0);
  const totalConversions = filteredData.reduce((s, r) => s + r.conversions, 0);

  const kpiItems = [
    { metricKey: 'spend', label: 'Spend', value: totalSpend, format: 'currency' as const },
    { metricKey: 'impressions', label: 'Impressions', value: totalImpressions, format: 'number' as const },
    { metricKey: 'clicks', label: 'Clicks', value: totalClicks, format: 'number' as const },
    { metricKey: 'ctr', label: 'CTR', value: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0, format: 'percentage' as const },
    { metricKey: 'cpc', label: 'CPC', value: totalClicks > 0 ? totalSpend / totalClicks : 0, format: 'currency' as const },
    { metricKey: 'cpm', label: 'CPM', value: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0, format: 'currency' as const },
    { metricKey: 'conversions', label: 'Conversions', value: totalConversions, format: 'number' as const },
  ];

  const chartData = filteredData.map((d) => ({
    date: formatDate(d.date),
    value: (d as Record<string, number>)[selectedMetric] ?? d.spend,
    ...d,
  }));

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-7 h-7"
            style={{
              background: 'var(--fill-quaternary)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-secondary)',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <h1 className="font-semibold" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
              {platformName}
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              {companyName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton companyId={companyId} />
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
      </div>

      {/* KPI Row */}
      <div className="mb-5">
        <KpiRow
          kpis={kpiItems}
          selectedMetric={selectedMetric}
          onSelectMetric={setSelectedMetric}
        />
      </div>

      {/* Chart */}
      {filteredData.length > 0 ? (
        <div className="glass-card p-4 mb-5">
          <h3
            className="font-medium mb-3"
            style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            {kpiItems.find((k) => k.metricKey === selectedMetric)?.label ?? 'Spend'} over time
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--separator-opaque)',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: 'var(--text-primary)',
                }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--accent)"
                strokeWidth={2}
                fill="url(#chartGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div
          className="glass-card p-8 text-center mb-5"
          style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}
        >
          No data yet. Connect this platform and sync to see metrics.
        </div>
      )}

      {/* Daily breakdown table */}
      {filteredData.length > 0 && (
        <div className="glass-card overflow-hidden">
          <table className="w-full" style={{ fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--separator)' }}>
                {['Date', 'Spend', 'Impressions', 'Clicks', 'Conv.'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2 font-medium"
                    style={{ color: 'var(--text-tertiary)', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...filteredData].reverse().slice(0, 30).map((row) => (
                <tr key={row.date} style={{ borderBottom: '1px solid var(--separator)' }}>
                  <td className="px-3 py-2" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {formatDate(row.date)}
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    ${row.spend.toFixed(2)}
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {row.impressions.toLocaleString()}
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {row.clicks.toLocaleString()}
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                    {row.conversions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
