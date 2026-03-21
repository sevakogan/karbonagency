'use client';

import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { KpiCard } from './kpi-card';

interface KpiData {
  metricKey: string;
  label: string;
  value: number;
  previousValue?: number;
  format?: 'currency' | 'number' | 'percentage' | 'multiplier';
  sparklineData?: number[];
}

interface KpiRowProps {
  kpis: KpiData[];
  selectedMetric?: string;
  onSelectMetric?: (metricKey: string) => void;
}

export function KpiRow({ kpis, selectedMetric, onSelectMetric }: KpiRowProps) {
  return (
    <motion.div
      className="flex gap-[var(--space-3)] overflow-x-auto pb-[var(--space-2)] scrollbar-hide"
      style={{ WebkitOverflowScrolling: 'touch' }}
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {kpis.map((kpi) => (
        <motion.div key={kpi.metricKey} variants={staggerItem}>
          <KpiCard
            {...kpi}
            selected={selectedMetric === kpi.metricKey}
            onClick={() => onSelectMetric?.(kpi.metricKey)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
