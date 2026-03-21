'use client';

import { ConfidenceDot } from './confidence-dot';

export interface AiInsight {
  type: string;
  confidence: number;
  text: string;
  icon: string;
  color: string;
}

interface AiInsightsCardProps {
  insights: AiInsight[];
}

export function AiInsightsCard({ insights }: AiInsightsCardProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14 }}>&#129302;</span>
        <span style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: 'var(--text-tertiary)',
        }}>
          AI INSIGHTS
        </span>
      </div>

      {/* Insight list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {insights.map((insight, i) => (
          <div key={i}>
            {i > 0 && (
              <div style={{ height: 1, background: 'var(--separator)', margin: '8px 0' }} />
            )}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              {/* Icon square */}
              <div style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: `${insight.color}18`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                flexShrink: 0,
              }}>
                {insight.icon}
              </div>

              {/* Text + confidence */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  lineHeight: 1.4,
                }}>
                  {insight.text}
                </div>
              </div>

              {/* Confidence dot */}
              <div style={{ paddingTop: 4 }}>
                <ConfidenceDot pct={Math.round(insight.confidence * 100)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
