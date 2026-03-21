'use client';

import { AnimNum } from './anim-num';
import { Badge } from './badge';
import { MiniBar } from './mini-bar';

interface HeroRevenueProps {
  totalRevenue: number;
  shiftOSRevenue: number;
  squareRevenue: number;
  transactions: number;
  avgTicket: number;
}

const SHIFT_COLOR = 'var(--system-blue, #0A84FF)';
const SQUARE_COLOR = 'var(--system-orange, #FF9F0A)';

export function HeroRevenue({
  totalRevenue,
  shiftOSRevenue,
  squareRevenue,
  transactions,
  avgTicket,
}: HeroRevenueProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Label */}
      <span style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color: 'var(--text-tertiary)',
      }}>
        TOTAL REVENUE &middot; 30D
      </span>

      {/* Big number */}
      <div style={{
        fontSize: 32,
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--text-primary)',
        lineHeight: 1,
      }}>
        <AnimNum value={totalRevenue} prefix="$" />
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', gap: 6 }}>
        <Badge text={`${transactions} txns`} color="var(--system-blue, #0A84FF)" />
        <Badge text={`$${avgTicket.toFixed(0)} avg`} color="var(--system-green, #30D158)" />
      </div>

      {/* Platform breakdown */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        paddingTop: 4,
        borderTop: '1px solid var(--separator)',
      }}>
        <PlatformRow
          label="Shift OS"
          amount={shiftOSRevenue}
          total={totalRevenue}
          color={SHIFT_COLOR}
        />
        <PlatformRow
          label="Square"
          amount={squareRevenue}
          total={totalRevenue}
          color={SQUARE_COLOR}
        />
      </div>
    </div>
  );
}

function PlatformRow({ label, amount, total, color }: {
  label: string;
  amount: number;
  total: number;
  color: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>
          {label}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>
          ${amount.toLocaleString()}
        </span>
      </div>
      <MiniBar value={amount} max={total} color={color} />
    </div>
  );
}
