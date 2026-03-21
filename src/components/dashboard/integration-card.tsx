'use client';

import { motion } from 'framer-motion';
import { Settings2, Wifi } from 'lucide-react';
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

const statusDotColor: Record<IntegrationStatus, string> = {
  connected: 'var(--system-green)',
  error: 'var(--system-red)',
  syncing: 'var(--system-green)',
  disconnected: 'var(--text-quaternary)',
};

export function IntegrationCard({ platform, integration, onConfigure, onToggle }: IntegrationCardProps) {
  const status: IntegrationStatus = integration?.status ?? 'disconnected';
  const isEnabled = integration?.is_enabled ?? false;
  const categoryColor = categoryColors[platform.category] ?? 'var(--text-tertiary)';
  const isConnected = status === 'connected';

  return (
    <motion.div
      style={{ padding: '8px 12px' }}
      whileHover={{ background: 'var(--fill-quaternary)' }}
      transition={{ duration: 0.15 }}
    >
      {/* Single row: icon + name + badge + toggle */}
      <div className="flex items-center gap-2.5">
        {/* Platform icon — small circle */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-semibold flex-shrink-0"
          style={{ background: categoryColor, fontSize: '11px' }}
        >
          {platform.display_name.charAt(0)}
        </div>

        {/* Name + status */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="font-medium truncate"
              style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.2 }}
            >
              {platform.display_name}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {/* Status dot */}
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: statusDotColor[status] }}
            />
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>
              {isConnected
                ? integration?.status_detail ?? 'Connected'
                : !platform.sync_enabled
                  ? 'Coming soon'
                  : 'Not connected'}
            </span>
          </div>
        </div>

        {/* Category pill */}
        <span
          className="flex-shrink-0 px-1.5 py-0.5 rounded-full font-medium"
          style={{
            fontSize: '9px',
            background: `color-mix(in srgb, ${categoryColor} 12%, transparent)`,
            color: categoryColor,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {platform.category}
        </span>

        {/* Connect button or toggle */}
        {isConnected ? (
          <ToggleSwitch
            checked={isEnabled}
            onChange={(checked) => onToggle(platform.slug, checked)}
          />
        ) : (
          <button
            onClick={() => onConfigure(platform)}
            className="flex items-center gap-1 flex-shrink-0"
            style={{
              background: 'var(--fill-tertiary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-full)',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--text-primary)',
              cursor: 'pointer',
            }}
          >
            <Wifi size={11} />
            Connect
          </button>
        )}

        {/* Settings gear for connected */}
        {isConnected && (
          <button
            onClick={() => onConfigure(platform)}
            className="flex-shrink-0"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-tertiary)',
              padding: '4px',
            }}
          >
            <Settings2 size={13} />
          </button>
        )}
      </div>

      {/* Error message — only if error */}
      {integration?.error_message && (
        <p
          className="mt-1.5 ml-9"
          style={{ fontSize: '10px', color: 'var(--system-red)', lineHeight: 1.3 }}
        >
          {integration.error_message}
        </p>
      )}
    </motion.div>
  );
}
