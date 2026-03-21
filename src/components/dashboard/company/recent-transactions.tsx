'use client';

import { ConfidenceDot } from './confidence-dot';

interface Transaction {
  time: string;
  source: 'Shift OS' | 'Square';
  customer: string;
  amount: number;
  package: string;
  channel: string;
  confidence: number;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

const SOURCE_COLORS: Record<string, string> = {
  'Shift OS': 'var(--system-blue, #0A84FF)',
  'Square': 'var(--system-orange, #FF9F0A)',
};

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: 8,
    }}>
      {transactions.map((tx, i) => {
        const sourceColor = SOURCE_COLORS[tx.source] ?? 'var(--text-tertiary)';

        return (
          <div
            key={i}
            style={{
              borderRadius: 14,
              padding: 14,
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* Source badge + time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 8px',
                borderRadius: 10,
                background: `${sourceColor}18`,
                color: sourceColor,
                fontSize: 9,
                fontWeight: 700,
              }}>
                {tx.source}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                {tx.time}
              </span>
            </div>

            {/* Amount */}
            <div style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
              lineHeight: 1,
            }}>
              ${tx.amount.toLocaleString()}
            </div>

            {/* Package */}
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
              {tx.package}
            </div>

            {/* Customer */}
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              {tx.customer}
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--separator)' }} />

            {/* Attribution */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>
                Attributed: <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{tx.channel}</span>
              </span>
              <ConfidenceDot pct={Math.round(tx.confidence * 100)} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
