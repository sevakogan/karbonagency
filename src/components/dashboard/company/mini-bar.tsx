'use client';

interface MiniBarProps {
  value: number;
  max: number;
  color: string;
}

export function MiniBar({ value, max, color }: MiniBarProps) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div style={{
      width: '100%', height: 6, borderRadius: 3,
      background: 'var(--separator)',
    }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: 3,
        background: color,
        transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
      }} />
    </div>
  );
}
