import { getAdminSupabase } from '@/lib/supabase-admin';
import { getMiamiNewReservations, getMiamiNewUsers, getMiamiTotalUsers } from '@/lib/shiftos/client';
import type { SyncResult } from '@/types';

/**
 * Sync ShiftOS reservation + signup data into daily_metrics.
 *
 * NOTE: The daily_metrics `platform` check constraint must include 'shiftos'.
 * Run: ALTER TABLE daily_metrics DROP CONSTRAINT IF EXISTS daily_metrics_platform_check;
 *      ALTER TABLE daily_metrics ADD CONSTRAINT daily_metrics_platform_check
 *        CHECK (platform IN ('meta','google_analytics','google_ads','instagram','shiftos'));
 * Same pattern as the instagram addition.
 */
export async function syncShiftOS(
  companyId: string,
  _credentials: Record<string, string>,
  since?: string,
  until?: string,
): Promise<SyncResult> {
  const start = Date.now();

  try {
    const now = new Date();
    const todayStr = until ?? now.toISOString().split('T')[0];
    const sinceStr = since ?? todayStr;

    // Build date range to iterate
    const dates = buildDateRange(sinceStr, todayStr);

    const rows = await Promise.all(
      dates.map(async (dateStr) => {
        const dayStart = `${dateStr}T00:00:00Z`;

        const [reservations, users, totalUsers] = await Promise.all([
          getMiamiNewReservations(dayStart),
          getMiamiNewUsers(dayStart),
          getMiamiTotalUsers(),
        ]);

        return {
          client_id: companyId,
          campaign_id: null,
          date: dateStr,
          platform: 'shiftos' as const,
          conversions: reservations.count,
          clicks: users.count,
          impressions: 0,
          spend: 0,
          reach: totalUsers,
          ctr: 0,
          cpc: 0,
          cpm: 0,
          cost_per_conversion: 0,
          roas: 0,
          video_views: 0,
          leads: 0,
          link_clicks: 0,
        };
      }),
    );

    if (rows.length === 0) {
      return { success: true, rowsUpserted: 0, durationMs: Date.now() - start };
    }

    const adminSupabase = getAdminSupabase();

    // Delete-then-insert approach (same as meta-ads sync)
    await adminSupabase
      .from('daily_metrics')
      .delete()
      .eq('client_id', companyId)
      .eq('platform', 'shiftos')
      .is('campaign_id', null)
      .gte('date', sinceStr)
      .lte('date', todayStr);

    const { error: insertError } = await adminSupabase
      .from('daily_metrics')
      .insert(rows);

    if (insertError) {
      return {
        success: false,
        rowsUpserted: 0,
        error: `Database error: ${insertError.message}`,
        durationMs: Date.now() - start,
      };
    }

    return {
      success: true,
      rowsUpserted: rows.length,
      durationMs: Date.now() - start,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown ShiftOS sync error';
    return {
      success: false,
      rowsUpserted: 0,
      error: message,
      durationMs: Date.now() - start,
    };
  }
}

/** Build an array of 'YYYY-MM-DD' strings from start to end (inclusive). */
function buildDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    const next = new Date(current);
    next.setUTCDate(next.getUTCDate() + 1);
    // Use a new Date to avoid mutation
    current.setTime(next.getTime());
  }

  return dates;
}
