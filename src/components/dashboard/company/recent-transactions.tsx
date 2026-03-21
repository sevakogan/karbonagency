'use client';

export interface RecentBooking {
  id: string;
  time: string;
  source: string;
  customer: string;
  package: string;
  paid: boolean;
}

interface RecentTransactionsProps {
  bookings: RecentBooking[];
}

const SOURCE_COLORS: Record<string, string> = {
  'Shift OS': '#0A84FF',
  'Square': '#FF9F0A',
};

export function RecentTransactions({ bookings }: RecentTransactionsProps) {
  if (bookings.length === 0) {
    return (
      <div style={{
        borderRadius: 14, padding: 20, background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)', textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>No recent bookings in the last 24 hours</p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(bookings.length, 3)}, 1fr)`,
      gap: 8,
    }}>
      {bookings.slice(0, 6).map((b) => {
        const sourceColor = SOURCE_COLORS[b.source] ?? '#888';

        return (
          <div
            key={b.id}
            style={{
              borderRadius: 14, padding: 14,
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              display: 'flex', flexDirection: 'column', gap: 6,
            }}
          >
            {/* Source badge + time */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '2px 8px', borderRadius: 10,
                background: `${sourceColor}18`, color: sourceColor,
                fontSize: 9, fontWeight: 700,
              }}>
                {b.source}
              </span>
              <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{b.time}</span>
            </div>

            {/* Package name */}
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {b.package}
            </div>

            {/* Customer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 11,
                background: sourceColor + '20', color: sourceColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700,
              }}>
                {b.customer.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{b.customer}</span>
            </div>

            {/* Status */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', borderRadius: 10, alignSelf: 'flex-start',
              background: b.paid ? '#30D15818' : '#FF9F0A18',
              color: b.paid ? '#30D158' : '#FF9F0A',
              fontSize: 9, fontWeight: 700,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: 3,
                background: b.paid ? '#30D158' : '#FF9F0A',
              }} />
              {b.paid ? 'Paid' : 'Pending'}
            </div>
          </div>
        );
      })}
    </div>
  );
}
