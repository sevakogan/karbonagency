'use client';

interface BarData {
  label: string;
  revenue: number;
  spend: number;
  color: string;
}

interface StackedBarsProps {
  data: BarData[];
  height?: number;
}

export function StackedBars({ data, height = 100 }: StackedBarsProps) {
  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const barW = Math.max(12, Math.min(28, 200 / data.length));
  const gap = 6;
  const totalW = data.length * (barW + gap) - gap;

  return (
    <svg width={totalW} height={height + 18} style={{ display: 'block', overflow: 'visible' }}>
      {data.map((d, i) => {
        const x = i * (barW + gap);
        const revH = (d.revenue / maxRev) * height;
        const spendH = (d.spend / maxRev) * height;
        const revY = height - revH;
        const spendY = height - spendH;

        return (
          <g key={d.label}>
            {/* Revenue bar */}
            <rect x={x} y={revY} width={barW} height={revH}
              rx={3} fill={d.color}
              style={{ transition: 'height 0.5s ease, y 0.5s ease' }} />

            {/* Spend overlay */}
            <rect x={x} y={spendY} width={barW} height={spendH}
              rx={3} fill={d.color} opacity={0.4}
              style={{ transition: 'height 0.5s ease, y 0.5s ease' }} />

            {/* Label */}
            <text x={x + barW / 2} y={height + 14} textAnchor="middle"
              style={{ fontSize: 8, fill: 'var(--text-quaternary)' }}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
