'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { fmt } from '@/lib/dashboard/format-utils';

interface Props {
  data: Array<{ week: string; spend: number }>;
}

const TOOLTIP_STYLE = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--separator)',
  borderRadius: 8,
  fontSize: 11,
};

const AXIS_TICK = { fontSize: 9, fill: 'var(--text-quaternary)' };

export function WeeklySpendBars({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
        <XAxis dataKey="week" tick={AXIS_TICK} axisLine={false} tickLine={false} />
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
        <Bar
          dataKey="spend"
          fill="var(--accent)"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
