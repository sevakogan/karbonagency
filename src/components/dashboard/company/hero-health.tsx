'use client';

interface HeroHealthProps {
  score: number;
  label: string;
  metricsHealthy: number;
  roas: string;
  cpa: string;
}

export function HeroHealth({ score, label, metricsHealthy, roas, cpa }: HeroHealthProps) {
  const pct = (score / 5) * 100;
  const radius = 32;
  const stroke = 6;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - pct / 100);
  const ringColor =
    score >= 4 ? 'var(--system-green, #30D158)' :
    score >= 3 ? 'var(--system-yellow, #FFD60A)' :
    'var(--system-red, #FF453A)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* Health ring */}
      <svg width={80} height={80} viewBox="0 0 80 80">
        <defs>
          <filter id="health-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        <circle cx={40} cy={40} r={radius} fill="none"
          stroke="var(--separator)" strokeWidth={stroke} />
        <circle cx={40} cy={40} r={radius} fill="none"
          stroke={ringColor} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
          filter="url(#health-glow)"
          style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <text x={40} y={36} textAnchor="middle" dominantBaseline="middle"
          style={{ fontSize: 20, fontWeight: 800, fill: 'var(--text-primary)' }}>
          {score}
        </text>
        <text x={40} y={52} textAnchor="middle"
          style={{ fontSize: 8, fontWeight: 600, fill: 'var(--text-tertiary)' }}>
          /5
        </text>
      </svg>

      {/* Label */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: ringColor }}>{label}</div>
        <div style={{ fontSize: 9, color: 'var(--text-tertiary)', marginTop: 2 }}>
          {metricsHealthy} metrics healthy
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '100%', height: 1, background: 'var(--separator)' }} />

      {/* ROAS + CPA */}
      <div style={{ display: 'flex', gap: 20, justifyContent: 'center', width: '100%' }}>
        <StatPill label="ROAS" value={roas} color="var(--system-green, #30D158)" />
        <StatPill label="CPA" value={cpa} color="var(--text-secondary)" />
      </div>
    </div>
  );
}

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-tertiary)', textTransform: 'uppercase' as const }}>
        {label}
      </div>
      <div style={{ fontSize: 16, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}
