import { getAdminSupabase } from '@/lib/supabase-admin';
import { getMiamiNewReservations, getUserById } from '@/lib/shiftos/client';
import type { ShiftReservation } from '@/lib/shiftos/client';
import type { ShiftOSCustomer, ShiftOSPriceMapEntry } from '@/lib/shiftos/types';

// --- Customer upsert ---

async function ensureCustomer(
  supabase: ReturnType<typeof getAdminSupabase>,
  companyId: string,
  shiftoUserId: number,
): Promise<string> {
  const { data: existing } = await supabase
    .from('shiftos_customers')
    .select('id')
    .eq('company_id', companyId)
    .eq('shiftos_user_id', shiftoUserId)
    .single();

  if (existing) return existing.id;

  const user = await getUserById(shiftoUserId);

  const { data: created, error } = await supabase
    .from('shiftos_customers')
    .insert({
      company_id: companyId,
      shiftos_user_id: shiftoUserId,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone ?? '',
      signup_date: user.created,
      total_bookings: 0,
      total_revenue: 0,
      is_returning: false,
    })
    .select('id')
    .single();

  if (error) throw new Error(`Failed to create customer: ${error.message}`);
  return created!.id;
}

// --- Revenue resolution ---

function resolveRevenue(
  calendarName: string,
  priceMap: ShiftOSPriceMapEntry[],
): { revenue: number; revenueSource: 'price_map' | 'unknown' } {
  const matched = priceMap.find((p) =>
    calendarName.includes(p.calendar_name_pattern),
  );

  if (matched) {
    return { revenue: matched.price, revenueSource: 'price_map' };
  }
  return { revenue: 0, revenueSource: 'unknown' };
}

// --- Reservation upsert ---

async function upsertReservation(
  supabase: ReturnType<typeof getAdminSupabase>,
  companyId: string,
  customerId: string,
  reservation: ShiftReservation,
  priceMap: ShiftOSPriceMapEntry[],
): Promise<{ revenue: number; isNew: boolean }> {
  const { data: existing } = await supabase
    .from('shiftos_reservations')
    .select('id')
    .eq('id', reservation.id)
    .single();

  if (existing) return { revenue: 0, isNew: false };

  const calendarName = reservation.readonly_values.calendar_name;
  const { revenue, revenueSource } = resolveRevenue(calendarName, priceMap);

  const { error } = await supabase.from('shiftos_reservations').insert({
    id: reservation.id,
    company_id: companyId,
    customer_id: customerId,
    shiftos_user_id: reservation.user,
    calendar_name: calendarName,
    sim_count: 1, // default, API doesn't expose sim count directly
    revenue,
    revenue_source: revenueSource,
    coupon_code: null,
    discount_amount: 0,
    paid: reservation.paid,
    booking_time: reservation.time,
    created_at: reservation.created,
  });

  if (error) throw new Error(`Failed to upsert reservation: ${error.message}`);
  return { revenue, isNew: true };
}

// --- Customer lifetime stats update ---

async function updateCustomerStats(
  supabase: ReturnType<typeof getAdminSupabase>,
  customerId: string,
): Promise<void> {
  const { data: reservations } = await supabase
    .from('shiftos_reservations')
    .select('revenue, booking_time')
    .eq('customer_id', customerId)
    .order('booking_time', { ascending: true });

  if (!reservations || reservations.length === 0) return;

  const { data: customer } = await supabase
    .from('shiftos_customers')
    .select('signup_date')
    .eq('id', customerId)
    .single();

  const firstBooking = reservations[0].booking_time;
  const lastBooking = reservations[reservations.length - 1].booking_time;
  const totalRevenue = reservations.reduce((sum, r) => sum + Number(r.revenue), 0);

  const daysToFirst = customer?.signup_date
    ? Math.floor(
        (new Date(firstBooking).getTime() - new Date(customer.signup_date).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  await supabase
    .from('shiftos_customers')
    .update({
      first_booking_at: firstBooking,
      last_booking_at: lastBooking,
      total_bookings: reservations.length,
      total_revenue: totalRevenue,
      is_returning: reservations.length > 1,
      days_signup_to_first_booking: daysToFirst,
      updated_at: new Date().toISOString(),
    })
    .eq('id', customerId);
}

// --- Daily metrics update ---

async function updateDailyMetrics(
  supabase: ReturnType<typeof getAdminSupabase>,
  companyId: string,
  date: string,
): Promise<void> {
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const { data: dayReservations } = await supabase
    .from('shiftos_reservations')
    .select('revenue')
    .eq('company_id', companyId)
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd);

  const totalRevenue = (dayReservations ?? []).reduce((s, r) => s + Number(r.revenue), 0);
  const bookingCount = dayReservations?.length ?? 0;

  await supabase.from('daily_metrics').upsert(
    {
      company_id: companyId,
      platform: 'shiftos',
      date,
      revenue: totalRevenue,
      conversions: bookingCount,
    },
    { onConflict: 'company_id,platform,date' },
  );
}

// --- Public API ---

export async function syncRecentReservations(
  companyId: string,
): Promise<{ synced: number; revenue: number; errors: string[] }> {
  const supabase = getAdminSupabase();
  const sixMinAgo = new Date(Date.now() - 6 * 60 * 1000).toISOString();

  const { reservations } = await getMiamiNewReservations(sixMinAgo);

  const { data: priceMap } = await supabase
    .from('shiftos_price_map')
    .select('*');

  let synced = 0;
  let totalRevenue = 0;
  const errors: string[] = [];

  for (const reservation of reservations) {
    try {
      const customerId = await ensureCustomer(supabase, companyId, reservation.user);
      const { revenue, isNew } = await upsertReservation(
        supabase, companyId, customerId, reservation, (priceMap ?? []) as ShiftOSPriceMapEntry[],
      );

      if (isNew) {
        await updateCustomerStats(supabase, customerId);
        synced += 1;
        totalRevenue += revenue;
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Reservation ${reservation.id}: ${msg}`);
    }
  }

  const today = new Date().toISOString().split('T')[0];
  await updateDailyMetrics(supabase, companyId, today);

  return { synced, revenue: totalRevenue, errors };
}

export async function getCustomerLifecycle(
  shiftoUserId: number,
): Promise<ShiftOSCustomer | null> {
  const supabase = getAdminSupabase();
  const { data } = await supabase
    .from('shiftos_customers')
    .select('*')
    .eq('shiftos_user_id', shiftoUserId)
    .single();

  return (data as ShiftOSCustomer) ?? null;
}

export async function getDailyRevenueSummary(
  companyId: string,
  date: string,
): Promise<{ revenue: number; bookings: number; newCustomers: number; returningCustomers: number }> {
  const supabase = getAdminSupabase();
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const { data: reservations } = await supabase
    .from('shiftos_reservations')
    .select('revenue, customer_id')
    .eq('company_id', companyId)
    .gte('created_at', dayStart)
    .lte('created_at', dayEnd);

  if (!reservations || reservations.length === 0) {
    return { revenue: 0, bookings: 0, newCustomers: 0, returningCustomers: 0 };
  }

  const revenue = reservations.reduce((s, r) => s + Number(r.revenue), 0);
  const customerIds = [...new Set(reservations.map((r) => r.customer_id))];

  const { data: customers } = await supabase
    .from('shiftos_customers')
    .select('id, is_returning')
    .in('id', customerIds);

  const newCustomers = (customers ?? []).filter((c) => !c.is_returning).length;
  const returningCustomers = (customers ?? []).filter((c) => c.is_returning).length;

  return {
    revenue,
    bookings: reservations.length,
    newCustomers,
    returningCustomers,
  };
}
