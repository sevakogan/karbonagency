'use client';

import { motion } from 'framer-motion';
import { pulseAnimation } from '@/lib/animations';
import type { IntegrationStatus } from '@/types';

interface StatusBadgeProps {
  status: IntegrationStatus;
  label?: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<IntegrationStatus, { className: string; text: string }> = {
  connected: { className: 'status-connected', text: 'Connected' },
  error: { className: 'status-error', text: 'Error' },
  syncing: { className: 'status-connected', text: 'Syncing' },
  disconnected: { className: 'status-disconnected', text: 'Disconnected' },
};

export function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <div className="flex items-center gap-[var(--space-2)]">
      {status === 'syncing' ? (
        <motion.div
          className={`${dotSize} rounded-full ${config.className}`}
          animate={pulseAnimation}
        />
      ) : (
        <div className={`${dotSize} rounded-full ${config.className}`} />
      )}
      <span
        className="text-[length:var(--text-caption-1)] font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label ?? config.text}
      </span>
    </div>
  );
}
