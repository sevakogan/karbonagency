'use client';

import { useState } from 'react';
import { Sparkline } from './sparkline';
import { AreaChartSvg } from './area-chart-svg';
import { Badge } from './badge';

interface ChannelData {
  name: string;
  icon: string;
  spend: number;
  clicks: number;
  sessions: number;
  bookings: number;
  revenue: number;
  color: string;
  daily: number[];
  ctr: string;
  cvr: string;
  trend: string;
}

interface ChannelCardsProps {
  channels: ChannelData[];
}

export function ChannelCards({ channels }: ChannelCardsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8,
    }}>
      {channels.map((ch, i) => {
        const isExpanded = expandedIndex === i;
        const cpa = ch.bookings > 0 ? (ch.spend / ch.bookings).toFixed(2) : '—';
        const roas = ch.spend > 0 ? (ch.revenue / ch.spend).toFixed(1) + 'x' : '—';

        return (
          <div
            key={ch.name}
            onClick={() => setExpandedIndex(isExpanded ? null : i)}
            style={{
              borderRadius: 14,
              padding: 14,
              background: 'var(--glass-bg)',
              border: isExpanded
                ? `1px solid color-mix(in srgb, ${ch.color} 35%, transparent)`
                : '1px solid var(--glass-border)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: isExpanded
                ? `0 0 20px color-mix(in srgb, ${ch.color} 8%, transparent)`
                : 'var(--shadow-card)',
            }}
          >
            {/* Collapsed header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{ch.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {ch.name}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: ch.color, fontVariantNumeric: 'tabular-nums' }}>
                  ${ch.revenue.toLocaleString()}
                </span>
                <Badge
                  text={ch.trend}
                  color={ch.trend.startsWith('+') ? 'var(--system-green, #30D158)' : 'var(--system-red, #FF453A)'}
                />
              </div>
            </div>

            {/* Spend label */}
            <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 4 }}>
              ${ch.spend.toLocaleString()} spend
            </div>

            {/* Sparkline */}
            <div style={{ marginTop: 8 }}>
              <Sparkline data={ch.daily} color={ch.color} width={200} height={24} />
            </div>

            {/* Expanded section */}
            {isExpanded && (
              <div style={{ marginTop: 12 }}>
                {/* Divider */}
                <div style={{ height: 1, background: 'var(--separator)', marginBottom: 12 }} />

                {/* 3x2 stats grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  marginBottom: 12,
                }}>
                  <StatCell label="Sessions" value={ch.sessions.toLocaleString()} />
                  <StatCell label="Bookings" value={ch.bookings.toLocaleString()} />
                  <StatCell label="CTR" value={ch.ctr} />
                  <StatCell label="CVR" value={ch.cvr} />
                  <StatCell label="CPA" value={`$${cpa}`} />
                  <StatCell label="ROAS" value={roas} />
                </div>

                {/* Full area chart */}
                <AreaChartSvg data={ch.daily} color={ch.color} width={260} height={70} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 8, fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
