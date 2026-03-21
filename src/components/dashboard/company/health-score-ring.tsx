'use client';

import { SCORE_COLORS } from '@/lib/dashboard/platform-config';
import { scoreMetric, type AiScore } from '@/lib/dashboard/ai-scoring';

interface HealthScoreRingProps {
  context: { spend: number; impressions: number; clicks: number; conversions: number };
}

export function HealthScoreRing({ context }: HealthScoreRingProps) {
  if (context.impressions === 0) return null;

  const overall = scoreMetric('overall', 0, context);
  const bgColor = SCORE_COLORS[overall.score] ?? '#888';
  const pct = (overall.score / 5) * 100;
  const circumference = 2 * Math.PI * 42; // radius=42
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="flex items-center gap-4">
      {/* SVG Ring */}
      <div className="relative w-[72px] h-[72px] flex-shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {/* Track */}
          <circle cx="50" cy="50" r="42" fill="none" stroke="var(--glass-border)" strokeWidth="6" />
          {/* Fill */}
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={bgColor} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color: bgColor }}>{overall.score}</span>
          <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>/5</span>
        </div>
      </div>
      {/* Label */}
      <div>
        <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          Campaign Health: {overall.label}
        </p>
        <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
          {overall.detail}
        </p>
      </div>
    </div>
  );
}
