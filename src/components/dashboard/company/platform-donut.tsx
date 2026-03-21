'use client';

import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface BreakdownItem {
  name: string;
  slug: string;
  value: number;
  color: string;
}

interface Props {
  breakdown: BreakdownItem[];
}

export function PlatformDonut({ breakdown }: Props) {
  const total = breakdown.reduce((sum, b) => sum + b.value, 0);

  return (
    <div className="flex flex-col items-center gap-3">
      <ResponsiveContainer width={100} height={100}>
        <PieChart>
          <Pie
            data={breakdown}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={28}
            outerRadius={45}
            strokeWidth={0}
          >
            {breakdown.map((entry) => (
              <Cell key={entry.slug} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1">
        {breakdown.map((entry) => {
          const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
          return (
            <div key={entry.slug} className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[10px] text-[var(--text-secondary)]">
                {entry.name}
              </span>
              <span className="text-[10px] font-semibold text-[var(--text-primary)]">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
