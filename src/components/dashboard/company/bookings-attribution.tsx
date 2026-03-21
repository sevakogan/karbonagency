'use client';

import { useMemo } from 'react';
import { CalendarCheck, Zap, Leaf } from 'lucide-react';
import { PLATFORM_COLORS, PLATFORM_NAMES } from '@/lib/dashboard/platform-config';

interface BookingsAttributionProps {
  /** Total reservations/conversions from ShiftOS */
  reservations: number;
  /** Per-platform ad metrics for today */
  platformMetrics: Array<{
    platform: string;
    clicks: number;
    conversions: number;
    spend: number;
  }>;
}

export function BookingsAttribution({ reservations, platformMetrics }: BookingsAttributionProps) {
  const attribution = useMemo(() => {
    // Estimate ad-driven reservations by correlating platform conversions
    const adPlatforms = platformMetrics.filter(
      (p) => p.platform !== 'shiftos' && p.platform !== 'square' && p.clicks > 0
    );

    // Total ad conversions reported by platforms (these overlap with reservations)
    const totalAdConversions = adPlatforms.reduce((s, p) => s + p.conversions, 0);

    // Potential ad-driven = min of ad conversions and actual reservations
    const potentialAdDriven = Math.min(totalAdConversions, reservations);
    const likelyOrganic = Math.max(0, reservations - potentialAdDriven);

    // Per-platform attribution (proportional to conversions)
    const platformBreakdown = adPlatforms
      .filter((p) => p.conversions > 0)
      .map((p) => ({
        platform: p.platform,
        name: PLATFORM_NAMES[p.platform] ?? p.platform,
        color: PLATFORM_COLORS[p.platform] ?? '#888',
        estimated: Math.round((p.conversions / Math.max(totalAdConversions, 1)) * potentialAdDriven),
        spend: p.spend,
      }))
      .filter((p) => p.estimated > 0);

    // Cost per reservation (ad-driven only)
    const totalAdSpend = adPlatforms.reduce((s, p) => s + p.spend, 0);
    const costPerReservation = potentialAdDriven > 0 ? totalAdSpend / potentialAdDriven : 0;

    return { potentialAdDriven, likelyOrganic, platformBreakdown, costPerReservation, totalAdSpend };
  }, [reservations, platformMetrics]);

  if (reservations === 0) {
    return (
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
          Bookings Attribution
        </p>
        <p className="text-sm" style={{ color: 'var(--text-quaternary)' }}>No reservations today</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-tertiary)' }}>
        Bookings Attribution
      </p>

      {/* Total */}
      <div className="flex items-center gap-2 mb-3">
        <CalendarCheck size={16} style={{ color: 'var(--system-green)' }} />
        <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          {reservations}
        </span>
        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          reservations today
        </span>
      </div>

      {/* Tree */}
      <div className="space-y-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
        {/* Ad-driven */}
        <div className="flex items-start gap-2">
          <Zap size={12} className="mt-0.5 flex-shrink-0" style={{ color: '#FFCC00' }} />
          <div>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {attribution.potentialAdDriven}
            </span>
            {' '}potentially from ads
            {attribution.platformBreakdown.length > 0 && (
              <div className="mt-1 space-y-0.5 ml-1">
                {attribution.platformBreakdown.map((p) => (
                  <div key={p.platform} className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: p.color }}
                    />
                    <span>
                      {p.estimated} near {p.name} clicks
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Organic */}
        <div className="flex items-center gap-2">
          <Leaf size={12} className="flex-shrink-0" style={{ color: 'var(--system-green)' }} />
          <span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {attribution.likelyOrganic}
            </span>
            {' '}likely organic
          </span>
        </div>
      </div>

      {/* Cost per reservation */}
      {attribution.costPerReservation > 0 && (
        <div className="mt-3 pt-2" style={{ borderTop: '1px solid var(--separator)' }}>
          <div className="flex justify-between text-[10px]">
            <span style={{ color: 'var(--text-tertiary)' }}>Cost per reservation</span>
            <span className="font-bold" style={{ color: 'var(--text-primary)' }}>
              ${attribution.costPerReservation.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-[10px] mt-0.5">
            <span style={{ color: 'var(--text-tertiary)' }}>Ad spend today</span>
            <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              ${attribution.totalAdSpend.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
