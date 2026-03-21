'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings2, Wifi, WifiOff } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import type { PlatformCatalogEntry, CompanyIntegration, IntegrationStatus } from '@/types';

interface IntegrationCardProps {
  platform: PlatformCatalogEntry;
  integration?: CompanyIntegration;
  onConfigure: (platform: PlatformCatalogEntry) => void;
  onToggle: (platformSlug: string, enabled: boolean) => void;
}

const categoryColors: Record<string, string> = {
  ads: 'var(--system-blue)',
  analytics: 'var(--system-green)',
  reviews: 'var(--system-amber)',
  seo: 'var(--system-purple)',
};

export function IntegrationCard({ platform, integration, onConfigure, onToggle }: IntegrationCardProps) {
  const status: IntegrationStatus = integration?.status ?? 'disconnected';
  const isEnabled = integration?.is_enabled ?? false;
  const categoryColor = categoryColors[platform.category] ?? 'var(--text-tertiary)';

  return (
    <motion.div
      className="glass-card p-[var(--space-4)]"
      whileHover={{ scale: 1.01 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-[var(--space-3)]">
        <div className="flex items-center gap-[var(--space-3)]">
          <div
            className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center font-bold text-white"
            style={{ background: categoryColor, fontSize: '14px' }}
          >
            {platform.display_name.charAt(0)}
          </div>
          <div>
            <h4
              className="font-semibold"
              style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)' }}
            >
              {platform.display_name}
            </h4>
            <span
              className="inline-block px-[var(--space-2)] py-[1px] rounded-[var(--radius-full)] font-medium"
              style={{
                fontSize: 'var(--text-caption-2)',
                background: `color-mix(in srgb, ${categoryColor} 15%, transparent)`,
                color: categoryColor,
              }}
            >
              {platform.category}
            </span>
          </div>
        </div>
        <ToggleSwitch
          checked={isEnabled}
          onChange={(checked) => onToggle(platform.slug, checked)}
        />
      </div>

      {/* Status line */}
      <div className="flex items-center justify-between">
        <StatusBadge
          status={status}
          label={integration?.status_detail ?? undefined}
        />

        {!platform.sync_enabled && (
          <span
            style={{ fontSize: 'var(--text-caption-2)', color: 'var(--text-quaternary)' }}
          >
            Sync coming soon
          </span>
        )}
      </div>

      {/* Error message */}
      {integration?.error_message && (
        <p
          className="mt-[var(--space-2)]"
          style={{ fontSize: 'var(--text-caption-1)', color: 'var(--system-red)' }}
        >
          {integration.error_message}
        </p>
      )}

      {/* Configure button */}
      <button
        onClick={() => onConfigure(platform)}
        className="w-full mt-[var(--space-3)] flex items-center justify-center gap-[var(--space-2)]"
        style={{
          background: 'var(--fill-tertiary)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-full)',
          padding: '10px 16px',
          fontSize: 'var(--text-subhead)',
          fontWeight: 500,
          color: 'var(--text-primary)',
          cursor: 'pointer',
          minHeight: 'var(--tap-min)',
        }}
      >
        {status === 'disconnected' ? (
          <>
            <Wifi size={16} /> Connect
          </>
        ) : (
          <>
            <Settings2 size={16} /> Configure
          </>
        )}
      </button>
    </motion.div>
  );
}
