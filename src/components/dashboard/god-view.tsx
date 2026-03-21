'use client';

import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { staggerContainer, staggerItem, pageVariants } from '@/lib/animations';
import { CompanyCard } from './company-card';
import { DateRangePicker } from './date-range-picker';
import { KpiRow } from './kpi-row';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { Company, IntegrationStatus } from '@/types';
import { useState } from 'react';

interface CompanyWithMetrics {
  company: Company;
  totalSpend: number;
  totalImpressions: number;
  totalConversions: number;
  connectedPlatforms: number;
  syncStatus: IntegrationStatus;
  sparklineData: number[];
}

interface GodViewProps {
  companies: CompanyWithMetrics[];
  globalKpis: {
    totalSpend: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    avgRoas: number;
    avgCpc: number;
  };
  userName?: string;
}

export function GodView({ companies, globalKpis, userName }: GodViewProps) {
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'mtd' | 'custom'>('7d');

  const drafts = companies.filter((c) => c.company.setup_step !== null);
  const active = companies.filter((c) => c.company.setup_step === null);

  const kpis = [
    { metricKey: 'spend', label: 'Total Spend', value: globalKpis.totalSpend, format: 'currency' as const },
    { metricKey: 'impressions', label: 'Impressions', value: globalKpis.totalImpressions, format: 'number' as const },
    { metricKey: 'clicks', label: 'Clicks', value: globalKpis.totalClicks, format: 'number' as const },
    { metricKey: 'conversions', label: 'Conversions', value: globalKpis.totalConversions, format: 'number' as const },
    { metricKey: 'roas', label: 'Avg ROAS', value: globalKpis.avgRoas, format: 'multiplier' as const },
    { metricKey: 'cpc', label: 'Avg CPC', value: globalKpis.avgCpc, format: 'currency' as const },
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
        <div>
          <h1
            className="font-bold"
            style={{ fontSize: 'var(--text-large-title)', color: 'var(--text-primary)' }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>
            {userName ? `Welcome back, ${userName}` : 'Welcome back'} — all your companies at a glance.
          </p>
        </div>
        <div className="flex items-center gap-[var(--space-3)]">
          <DateRangePicker value={dateRange} onChange={setDateRange} />
          <ThemeToggle />
          <Link
            href="/dashboard/companies/new"
            className="flex items-center gap-[var(--space-2)] px-[var(--space-4)] py-[var(--space-2)]"
            style={{
              background: 'var(--accent)',
              color: 'white',
              borderRadius: 'var(--radius-full)',
              fontSize: 'var(--text-subhead)',
              fontWeight: 600,
              textDecoration: 'none',
              minHeight: 'var(--tap-min)',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <Plus size={18} />
            Add Company
          </Link>
        </div>
      </div>

      {/* Global KPI Row */}
      <div className="mb-[var(--space-8)]">
        <KpiRow kpis={kpis} />
      </div>

      {/* Draft companies */}
      {drafts.length > 0 && (
        <div className="mb-[var(--space-6)]">
          <h2
            className="font-semibold mb-[var(--space-3)]"
            style={{ fontSize: 'var(--text-headline)', color: 'var(--text-secondary)' }}
          >
            In Progress
          </h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-4)]"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {drafts.map(({ company }) => (
              <CompanyCard
                key={company.id}
                company={company}
                isDraft
              />
            ))}
          </motion.div>
        </div>
      )}

      {/* Active company cards */}
      <div>
        <h2
          className="font-semibold mb-[var(--space-3)]"
          style={{ fontSize: 'var(--text-headline)', color: 'var(--text-secondary)' }}
        >
          Companies ({active.length})
        </h2>
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-4)]"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {active.map((item) => (
            <CompanyCard
              key={item.company.id}
              company={item.company}
              totalSpend={item.totalSpend}
              totalImpressions={item.totalImpressions}
              totalConversions={item.totalConversions}
              connectedPlatforms={item.connectedPlatforms}
              syncStatus={item.syncStatus}
              sparklineData={item.sparklineData}
            />
          ))}
        </motion.div>

        {active.length === 0 && drafts.length === 0 && (
          <div
            className="text-center py-[var(--space-12)]"
            style={{ color: 'var(--text-tertiary)' }}
          >
            <p className="mb-[var(--space-4)]" style={{ fontSize: 'var(--text-headline)' }}>
              No companies yet
            </p>
            <Link
              href="/dashboard/companies/new"
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
              <Plus size={18} />
              Add your first company
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
