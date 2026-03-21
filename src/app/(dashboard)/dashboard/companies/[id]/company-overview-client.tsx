'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Plug, Settings } from 'lucide-react';
import Link from 'next/link';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/animations';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { DateRangePicker } from '@/components/dashboard/date-range-picker';
import { RefreshButton } from '@/components/dashboard/refresh-button';
import { StatusBadge } from '@/components/ui/status-badge';
import type { Company, CompanyIntegration } from '@/types';

interface Props {
  company: Company;
  integrations: CompanyIntegration[];
}

export function CompanyOverviewClient({ company, integrations }: Props) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'mtd' | 'custom'>('30d');
  const connectedCount = integrations.filter((i) => i.status === 'connected').length;

  const overallStatus = integrations.some((i) => i.status === 'error')
    ? 'error' as const
    : integrations.some((i) => i.status === 'connected')
      ? 'connected' as const
      : 'disconnected' as const;

  // KPI data (will be populated from daily_metrics in a future pass)
  const kpis = [
    { metricKey: 'spend', label: 'Total Spend', value: 0, format: 'currency' as const },
    { metricKey: 'impressions', label: 'Impressions', value: 0, format: 'number' as const },
    { metricKey: 'clicks', label: 'Clicks', value: 0, format: 'number' as const },
    { metricKey: 'conversions', label: 'Conversions', value: 0, format: 'number' as const },
    { metricKey: 'roas', label: 'ROAS', value: 0, format: 'multiplier' as const },
    { metricKey: 'cpc', label: 'CPC', value: 0, format: 'currency' as const },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-[var(--space-6)]">
        <div className="flex items-center gap-[var(--space-4)]">
          <Link
            href="/dashboard"
            className="flex items-center justify-center w-10 h-10"
            style={{
              background: 'var(--fill-quaternary)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--text-secondary)',
            }}
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-[var(--space-3)]">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-12 h-12 object-cover"
                style={{ borderRadius: 'var(--radius-sm)' }}
              />
            ) : (
              <div
                className="w-12 h-12 flex items-center justify-center font-bold text-xl"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-muted)',
                  color: 'var(--accent)',
                }}
              >
                {company.name.charAt(0)}
              </div>
            )}
            <div>
              <h1
                className="font-bold"
                style={{ fontSize: 'var(--text-title-2)', color: 'var(--text-primary)' }}
              >
                {company.name}
              </h1>
              <div className="flex items-center gap-[var(--space-3)]">
                {company.website_url && (
                  <a
                    href={company.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-[var(--space-1)]"
                    style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-tertiary)' }}
                  >
                    <Globe size={12} />
                    {company.website_url.replace(/^https?:\/\//, '')}
                  </a>
                )}
                <StatusBadge status={overallStatus} label={`${connectedCount} platforms`} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <RefreshButton companyId={company.id} />
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <Link
            href={`/dashboard/companies/${company.id}/platforms`}
            className="flex items-center gap-1.5 px-3 py-1.5"
            style={{
              background: 'var(--fill-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <Plug size={13} />
            Platforms
          </Link>
          <Link
            href={`/dashboard/companies/${company.id}/settings`}
            className="flex items-center gap-1.5 px-3 py-1.5"
            style={{
              background: 'var(--fill-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            <Settings size={13} />
            Settings
          </Link>
        </div>
      </div>

      {/* KPI Row */}
      <div className="mb-[var(--space-6)]">
        <KpiRow kpis={kpis} />
      </div>

      {/* Platform cards */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-4)]"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {integrations
          .filter((i) => i.status === 'connected')
          .map((integration) => (
            <motion.div key={integration.id} variants={staggerItem}>
              <Link
                href={`/dashboard/companies/${company.id}/${integration.platform_slug.replace('_', '-')}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="glass-card p-[var(--space-4)]">
                  <div className="flex items-center justify-between mb-[var(--space-2)]">
                    <span
                      className="font-semibold"
                      style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)' }}
                    >
                      {integration.platform_slug.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                    </span>
                    <StatusBadge status={integration.status} size="sm" />
                  </div>
                  {integration.last_synced_at && (
                    <p style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-tertiary)' }}>
                      Last synced: {new Date(integration.last_synced_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
      </motion.div>

      {/* Empty state */}
      {connectedCount === 0 && (
        <div
          className="text-center py-[var(--space-12)]"
          style={{ color: 'var(--text-tertiary)' }}
        >
          <p className="mb-[var(--space-4)]" style={{ fontSize: 'var(--text-headline)' }}>
            No platforms connected yet
          </p>
          <Link
            href={`/dashboard/companies/${company.id}/platforms`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              background: 'var(--accent)',
              color: 'white',
              borderRadius: 'var(--radius-full)',
              padding: '12px 24px',
              fontSize: 'var(--text-body)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Connect your first platform
          </Link>
        </div>
      )}
    </motion.div>
  );
}
