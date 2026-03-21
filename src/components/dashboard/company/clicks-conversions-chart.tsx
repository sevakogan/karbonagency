'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
} from 'recharts';
import { Brain } from 'lucide-react';
import { fmt } from '@/lib/dashboard/format-utils';
import { PLATFORM_COLORS } from '@/lib/dashboard/platform-config';
import type { AiScore } from '@/lib/dashboard/ai-score';

interface Props {
  chartData: any[];
  activePlatforms: string[];
  showOverlay: boolean;
  activeColor: string;
  conversionScore: AiScore;
}

const TOOLTIP_STYLE = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--separator)',
  borderRadius: 8,
  fontSize: 11,
};

const AXIS_TICK = { fontSize: 9, fill: 'var(--text-quaternary)' };

const SCORE_COLORS = ['', '#FF3B30', '#FF9500', '#FFCC00', '#34C759', '#00C7BE'];

function ScoreBadge({ score }: { score: AiScore }) {
  if (score.score === 0) return null;
  const color = SCORE_COLORS[score.score] ?? '#888';

  return (
    <div
      className="mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5"
      style={{
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
      }}
    >
      <Brain size={10} style={{ color }} />
      <span className="text-[10px] font-bold" style={{ color }}>
        {score.score}/5
      </span>
      <span className="text-[9px] leading-tight text-[var(--text-secondary)]">
        {score.detail}
      </span>
    </div>
  );
}

export function ClicksConversionsChart({
  chartData,
  activePlatforms,
  showOverlay,
  activeColor,
  conversionScore,
}: Props) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <XAxis dataKey="date" tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} width={35} tickFormatter={fmt} />
          <Tooltip contentStyle={TOOLTIP_STYLE} />

          <Area
            type="monotone"
            dataKey="clicks"
            stroke={activeColor}
            fill="transparent"
            strokeWidth={1.5}
          />
          <Area
            type="monotone"
            dataKey="conversions"
            stroke={activeColor}
            fill="transparent"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            opacity={0.6}
          />
        </AreaChart>
      </ResponsiveContainer>

      <ScoreBadge score={conversionScore} />
    </div>
  );
}
