'use client';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4 | 6 | 8 | 12;
  platformColor?: string;
}

export function BentoCard({ children, className = '', colSpan, platformColor }: BentoCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-3.5 backdrop-blur-xl ${className}`}
      style={{
        gridColumn: colSpan ? `span ${colSpan}` : undefined,
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
        border: platformColor
          ? `1px solid color-mix(in srgb, ${platformColor} 25%, transparent)`
          : '1px solid var(--glass-border)',
        boxShadow: platformColor
          ? `var(--shadow-card), 0 0 20px color-mix(in srgb, ${platformColor} 6%, transparent)`
          : 'var(--shadow-card)',
      }}
    >
      {/* Gloss highlight */}
      <div
        className="absolute top-0 left-[8%] right-[8%] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, var(--gloss-highlight-strong), transparent)' }}
      />
      {children}
    </div>
  );
}
