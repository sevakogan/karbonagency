'use client';

import { Brain } from 'lucide-react';
import type { AiScore } from '@/lib/dashboard/ai-scoring';
import { SCORE_COLORS } from '@/lib/dashboard/platform-config';

export function ScoreBadge({ score }: { score: AiScore }) {
  if (score.score === 0) return null;
  const bgColor = SCORE_COLORS[score.score] ?? '#888';

  return (
    <div
      className="flex items-center gap-1.5 mt-2 px-2 py-1.5 rounded-lg"
      style={{
        background: `color-mix(in srgb, ${bgColor} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${bgColor} 20%, transparent)`,
      }}
    >
      <div className="flex items-center gap-1">
        <Brain size={10} style={{ color: bgColor }} />
        <span className="text-[10px] font-bold" style={{ color: bgColor }}>
          {score.score}/5
        </span>
      </div>
      <span className="text-[9px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
        {score.detail}
      </span>
    </div>
  );
}
