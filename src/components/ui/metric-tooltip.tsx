'use client';

import { useState, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMetricExplanation } from '@/lib/metric-dictionary';

interface MetricTooltipProps {
  metricKey: string;
  children: ReactNode;
  value?: number | string;
}

export function MetricTooltip({ metricKey, children, value }: MetricTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const explanation = getMetricExplanation(metricKey);
  if (!explanation) return <>{children}</>;

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const getJudgment = (): { text: string; color: string } | null => {
    if (value === undefined || value === null) return null;
    const numVal = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numVal)) return null;

    switch (explanation.goodOrBad) {
      case 'higher-is-better':
        return { text: 'Looking good!', color: 'var(--system-green)' };
      case 'lower-is-better':
        return { text: 'On track', color: 'var(--system-green)' };
      case 'range-is-best':
        return { text: 'In range', color: 'var(--system-amber)' };
      default:
        return null;
    }
  };

  const judgment = getJudgment();

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2"
            style={{
              maxWidth: 300,
              padding: 'var(--space-4)',
              background: 'var(--glass-bg-ultra)',
              backdropFilter: 'blur(20px) saturate(200%)',
              WebkitBackdropFilter: 'blur(20px) saturate(200%)',
              border: '1px solid var(--glass-border-strong)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-elevated)',
            }}
          >
            <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-2)]">
              <span>{explanation.emoji}</span>
              <span
                className="font-semibold"
                style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)' }}
              >
                {explanation.label}
              </span>
            </div>

            <p
              className="mb-[var(--space-2)]"
              style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-secondary)', lineHeight: 1.4 }}
            >
              {explanation.plain}
            </p>

            <p
              style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-tertiary)', lineHeight: 1.4 }}
            >
              {explanation.goodMeans}
            </p>

            {judgment && value !== undefined && (
              <div
                className="mt-[var(--space-2)] pt-[var(--space-2)] flex items-center gap-[var(--space-1)]"
                style={{ borderTop: '1px solid var(--separator)', fontSize: 'var(--text-caption-1)' }}
              >
                <span style={{ color: judgment.color }}>
                  {typeof value === 'number' ? value.toLocaleString() : value} — {judgment.text}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
