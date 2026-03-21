'use client';

export interface JourneyStep {
  time: string;
  channel: string;
  action: string;
  device: string;
  status: 'session' | 'intent' | 'booked' | 'revenue';
  customerName?: string;
  amount?: number;
}

interface CustomerJourneyProps {
  steps: JourneyStep[];
}

const STATUS_COLORS: Record<string, string> = {
  session: 'var(--system-blue, #0A84FF)',
  intent: 'var(--system-yellow, #FFD60A)',
  booked: 'var(--system-green, #30D158)',
  revenue: 'var(--system-purple, #BF5AF2)',
};

const STATUS_LABELS: Record<string, string> = {
  session: 'Session',
  intent: 'Intent',
  booked: 'Booked',
  revenue: 'Revenue',
};

export function CustomerJourney({ steps }: CustomerJourneyProps) {
  // Pull customer name and total amount from steps that have them
  const customerName = steps.find(s => s.customerName)?.customerName;
  const totalAmount = steps.filter(s => s.amount).reduce((sum, s) => sum + (s.amount ?? 0), 0);

  return (
    <div>
      {/* Customer header */}
      {(customerName || totalAmount > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--separator)' }}>
          {customerName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14,
                background: 'var(--accent)', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700,
              }}>
                {customerName.split(' ').map(n => n[0]).join('')}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{customerName}</span>
            </div>
          )}
          {totalAmount > 0 && (
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--system-green, #30D158)' }}>
              ${totalAmount.toLocaleString()}
            </span>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, position: 'relative' }}>
      {steps.map((step, i) => {
        const color = STATUS_COLORS[step.status] ?? 'var(--text-tertiary)';
        const isLast = i === steps.length - 1;

        return (
          <div key={i} style={{ display: 'flex', gap: 12, minHeight: 48 }}>
            {/* Timeline column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 16,
              flexShrink: 0,
            }}>
              {/* Dot */}
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: color,
                boxShadow: `0 0 8px ${color}55`,
                flexShrink: 0,
                marginTop: 4,
              }} />
              {/* Connector line */}
              {!isLast && (
                <div style={{
                  width: 2,
                  flex: 1,
                  background: 'var(--separator)',
                  marginTop: 4,
                  marginBottom: 4,
                }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>
                  {step.channel}
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 7px',
                  borderRadius: 10,
                  background: `${color}18`,
                  color,
                  fontSize: 9,
                  fontWeight: 700,
                }}>
                  {STATUS_LABELS[step.status] ?? step.status}
                </span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>
                {step.action}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{step.time}</span>
                <span style={{ fontSize: 9, color: 'var(--text-tertiary)' }}>{step.device}</span>
              </div>
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
