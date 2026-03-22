'use client';

import { Users, UserCheck, AlertTriangle, UserX, DollarSign, TrendingUp, TrendingDown, RotateCcw } from 'lucide-react';
import type { AnalyticsData } from './marketing-command-center';

interface PulseBarProps {
  analytics: AnalyticsData | null;
  loading: boolean;
  activeStatus: 'all' | 'active' | 'at_risk' | 'churned';
  onStatusClick: (status: 'all' | 'active' | 'at_risk' | 'churned') => void;
}

interface PulseCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  active?: boolean;
  accentColor?: string;
  subtitle?: React.ReactNode;
  onClick?: () => void;
  loading?: boolean;
}

function PulseCard({ label, value, icon, active, accentColor, subtitle, onClick, loading }: PulseCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative overflow-hidden rounded-xl p-2.5 backdrop-blur-xl transition-all duration-200 text-left w-full"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
        border: active
          ? `1.5px solid ${accentColor ?? 'var(--accent)'}`
          : '1px solid var(--glass-border)',
        boxShadow: active
          ? `var(--shadow-card), 0 0 16px ${accentColor ?? 'var(--accent)'}22`
          : 'var(--shadow-card)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {/* Gloss */}
      <div
        className="absolute top-0 left-[8%] right-[8%] h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, var(--gloss-highlight-strong), transparent)' }}
      />

      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color: accentColor ?? 'var(--text-tertiary)' }}>{icon}</span>
        <p
          className="text-[8px] font-semibold uppercase tracking-wider"
          style={{ color: active ? accentColor : 'var(--text-quaternary)' }}
        >
          {label}
        </p>
      </div>

      {loading ? (
        <div className="skeleton h-6 w-16 rounded" />
      ) : (
        <p
          className="text-base font-bold tabular-nums leading-tight"
          style={{ color: active ? accentColor : 'var(--text-primary)' }}
        >
          {value}
        </p>
      )}

      {subtitle && !loading && (
        <div className="mt-0.5">{subtitle}</div>
      )}
    </button>
  );
}

function formatCurrency(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

export function PulseBar({ analytics, loading, activeStatus, onStatusClick }: PulseBarProps) {
  const summary = analytics?.summary;

  const revenueDelta = summary
    ? summary.revenue_last_month > 0
      ? ((summary.revenue_this_month - summary.revenue_last_month) / summary.revenue_last_month) * 100
      : 0
    : 0;
  const deltaIsUp = revenueDelta >= 0;

  return (
    <div className="grid grid-cols-8 gap-1.5">
      <PulseCard
        label="Total"
        value={summary?.total ?? 0}
        icon={<Users size={12} />}
        active={activeStatus === 'all'}
        onClick={() => onStatusClick('all')}
        loading={loading}
      />

      <PulseCard
        label="Active"
        value={summary?.active ?? 0}
        icon={<UserCheck size={12} />}
        accentColor="#22c55e"
        active={activeStatus === 'active'}
        onClick={() => onStatusClick('active')}
        loading={loading}
      />

      <PulseCard
        label="Med Risk"
        value={summary?.medium_risk ?? 0}
        icon={<AlertTriangle size={12} />}
        accentColor="#fbbf24"
        active={activeStatus === ('medium_risk' as any)}
        onClick={() => onStatusClick('medium_risk' as any)}
        loading={loading}
      />

      <PulseCard
        label="High Risk"
        value={summary?.high_risk ?? 0}
        icon={<AlertTriangle size={12} />}
        accentColor="#f97316"
        active={activeStatus === ('high_risk' as any)}
        onClick={() => onStatusClick('high_risk' as any)}
        loading={loading}
      />

      <PulseCard
        label="Churned"
        value={summary?.churned ?? 0}
        icon={<UserX size={12} />}
        accentColor="#ef4444"
        active={activeStatus === 'churned'}
        onClick={() => onStatusClick('churned')}
        loading={loading}
      />

      <PulseCard
        label="Revenue This Month"
        value={summary ? formatCurrency(summary.revenue_this_month) : '$0'}
        icon={<DollarSign size={12} />}
        loading={loading}
        subtitle={
          summary && summary.revenue_last_month > 0 ? (
            <span
              className="text-[9px] font-semibold inline-flex items-center gap-0.5"
              style={{ color: deltaIsUp ? 'var(--system-green)' : 'var(--system-red)' }}
            >
              {deltaIsUp ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
              {Math.abs(revenueDelta).toFixed(1)}% vs last month
            </span>
          ) : null
        }
      />

      <PulseCard
        label="Avg Lifetime Value"
        value={summary ? formatCurrency(summary.avg_lifetime_value) : '$0'}
        icon={<DollarSign size={12} />}
        loading={loading}
      />

      {analytics?.refunds && (
        <PulseCard
          label="Refund Rate"
          value={`${analytics.refunds.refund_rate_pct.toFixed(1)}%`}
          icon={<RotateCcw size={12} />}
          accentColor={analytics.refunds.refund_rate_pct > 5 ? '#ef4444' : '#22c55e'}
          loading={loading}
          subtitle={
            <span className="text-[9px] font-medium" style={{ color: 'var(--text-tertiary)' }}>
              ${analytics.refunds.total_refunded.toLocaleString()} refunded
            </span>
          }
        />
      )}
    </div>
  );
}
