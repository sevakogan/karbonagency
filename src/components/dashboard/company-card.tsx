'use client';

import { motion } from 'framer-motion';
import { staggerItem } from '@/lib/animations';
import { StatusBadge } from '@/components/ui/status-badge';
import { MetricTooltip } from '@/components/ui/metric-tooltip';
import type { Company, IntegrationStatus } from '@/types';
import Link from 'next/link';

interface CompanyCardProps {
  company: Company;
  totalSpend?: number;
  totalImpressions?: number;
  totalConversions?: number;
  connectedPlatforms?: number;
  syncStatus?: IntegrationStatus;
  sparklineData?: number[];
  isDraft?: boolean;
}

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 48;
  const h = 20;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function CompanyCard({
  company,
  totalSpend = 0,
  totalImpressions = 0,
  totalConversions = 0,
  connectedPlatforms = 0,
  syncStatus = 'disconnected',
  sparklineData = [],
  isDraft = false,
}: CompanyCardProps) {
  const href = isDraft
    ? `/dashboard/companies/new?resume=${company.id}`
    : `/dashboard/companies/${company.id}`;

  return (
    <motion.div variants={staggerItem}>
      <Link href={href}>
        <motion.div
          className="glass-card p-[var(--space-4)] cursor-pointer"
          style={{
            opacity: isDraft ? 0.7 : 1,
            borderStyle: isDraft ? 'dashed' : 'solid',
          }}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
        >
          {/* Header */}
          <div className="flex items-center gap-[var(--space-3)] mb-[var(--space-3)]">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={company.name}
                className="w-10 h-10 object-cover"
                style={{ borderRadius: 'var(--radius-sm)' }}
              />
            ) : (
              <div
                className="w-10 h-10 flex items-center justify-center font-bold"
                style={{
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--accent-muted)',
                  color: 'var(--accent)',
                  fontSize: 'var(--text-headline)',
                }}
              >
                {company.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3
                className="font-semibold truncate"
                style={{ fontSize: 'var(--text-headline)', color: 'var(--text-primary)' }}
              >
                {company.name}
              </h3>
              {company.website_url && (
                <p
                  className="truncate"
                  style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-tertiary)' }}
                >
                  {company.website_url.replace(/^https?:\/\//, '')}
                </p>
              )}
            </div>
            <StatusBadge status={syncStatus} />
          </div>

          {isDraft ? (
            <div
              className="text-center py-[var(--space-3)]"
              style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}
            >
              Continue setup — Step {company.setup_step} of 6
            </div>
          ) : (
            <>
              {/* Metrics row */}
              <div className="flex items-center justify-between">
                <div className="flex gap-[var(--space-4)]">
                  <MetricTooltip metricKey="spend" value={totalSpend}>
                    <div>
                      <div className="kpi-label">Spend</div>
                      <div
                        className="font-semibold"
                        style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
                      >
                        ${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </MetricTooltip>
                  <MetricTooltip metricKey="impressions" value={totalImpressions}>
                    <div>
                      <div className="kpi-label">Impr.</div>
                      <div
                        className="font-semibold"
                        style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {totalImpressions >= 1000 ? `${(totalImpressions / 1000).toFixed(1)}k` : totalImpressions}
                      </div>
                    </div>
                  </MetricTooltip>
                  <MetricTooltip metricKey="conversions" value={totalConversions}>
                    <div>
                      <div className="kpi-label">Conv.</div>
                      <div
                        className="font-semibold"
                        style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
                      >
                        {totalConversions}
                      </div>
                    </div>
                  </MetricTooltip>
                </div>
                <MiniSparkline data={sparklineData} />
              </div>

              {/* Footer */}
              <div
                className="mt-[var(--space-3)] pt-[var(--space-2)] flex items-center justify-between"
                style={{ borderTop: '1px solid var(--separator)' }}
              >
                <MetricTooltip metricKey="connected_platforms">
                  <span style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-tertiary)' }}>
                    {connectedPlatforms} platforms connected
                  </span>
                </MetricTooltip>
              </div>
            </>
          )}
        </motion.div>
      </Link>
    </motion.div>
  );
}
