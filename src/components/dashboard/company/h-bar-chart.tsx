'use client';

interface ChannelBar {
  name: string;
  bookings: number;
  color: string;
  icon?: string;
}

interface HBarChartProps {
  channels: ChannelBar[];
}

export function HBarChart({ channels }: HBarChartProps) {
  const maxVal = Math.max(...channels.map((c) => c.bookings), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {channels.map((ch) => {
        const pct = (ch.bookings / maxVal) * 100;
        return (
          <div key={ch.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Icon / label */}
            <span style={{
              width: 60, fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {ch.icon ?? ch.name}
            </span>

            {/* Bar */}
            <div style={{
              flex: 1, height: 10, borderRadius: 5,
              background: 'var(--separator)',
            }}>
              <div style={{
                width: `${pct}%`, height: '100%', borderRadius: 5,
                background: `linear-gradient(90deg, ${ch.color}, ${ch.color}cc)`,
                transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>

            {/* Count */}
            <span style={{
              minWidth: 28, textAlign: 'right', fontSize: 11,
              fontWeight: 700, color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {ch.bookings}
            </span>
          </div>
        );
      })}
    </div>
  );
}
