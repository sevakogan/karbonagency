'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Settings, Plug } from 'lucide-react';
import type { Company } from '@/types';

interface Props {
  company: Company;
  connectedPlatforms: string[];
  selectedPlatforms: Set<string>;
  refreshing: boolean;
  onRefresh: () => void;
}

export function DashboardHeader({
  company,
  connectedPlatforms,
  selectedPlatforms,
  refreshing,
  onRefresh,
}: Props) {
  const router = useRouter();
  const initial = (company.company_name ?? company.name)?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Left: back + company info */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex h-8 items-center gap-1.5 rounded-lg px-3
                     bg-[var(--bg-elevated)] text-[var(--text-secondary)]
                     transition-colors hover:text-[var(--text-primary)]
                     text-xs font-medium"
        >
          <ArrowLeft size={14} />
          Overview
        </button>

        {company.logo_url ? (
          <img
            src={company.logo_url}
            alt={company.name}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-full
                          bg-[var(--accent)] text-sm font-bold text-white">
            {initial}
          </div>
        )}

        <div>
          <h1 className="text-base font-semibold text-[var(--text-primary)]">
            {company.company_name ?? company.name}
          </h1>
          <p className="text-xs text-[var(--text-tertiary)]">
            {connectedPlatforms.length} platform{connectedPlatforms.length !== 1 ? 's' : ''} connected
          </p>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--bg-elevated)]
                     px-3 text-xs text-[var(--text-secondary)] transition-colors
                     hover:text-[var(--text-primary)] disabled:opacity-50"
        >
          <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>

        <Link
          href={`/dashboard/companies/${company.id}/platforms`}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--bg-elevated)]
                     px-3 text-xs text-[var(--text-secondary)] transition-colors
                     hover:text-[var(--text-primary)]"
        >
          <Plug size={13} />
          Platforms
        </Link>

        <Link
          href={`/dashboard/companies/${company.id}/settings`}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-[var(--bg-elevated)]
                     px-3 text-xs text-[var(--text-secondary)] transition-colors
                     hover:text-[var(--text-primary)]"
        >
          <Settings size={13} />
          Settings
        </Link>
      </div>
    </div>
  );
}
