'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw, Settings, Plug, BarChart3, Megaphone, HeartPulse } from 'lucide-react';
import type { Company } from '@/types';

interface Props {
  company: Company;
  connectedPlatforms: string[];
  selectedPlatforms: Set<string>;
  refreshing: boolean;
  onRefresh: () => void;
  lastSyncedAt?: string | null;
  activeTab?: 'dashboard' | 'marketing' | 'lifeline';
}

export function DashboardHeader({
  company,
  connectedPlatforms,
  selectedPlatforms,
  refreshing,
  onRefresh,
  lastSyncedAt,
  activeTab = 'dashboard',
}: Props) {
  const router = useRouter();
  const initial = (company.company_name ?? company.name)?.[0]?.toUpperCase() ?? '?';

  return (
    <>
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
            {lastSyncedAt && (
              <span className="ml-1.5 opacity-60">
                · Synced {(() => {
                  const diff = Date.now() - new Date(lastSyncedAt).getTime();
                  const mins = Math.floor(diff / 60000);
                  if (mins < 1) return 'just now';
                  if (mins < 60) return `${mins}m ago`;
                  const hrs = Math.floor(mins / 60);
                  if (hrs < 24) return `${hrs}h ago`;
                  return `${Math.floor(hrs / 24)}d ago`;
                })()}
              </span>
            )}
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

    {/* Tabs: Dashboard / Marketing */}
    <div className="flex gap-1 mt-3 p-1 rounded-xl w-fit" style={{ background: 'var(--fill-quaternary)' }}>
      <Link
        href={`/dashboard/companies/${company.id}`}
        className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
        style={{
          background: activeTab === 'dashboard' ? 'var(--bg-primary)' : 'transparent',
          color: activeTab === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)',
          boxShadow: activeTab === 'dashboard' ? 'var(--shadow-card)' : 'none',
        }}
      >
        <BarChart3 size={13} />
        Dashboard
      </Link>
      <Link
        href="/dashboard/marketing"
        className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
        style={{
          background: activeTab === 'marketing' ? 'var(--bg-primary)' : 'transparent',
          color: activeTab === 'marketing' ? 'var(--text-primary)' : 'var(--text-secondary)',
          boxShadow: activeTab === 'marketing' ? 'var(--shadow-card)' : 'none',
        }}
      >
        <Megaphone size={13} />
        Marketing
      </Link>
      <Link
        href="/dashboard/lifeline"
        className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all"
        style={{
          background: activeTab === 'lifeline' ? 'var(--bg-primary)' : 'transparent',
          color: activeTab === 'lifeline' ? 'var(--text-primary)' : 'var(--text-secondary)',
          boxShadow: activeTab === 'lifeline' ? 'var(--shadow-card)' : 'none',
        }}
      >
        <HeartPulse size={13} />
        Lifeline
      </Link>
    </div>
    </>
  );
}
