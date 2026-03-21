'use client';

import { X } from 'lucide-react';
import type { MarketingFilters } from './marketing-command-center';

interface ActiveFiltersProps {
  filters: MarketingFilters;
  totalCount: number;
  filteredCount: number;
  onRemoveFilter: <K extends keyof MarketingFilters>(key: K, value: MarketingFilters[K]) => void;
  onClearAll: () => void;
}

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium"
      style={{
        background: 'var(--accent-muted)',
        color: 'var(--accent)',
        border: '1px solid var(--accent-glass)',
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 rounded-full p-0.5 transition-colors hover:opacity-70"
      >
        <X size={10} />
      </button>
    </span>
  );
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  at_risk: 'At Risk',
  churned: 'Churned',
};

const PERIOD_LABELS: Record<string, string> = {
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
  all: 'All Time',
};

export function ActiveFilters({
  filters,
  totalCount,
  filteredCount,
  onRemoveFilter,
  onClearAll,
}: ActiveFiltersProps) {
  const chips: Array<{ label: string; onRemove: () => void }> = [];

  if (filters.status !== 'all') {
    chips.push({
      label: `Status: ${STATUS_LABELS[filters.status] ?? filters.status}`,
      onRemove: () => onRemoveFilter('status', 'all'),
    });
  }

  if (filters.search) {
    chips.push({
      label: `Search: "${filters.search}"`,
      onRemove: () => onRemoveFilter('search', ''),
    });
  }

  if (filters.spendMin !== undefined) {
    chips.push({
      label: `Min Spend: $${filters.spendMin}`,
      onRemove: () => onRemoveFilter('spendMin', undefined),
    });
  }

  if (filters.spendMax !== undefined) {
    chips.push({
      label: `Max Spend: $${filters.spendMax}`,
      onRemove: () => onRemoveFilter('spendMax', undefined),
    });
  }

  if (filters.couponCode) {
    chips.push({
      label: `Coupon: ${filters.couponCode}`,
      onRemove: () => onRemoveFilter('couponCode', undefined),
    });
  }

  if (filters.period !== '30d') {
    chips.push({
      label: `Period: ${PERIOD_LABELS[filters.period]}`,
      onRemove: () => onRemoveFilter('period', '30d'),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2"
      style={{
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <span
        className="text-[10px] font-medium shrink-0"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Showing {filteredCount} of {totalCount}
      </span>

      <div className="h-3 w-px shrink-0" style={{ background: 'var(--separator)' }} />

      <div className="flex flex-wrap items-center gap-1.5">
        {chips.map((chip) => (
          <FilterChip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
        ))}
      </div>

      <button
        type="button"
        onClick={onClearAll}
        className="ml-auto text-[10px] font-medium shrink-0 transition-colors hover:opacity-70"
        style={{ color: 'var(--accent)' }}
      >
        Clear All
      </button>
    </div>
  );
}
