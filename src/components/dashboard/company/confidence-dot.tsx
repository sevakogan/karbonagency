'use client';

interface ConfidenceDotProps {
  pct: number;
}

export function ConfidenceDot({ pct }: ConfidenceDotProps) {
  const color = pct >= 85
    ? 'var(--system-green)'
    : pct >= 60
      ? '#F5A623'
      : 'var(--system-red)';

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <span style={{
        width: 7, height: 7, borderRadius: '50%', background: color,
        boxShadow: `0 0 6px ${color}66`,
      }} />
      <span style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
        {pct}%
      </span>
    </span>
  );
}
