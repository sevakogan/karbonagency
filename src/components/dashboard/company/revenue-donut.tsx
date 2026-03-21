'use client';

interface Channel {
  name: string;
  revenue: number;
  color: string;
}

interface RevenueDonutProps {
  channels: Channel[];
  size?: number;
}

export function RevenueDonut({ channels, size = 120 }: RevenueDonutProps) {
  const total = channels.reduce((s, c) => s + c.revenue, 0);
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 8;
  const strokeW = 14;
  const innerR = radius - strokeW / 2;
  const circumference = 2 * Math.PI * innerR;

  let offset = 0;
  const arcs = channels.map((ch) => {
    const pct = total > 0 ? ch.revenue / total : 0;
    const dashLen = circumference * pct;
    const gap = circumference - dashLen;
    const arc = { ...ch, dashLen, gap, offset };
    offset += dashLen;
    return arc;
  });

  const formattedTotal = total >= 1000
    ? `$${(total / 1000).toFixed(total >= 10000 ? 0 : 1)}k`
    : `$${total}`;

  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      {/* Track */}
      <circle cx={cx} cy={cy} r={innerR} fill="none"
        stroke="var(--separator)" strokeWidth={strokeW} />

      {/* Segments */}
      {arcs.map((a) => (
        <circle key={a.name} cx={cx} cy={cy} r={innerR} fill="none"
          stroke={a.color} strokeWidth={strokeW}
          strokeDasharray={`${a.dashLen} ${a.gap}`}
          strokeDashoffset={-a.offset}
          strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      ))}

      {/* Center text */}
      <text x={cx} y={cy - 5} textAnchor="middle"
        style={{ fontSize: 8, fontWeight: 600, fill: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: 1 }}>
        TOTAL
      </text>
      <text x={cx} y={cy + 11} textAnchor="middle"
        style={{ fontSize: 16, fontWeight: 800, fill: 'var(--text-primary)' }}>
        {formattedTotal}
      </text>
    </svg>
  );
}
