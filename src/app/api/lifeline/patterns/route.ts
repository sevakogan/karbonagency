import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

// ──────────────────────────────────────────────────────
// GET /api/lifeline/patterns
// Returns day-of-week, time-of-day, and heatmap data for bookings
// Auth: Supabase session
// ──────────────────────────────────────────────────────

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
  { label: 'Late Night', range: [0, 5] },
  { label: 'Morning', range: [6, 11] },
  { label: 'Afternoon', range: [12, 17] },
  { label: 'Evening', range: [18, 23] },
] as const;

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getAdminSupabase();

    // Get all paid reservations with booking_time
    const { data: reservations, error } = await supabase
      .from('shiftos_reservations')
      .select('booking_time, revenue, sim_count')
      .eq('company_id', MIAMI_COMPANY_ID)
      .eq('paid', true)
      .not('booking_time', 'is', null);

    if (error) throw new Error(error.message);

    const allRes = reservations ?? [];

    // Initialize accumulators
    const byDay: Record<string, { bookings: number; revenue: number }> = {};
    for (const day of DAY_NAMES) {
      byDay[day] = { bookings: 0, revenue: 0 };
    }

    const bySlot: Record<string, { bookings: number; revenue: number }> = {};
    for (const slot of TIME_SLOTS) {
      bySlot[slot.label] = { bookings: 0, revenue: 0 };
    }

    // Heatmap: day x time slot
    const heatmap: Record<string, Record<string, number>> = {};
    for (const day of DAY_NAMES) {
      heatmap[day] = {};
      for (const slot of TIME_SLOTS) {
        heatmap[day][slot.label] = 0;
      }
    }

    let totalBookings = 0;

    for (const r of allRes) {
      // Parse booking_time in Miami timezone (ET)
      const dt = new Date(r.booking_time);
      // Convert to Miami local time
      const miamiStr = dt.toLocaleString('en-US', { timeZone: 'America/New_York' });
      const miamiDate = new Date(miamiStr);

      const dayName = DAY_NAMES[miamiDate.getDay()];
      const hour = miamiDate.getHours();
      const revenue = Number(r.revenue) || 0;

      // Day of week
      byDay[dayName].bookings += 1;
      byDay[dayName].revenue += revenue;

      // Time slot
      const slot = TIME_SLOTS.find((s) => hour >= s.range[0] && hour <= s.range[1]);
      if (slot) {
        bySlot[slot.label].bookings += 1;
        bySlot[slot.label].revenue += revenue;
        heatmap[dayName][slot.label] += 1;
      }

      totalBookings += 1;
    }

    // Build response arrays
    const dayOfWeek = DAY_NAMES.map((day) => ({
      day,
      bookings: byDay[day].bookings,
      revenue: Math.round(byDay[day].revenue * 100) / 100,
      avg_ticket: byDay[day].bookings > 0
        ? Math.round((byDay[day].revenue / byDay[day].bookings) * 100) / 100
        : 0,
    }));

    const timeOfDay = TIME_SLOTS.map((slot) => ({
      slot: slot.label,
      bookings: bySlot[slot.label].bookings,
      revenue: Math.round(bySlot[slot.label].revenue * 100) / 100,
    }));

    const heatmapData = DAY_NAMES.map((day) => ({
      day,
      ...Object.fromEntries(
        TIME_SLOTS.map((slot) => [slot.label, heatmap[day][slot.label]]),
      ),
    }));

    // Find peak
    let peakDay = '';
    let peakSlot = '';
    let peakCount = 0;
    for (const day of DAY_NAMES) {
      for (const slot of TIME_SLOTS) {
        if (heatmap[day][slot.label] > peakCount) {
          peakCount = heatmap[day][slot.label];
          peakDay = day;
          peakSlot = slot.label;
        }
      }
    }

    const peakPct = totalBookings > 0
      ? Math.round((peakCount / totalBookings) * 100)
      : 0;

    return NextResponse.json({
      day_of_week: dayOfWeek,
      time_of_day: timeOfDay,
      heatmap: heatmapData,
      peak: {
        day: peakDay,
        slot: peakSlot,
        count: peakCount,
        pct: peakPct,
      },
      total_bookings: totalBookings,
    });
  } catch (err) {
    console.error('Lifeline patterns error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  if (apiKey && apiKey === process.env.INGEST_API_KEY) return true;

  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}
