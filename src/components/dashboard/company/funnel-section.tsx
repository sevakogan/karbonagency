'use client';

interface FunnelStep {
  label: string;
  value: number;
  prefix?: string;
  color: string;
}

interface FunnelSectionProps {
  steps: FunnelStep[];
  conversionRates: Array<{ label: string; value: string; color: string }>;
}

export function FunnelSection({ steps, conversionRates }: FunnelSectionProps) {
  const maxValue = steps.length > 0 ? steps[0].value : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Funnel bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {steps.map((step, i) => {
          const widthPct = maxValue > 0 ? Math.max((step.value / maxValue) * 100, 8) : 8;
          const displayValue = step.prefix ? `${step.prefix}${step.value.toLocaleString()}` : step.value.toLocaleString();

          return (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Label */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {step.label}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  {displayValue}
                </span>
              </div>

              {/* Bar */}
              <div style={{ position: 'relative', height: 26, width: '100%' }}>
                <div style={{
                  height: 26,
                  width: `${widthPct}%`,
                  borderRadius: 13,
                  background: `linear-gradient(90deg, ${step.color}, color-mix(in srgb, ${step.color} 60%, transparent))`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: 10,
                  transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                }}>
                  <span style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: '#fff',
                    opacity: 0.9,
                  }}>
                    {Math.round(widthPct)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversion rate badges */}
      {conversionRates.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', paddingTop: 6 }}>
          {conversionRates.map((cr, i) => (
            <span key={i} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '3px 10px',
              borderRadius: 20,
              background: `${cr.color}14`,
              fontSize: 10,
              fontWeight: 700,
              color: cr.color,
            }}>
              {cr.label}: {cr.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
