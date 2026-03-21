'use client';

import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { PlatformCatalogEntry, CompanyIntegration, IntegrationStatus } from '@/types';

interface IntegrationCardProps {
  platform: PlatformCatalogEntry;
  integration?: CompanyIntegration;
  onConfigure: (platform: PlatformCatalogEntry) => void;
  onToggle: (platformSlug: string, enabled: boolean) => void;
}

const categoryColors: Record<string, string> = {
  ads: '#007AFF',
  analytics: '#30D158',
  reviews: '#FF9F0A',
  seo: '#BF5AF2',
};

const statusLabel: Record<IntegrationStatus, { text: string; color: string }> = {
  connected: { text: 'Connected', color: 'var(--system-green)' },
  error: { text: 'Error', color: 'var(--system-red)' },
  syncing: { text: 'Syncing', color: 'var(--system-green)' },
  disconnected: { text: '', color: 'var(--text-quaternary)' },
};

export function IntegrationCard({ platform, integration, onConfigure }: IntegrationCardProps) {
  const status: IntegrationStatus = integration?.status ?? 'disconnected';
  const isConnected = status === 'connected';
  const categoryColor = categoryColors[platform.category] ?? '#8E8E93';
  const statusInfo = statusLabel[status];

  return (
    <motion.button
      onClick={() => onConfigure(platform)}
      className="w-full flex items-center gap-3 text-left cursor-pointer"
      style={{ padding: '10px 14px', background: 'transparent', border: 'none' }}
      whileHover={{ background: 'var(--fill-quaternary)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
    >
      {/* Platform icon — iOS app icon style */}
      <div
        className="flex-shrink-0 flex items-center justify-center text-white font-semibold"
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: `linear-gradient(145deg, ${categoryColor}, color-mix(in srgb, ${categoryColor} 75%, #000))`,
          fontSize: '13px',
          boxShadow: `0 1px 3px color-mix(in srgb, ${categoryColor} 30%, transparent)`,
        }}
      >
        {platform.display_name.charAt(0)}
      </div>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span
          className="block truncate"
          style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 400 }}
        >
          {platform.display_name}
        </span>
      </div>

      {/* Right side — status or "Coming soon" */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {isConnected ? (
          <span style={{ fontSize: '13px', color: statusInfo.color }}>
            {statusInfo.text}
          </span>
        ) : status === 'error' ? (
          <span style={{ fontSize: '13px', color: 'var(--system-red)' }}>Error</span>
        ) : !platform.sync_enabled ? (
          <span style={{ fontSize: '13px', color: 'var(--text-quaternary)' }}>Soon</span>
        ) : (
          <span style={{ fontSize: '13px', color: 'var(--text-quaternary)' }}>Off</span>
        )}
        <ChevronRight size={14} style={{ color: 'var(--text-quaternary)' }} />
      </div>
    </motion.button>
  );
}
