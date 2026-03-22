'use client';

import { useMemo } from 'react';
import { Calendar, Clock, DollarSign, Tag, MessageSquare } from 'lucide-react';
import type { CustomerRecord } from './marketing-command-center';

interface CustomerExpandedProps {
  customer: CustomerRecord;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function daysBetween(a: string, b: string): number {
  const msPerDay = 86400000;
  return Math.round(
    Math.abs(new Date(b).getTime() - new Date(a).getTime()) / msPerDay,
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-xl px-3 py-2"
      style={{ background: 'var(--fill-quaternary)' }}
    >
      <p className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-quaternary)' }}>
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  );
}

export function CustomerExpanded({ customer }: CustomerExpandedProps) {
  const bookings = customer.bookings ?? [];
  const sortedBookings = useMemo(
    () => [...bookings].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [bookings],
  );

  const signupToFirst = useMemo(() => {
    if (!customer.first_booking_date) return null;
    return daysBetween(customer.first_booking_date, customer.first_booking_date);
  }, [customer.first_booking_date]);

  const firstToSecond = useMemo(() => {
    if (sortedBookings.length < 2) return null;
    return daysBetween(sortedBookings[0].date, sortedBookings[1].date);
  }, [sortedBookings]);

  const couponHistory = useMemo(() => {
    return sortedBookings
      .filter((b) => b.coupon_code)
      .map((b) => ({ date: b.date, code: b.coupon_code!, amount: b.amount }));
  }, [sortedBookings]);

  return (
    <div
      className="rounded-2xl p-4 backdrop-blur-xl"
      style={{
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
        WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate))',
        border: '1px solid var(--glass-border)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Quick metrics */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        <MetricPill label="Lifetime" value={`$${(customer.lifetime_spend ?? 0).toLocaleString()}`} />
        <MetricPill label="30d Spend" value={`$${(customer.thirty_day_spend ?? 0).toLocaleString()}`} />
        <MetricPill label="Avg Gap" value={`${customer.avg_gap_days}d`} />
        <MetricPill
          label="Signup to 1st"
          value={signupToFirst !== null ? `${signupToFirst}d` : '--'}
        />
        <MetricPill
          label="1st to 2nd"
          value={firstToSecond !== null ? `${firstToSecond}d` : '--'}
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Booking timeline */}
        <div>
          <p
            className="text-[9px] font-semibold uppercase tracking-wider mb-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Booking Timeline
          </p>
          {sortedBookings.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--text-quaternary)' }}>
              No bookings recorded.
            </p>
          ) : (
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {sortedBookings.map((booking, idx) => (
                <div
                  key={booking.id}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5"
                  style={{ background: idx % 2 === 0 ? 'var(--fill-quaternary)' : 'transparent' }}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <Calendar size={10} style={{ color: 'var(--text-quaternary)', flexShrink: 0 }} />
                    <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      {formatDate(booking.date)}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {booking.package_name}
                  </span>
                  <span className="text-[10px] font-semibold tabular-nums ml-auto" style={{ color: 'var(--system-green)' }}>
                    ${booking.amount}
                  </span>
                  {booking.coupon_code && (
                    <span
                      className="text-[8px] font-medium rounded px-1 py-0.5"
                      style={{ background: 'var(--system-purple)', color: '#fff', opacity: 0.8 }}
                    >
                      {booking.coupon_code}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Coupon history + Actions */}
        <div className="flex flex-col gap-3">
          {/* Coupon history */}
          <div>
            <p
              className="text-[9px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: 'var(--text-tertiary)' }}
            >
              Coupon History
            </p>
            {couponHistory.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-quaternary)' }}>
                No coupons used.
              </p>
            ) : (
              <div className="space-y-1">
                {couponHistory.map((ch, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-[10px]">
                    <Tag size={9} style={{ color: 'var(--system-purple)' }} />
                    <span style={{ color: 'var(--text-secondary)' }}>{formatDate(ch.date)}</span>
                    <span className="font-medium" style={{ color: 'var(--system-purple)' }}>{ch.code}</span>
                    <span className="ml-auto tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                      ${ch.amount}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-auto pt-2" style={{ borderTop: '1px solid var(--separator)' }}>
            <div className="relative group inline-block">
              <button
                type="button"
                disabled
                className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-semibold opacity-50 cursor-not-allowed"
                style={{
                  background: 'var(--fill-quaternary)',
                  color: 'var(--text-tertiary)',
                }}
              >
                <MessageSquare size={12} />
                Send SMS
              </button>
              <div
                className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 rounded-lg px-2 py-1 text-[9px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{
                  background: 'var(--glass-bg-heavy)',
                  border: '1px solid var(--glass-border-strong)',
                  color: 'var(--text-secondary)',
                }}
              >
                Coming Soon
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
