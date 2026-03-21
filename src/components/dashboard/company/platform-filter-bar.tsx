'use client';

import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/lib/dashboard/platform-config';
import type { DateRange } from '@/lib/dashboard/use-dashboard-data';

interface Props {
  connectedPlatforms: string[];
  selectedPlatforms: Set<string>;
  onTogglePlatform: (slug: string) => void;
  onSelectAll: () => void;
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
}

const DATE_OPTIONS: { label: string; value: DateRange }[] = [
  { label: 'Today', value: 'today' },
  { label: '3D', value: '3d' },
  { label: '7D', value: '7d' },
  { label: '30D', value: '30d' },
  { label: 'MTD', value: 'mtd' },
  { label: '90D', value: '90d' },
];

export function PlatformFilterBar({
  connectedPlatforms,
  selectedPlatforms,
  onTogglePlatform,
  onSelectAll,
  dateRange,
  onDateRangeChange,
}: Props) {
  const allSelected = selectedPlatforms.size === connectedPlatforms.length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      {/* Platform pills */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={onSelectAll}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all
            ${allSelected
              ? 'bg-[var(--accent)] text-white'
              : 'bg-[var(--bg-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }`}
        >
          All
        </button>

        {connectedPlatforms.map((slug) => {
          const active = selectedPlatforms.has(slug);
          const color = PLATFORM_COLORS[slug] ?? '#888';
          return (
            <button
              key={slug}
              onClick={() => onTogglePlatform(slug)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs
                font-medium transition-all
                ${active
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-quaternary)] opacity-50 hover:opacity-80'
                }`}
              style={active ? { boxShadow: `0 0 8px ${color}40` } : undefined}
            >
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              {PLATFORM_NAMES[slug] ?? slug}
            </button>
          );
        })}
      </div>

      {/* Date range segmented control */}
      <div className="flex items-center gap-0.5 rounded-lg bg-[var(--bg-elevated)] p-0.5">
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onDateRangeChange(opt.value)}
            className={`rounded-md px-2.5 py-1 text-[10px] font-semibold transition-all
              ${dateRange === opt.value
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
