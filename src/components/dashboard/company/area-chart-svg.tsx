'use client';

interface AreaChartSvgProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  labels?: string[];
  gridLines?: number;
}

export function AreaChartSvg({
  data,
  color,
  width = 300,
  height = 120,
  labels,
  gridLines = 4,
}: AreaChartSvgProps) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padX = 4;
  const padY = 8;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const points = data.map((v, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - ((v - min) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${height - padY} L${points[0].x},${height - padY} Z`;
  const gradId = `area-grad-${color.replace('#', '')}`;
  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {Array.from({ length: gridLines }).map((_, i) => {
        const y = padY + (i / (gridLines - 1)) * chartH;
        return (
          <line key={i} x1={padX} y1={y} x2={width - padX} y2={y}
            stroke="var(--separator)" strokeWidth={0.5} />
        );
      })}

      {/* Area fill */}
      <path d={areaPath} fill={`url(#${gradId})`} />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.8}
        strokeLinecap="round" strokeLinejoin="round" />

      {/* End dot */}
      <circle cx={last.x} cy={last.y} r={3} fill={color} />
      <circle cx={last.x} cy={last.y} r={5} fill={color} opacity={0.2} />

      {/* Labels */}
      {labels && labels.map((label, i) => {
        const x = padX + (i / (labels.length - 1)) * chartW;
        return (
          <text key={i} x={x} y={height} textAnchor="middle"
            style={{ fontSize: 8, fill: 'var(--text-quaternary)' }}>
            {label}
          </text>
        );
      })}
    </svg>
  );
}
