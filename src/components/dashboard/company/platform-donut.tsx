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
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--text-tertiary)' }}>
        By Platform
      </p>
      <div className="flex items-center gap-4">
        {/* Bigger donut on the left */}
        <div className="flex-shrink-0">
          <ResponsiveContainer width={110} height={110}>
            <PieChart>
              <Pie
                data={breakdown}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={52}
                strokeWidth={0}
                paddingAngle={2}
              >
                {breakdown.map((entry) => (
                  <Cell key={entry.slug} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend on the right */}
        <div className="flex flex-col gap-1.5">
          {breakdown.map((entry) => {
            const pct = total > 0 ? ((entry.value / total) * 100).toFixed(0) : '0';
            return (
              <div key={entry.slug} className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  {entry.name}
                </span>
                <span className="text-[11px] font-bold ml-auto tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
