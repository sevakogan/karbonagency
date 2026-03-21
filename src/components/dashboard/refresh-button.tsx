'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface RefreshButtonProps {
  companyId: string;
  onRefreshComplete?: () => void;
}

export function RefreshButton({ companyId, onRefreshComplete }: RefreshButtonProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch(`/api/sync/${companyId}`, { method: 'POST' });
      onRefreshComplete?.();
    } catch (err) {
      console.error('Refresh failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className="flex items-center gap-[var(--space-2)] px-[var(--space-3)] py-[var(--space-2)]"
      style={{
        background: 'var(--fill-tertiary)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-full)',
        color: 'var(--text-secondary)',
        fontSize: 'var(--text-caption-1)',
        fontWeight: 500,
        cursor: isRefreshing ? 'not-allowed' : 'pointer',
        opacity: isRefreshing ? 0.6 : 1,
      }}
    >
      <motion.div
        animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
        transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
      >
        <RefreshCw size={14} />
      </motion.div>
      {isRefreshing ? 'Syncing...' : 'Refresh'}
    </button>
  );
}
