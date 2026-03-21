import { NextResponse } from 'next/server';
import { getMiamiNewReservations } from '@/lib/shiftos/client';

/**
 * GET /api/shiftos/recent
 * Returns the most recent ShiftOS reservations for the dashboard.
 */
export async function GET() {
  try {
    // Get reservations from last 24 hours
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const { reservations } = await getMiamiNewReservations(since);

    // Map to a clean format for the frontend
    const recent = reservations.slice(0, 6).map((r) => {
      const createdDate = new Date(r.created);
      const now = Date.now();
      const diffMs = now - createdDate.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      const timeAgo = diffMin < 60
        ? `${diffMin}m ago`
        : diffMin < 1440
          ? `${Math.floor(diffMin / 60)}h ago`
          : `${Math.floor(diffMin / 1440)}d ago`;

      return {
        id: r.id,
        time: timeAgo,
        source: 'Shift OS' as const,
        customer: r.readonly_values.user_display_name,
        package: r.readonly_values.calendar_name,
        bookingTime: r.time,
        paid: r.paid,
        created: r.created,
      };
    });

    return NextResponse.json({ reservations: recent });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch reservations';
    return NextResponse.json({ reservations: [], error: message }, { status: 500 });
  }
}
