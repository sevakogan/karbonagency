import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('companyId');
  if (!companyId) {
    return NextResponse.json({ error: 'companyId required' }, { status: 400 });
  }

  try {
    const supabase = getAdminSupabase();
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Parallel queries
    const [customersRes, reservationsRes, todayResRes, thirtyDayResRes] =
      await Promise.all([
        supabase
          .from('shiftos_customers')
          .select('id, is_returning, total_bookings, total_revenue, days_signup_to_first_booking')
          .eq('company_id', companyId),
        supabase
          .from('shiftos_reservations')
          .select('id, revenue, calendar_name, coupon_code, discount_amount, created_at')
          .eq('company_id', companyId),
        supabase
          .from('shiftos_reservations')
          .select('revenue')
          .eq('company_id', companyId)
          .gte('created_at', `${today}T00:00:00`),
        supabase
          .from('shiftos_reservations')
          .select('revenue')
          .eq('company_id', companyId)
          .gte('created_at', `${thirtyDaysAgo}T00:00:00`),
      ]);

    const customers = customersRes.data ?? [];
    const allReservations = reservationsRes.data ?? [];
    const todayReservations = todayResRes.data ?? [];
    const thirtyDayReservations = thirtyDayResRes.data ?? [];

    // Daily revenue
    const dailyRevenue = {
      today: todayReservations.reduce((s, r) => s + Number(r.revenue), 0),
      last30d: thirtyDayReservations.reduce((s, r) => s + Number(r.revenue), 0),
      lifetime: allReservations.reduce((s, r) => s + Number(r.revenue), 0),
    };

    // Customer health
    const returningCustomers = customers.filter((c) => c.is_returning);
    const newCustomers = customers.filter((c) => !c.is_returning);
    const daysValues = customers
      .map((c) => c.days_signup_to_first_booking)
      .filter((d): d is number => d !== null);
    const avgDaysBetween =
      daysValues.length > 0
        ? Math.round(daysValues.reduce((s, d) => s + d, 0) / daysValues.length)
        : 0;
    const customerValues = customers
      .map((c) => Number(c.total_revenue))
      .filter((v) => v > 0);
    const avgCustomerValue =
      customerValues.length > 0
        ? Math.round(customerValues.reduce((s, v) => s + v, 0) / customerValues.length)
        : 0;

    const customerHealth = {
      totalCustomers: customers.length,
      newCount: newCustomers.length,
      returningCount: returningCustomers.length,
      returnRate:
        customers.length > 0
          ? Math.round((returningCustomers.length / customers.length) * 100)
          : 0,
      avgDaysBetweenBookings: avgDaysBetween,
      avgCustomerValue,
    };

    // Top vouchers
    const voucherMap = new Map<string, { count: number; discount: number }>();
    for (const r of allReservations) {
      if (!r.coupon_code) continue;
      const prev = voucherMap.get(r.coupon_code) ?? { count: 0, discount: 0 };
      voucherMap.set(r.coupon_code, {
        count: prev.count + 1,
        discount: prev.discount + Number(r.discount_amount),
      });
    }
    const topVouchers = [...voucherMap.entries()]
      .map(([code, stats]) => ({ code, usageCount: stats.count, totalDiscount: stats.discount }))
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 10);

    // Sim utilization
    const simMap = new Map<string, number>();
    for (const r of allReservations) {
      simMap.set(r.calendar_name, (simMap.get(r.calendar_name) ?? 0) + 1);
    }
    const simUtilization = [...simMap.entries()]
      .map(([calendarName, bookingCount]) => ({ calendarName, bookingCount }))
      .sort((a, b) => b.bookingCount - a.bookingCount);

    return NextResponse.json({
      dailyRevenue,
      customerHealth,
      topVouchers,
      simUtilization,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('ShiftOS analytics API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
