'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
} from 'recharts';
import { PLATFORM_COLORS } from '@/lib/dashboard/platform-config';
import { fmt } from '@/lib/dashboard/format-utils';

interface Props {
  chartData: any[];
  activePlatforms: string[];
  showOverlay: boolean;
  activeColor: string;
}

const TOOLTIP_STYLE = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--separator)',
  borderRadius: 8,
  fontSize: 11,
};

const AXIS_TICK = { fontSize: 9, fill: 'var(--text-quaternary)' };

export function SpendTrendChart({
  chartData,
  activePlatforms,
  showOverlay,
  activeColor,
}: Props) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <defs>
          {showOverlay ? (
            activePlatforms.map((slug) => {
              const color = PLATFORM_COLORS[slug] ?? '#888';
              return (
                <linearGradient key={slug} id={`spend-${slug}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              );
            })
          ) : (
            <linearGradient id="spend-single" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeColor} stopOpacity={0.3} />
              <stop offset="100%" stopColor={activeColor} stopOpacity={0} />
            </linearGradient>
          )}
        </defs>

        <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS_TICK}
          axisLine={false}
          tickLine={false}
          width={35}
          tickFormatter={(v) => `$${fmt(v)}`}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          formatter={(v: number) => [`$${fmt(v)}`, 'Spend']}
        />

        {showOverlay ? (
          activePlatforms.map((slug) => (
            <Area
              key={slug}
              type="monotone"
              dataKey={slug}
              stroke={PLATFORM_COLORS[slug] ?? '#888'}
              fill={`url(#spend-${slug})`}
              strokeWidth={1.5}
            />
          ))
        ) : (
          <Area
            type="monotone"
            dataKey="spend"
            stroke={activeColor}
            fill="url(#spend-single)"
            strokeWidth={1.5}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
