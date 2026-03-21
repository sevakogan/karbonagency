'use client';

import { useRef, useCallback } from 'react';

interface BentoCardProps {
  children: React.ReactNode;
  className?: string;
  colSpan?: 1 | 2 | 3 | 4 | 6 | 8 | 12;
  platformColor?: string;
}

export function BentoCard({ children, className = '', colSpan, platformColor }: BentoCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -4; // max 4deg tilt
    const rotateY = ((x - centerX) / centerX) * 4;

    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.01)`;
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)';
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-2xl p-3.5 backdrop-blur-xl transition-shadow duration-300 ${className}`}
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
        transition: 'transform 0.15s ease-out, box-shadow 0.3s ease',
        willChange: 'transform',
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
