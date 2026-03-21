'use client';

import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { MetricTooltip } from '@/components/ui/metric-tooltip';

interface KpiCardProps {
  metricKey: string;
  label: string;
  value: number;
  previousValue?: number;
  format?: 'currency' | 'number' | 'percentage' | 'multiplier';
  sparklineData?: number[];
  selected?: boolean;
  onClick?: () => void;
}

function formatValue(value: number, format: string): string {
  switch (format) {
    case 'currency':
      return value >= 1000
        ? `$${(value / 1000).toFixed(1)}k`
        : `$${value.toFixed(2)}`;
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'multiplier':
      return `${value.toFixed(1)}x`;
    default:
      return value >= 1000
        ? `${(value / 1000).toFixed(1)}k`
        : value.toFixed(0);
  }
}

function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 24;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const areaPoints = `0,${height} ${points} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polygon
        points={areaPoints}
        fill="var(--accent-muted)"
      />
    </svg>
  );
}

function AnimatedNumber({ value, format }: { value: number; format: string }) {
  const motionValue = useMotionValue(0);
  const displayed = useTransform(motionValue, (v) => formatValue(v, format));
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.6,
      type: 'spring',
      stiffness: 250,
      damping: 28,
    });
    return controls.stop;
  }, [value, motionValue]);

  useEffect(() => {
    const unsubscribe = displayed.on('change', (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsubscribe;
  }, [displayed]);

  return <span ref={ref} className="kpi-value">{formatValue(value, format)}</span>;
}

export function KpiCard({
  metricKey,
  label,
  value,
  previousValue,
  format = 'number',
  sparklineData,
  selected = false,
  onClick,
}: KpiCardProps) {
  const delta = previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : null;

  return (
    <MetricTooltip metricKey={metricKey} value={value}>
      <motion.div
        className="glass-card cursor-pointer flex-shrink-0"
        style={{
          padding: '16px 20px',
          minWidth: 140,
          borderColor: selected ? 'var(--accent)' : undefined,
          borderWidth: selected ? 2 : undefined,
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onClick}
      >
        <div className="kpi-label mb-[var(--space-1)]">{label}</div>
        <div className="flex items-end justify-between gap-[var(--space-2)]">
          <div>
            <AnimatedNumber value={value} format={format} />
            {delta !== null && (
              <span className={`kpi-delta ml-[var(--space-2)] ${delta >= 0 ? 'positive' : 'negative'}`}>
                {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
              </span>
            )}
          </div>
          {sparklineData && <Sparkline data={sparklineData} />}
        </div>
      </motion.div>
    </MetricTooltip>
  );
}
