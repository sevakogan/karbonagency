import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import type { ShiftUser, ShiftReservation } from '@/lib/shiftos/client';
import type { ShiftOSPriceMapEntry } from '@/lib/shiftos/types';

// Allow up to 5 minutes for bootstrap (Pro plan)
export const maxDuration = 300;

// ──────────────────────────────────────────────────────
// POST /api/shiftos/bootstrap
// One-time bulk pull of ALL Miami customers + reservations
// from ShiftOS API into local Supabase tables.
// ──────────────────────────────────────────────────────

const API_URL = process.env.SHIFTOS_API_URL ?? 'https://api.shiftarcade.com';
const USERNAME = process.env.SHIFTOS_USERNAME ?? '';
const PASSWORD = process.env.SHIFTOS_PASSWORD ?? '';

const MIAMI_CALENDAR_PREFIXES = [
  '4a0347db', '46f2b5ed', '730936f4', '4e54fad2',
  '33de486d', 'fe7c95bd', 'b0c11521', '2656d125',
];

async function getShiftOSToken(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const data = await res.json();
  if (!data.access) throw new Error('ShiftOS auth failed');
  return data.access;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  results: T[];
}

async function fetchAllPages<T>(
  token: string,
  basePath: string,
  pageSize: number = 100,
): Promise<T[]> {
  const all: T[] = [];
  let page = 1;

  while (true) {
    const separator = basePath.includes('?') ? '&' : '?';
    const url = `${API_URL}${basePath}${separator}page_size=${pageSize}&page=${page}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      throw new Error(`ShiftOS API error ${res.status}: ${res.statusText} at ${basePath} page ${page}`);
    }

    const data: PaginatedResponse<T> = await res.json();
    all.push(...(data.results ?? []));

    if (!data.next) break;
    page += 1;
  }

  return all;
}

function resolveRevenue(
  calendarName: string,
  priceMap: readonly ShiftOSPriceMapEntry[],
): { revenue: number; revenueSource: 'price_map' | 'unknown' } {
  const matched = priceMap.find((p) =>
    calendarName.includes(p.calendar_name_pattern),
  );
  return matched
    ? { revenue: matched.price, revenueSource: 'price_map' }
    : { revenue: 0, revenueSource: 'unknown' };
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startMs = Date.now();

  // Company ID: accept query param or look up Shift Arcade
  const companyIdParam = request.nextUrl.searchParams.get('companyId');

  try {
    const supabase = getAdminSupabase();

    const companyId = companyIdParam ?? await resolveCompanyId(supabase);
    if (!companyId) {
      return NextResponse.json(
        { error: 'Shift Arcade company not found. Pass ?companyId=...' },
        { status: 404 },
      );
    }

    console.log('[bootstrap] Starting bulk sync for company', companyId);

    // 1. Auth with ShiftOS
    const token = await getShiftOSToken();

    // 2. Paginate through ALL users and reservations in parallel
    const [allUsers, allReservations] = await Promise.all([
      fetchAllPages<ShiftUser>(token, '/users/?ordering=-created'),
      fetchAllPages<ShiftReservation>(token, '/reservations/?ordering=-created'),
    ]);

    console.log(`[bootstrap] Fetched ${allUsers.length} users, ${allReservations.length} reservations from API`);

    // 3. Filter reservations by Miami calendar prefixes
    const miamiReservations = allReservations.filter((r) =>
      MIAMI_CALENDAR_PREFIXES.some((p) => r.calendar.startsWith(p)),
    );

    console.log(`[bootstrap] ${miamiReservations.length} Miami reservations after filtering`);

    // 4. Load price map
    const { data: priceMapRows } = await supabase
      .from('shiftos_price_map')
      .select('*');
    const priceMap: ShiftOSPriceMapEntry[] = (priceMapRows ?? []) as ShiftOSPriceMapEntry[];

    // 5. Build user lookup: shiftos_user_id -> ShiftUser
    const userById = new Map<number, ShiftUser>();
    for (const u of allUsers) {
      userById.set(u.id, u);
    }

    // 6. Determine unique user IDs referenced by Miami reservations
    const reservationUserIds = new Set(miamiReservations.map((r) => r.user));

    // 7. UPSERT customers in batches
    const customerRows = [...reservationUserIds].map((userId) => {
      const user = userById.get(userId);
      return {
        company_id: companyId,
        shiftos_user_id: userId,
        first_name: user?.first_name ?? '',
        last_name: user?.last_name ?? '',
        email: user?.email ?? '',
        phone: user?.phone ?? '',
        signup_date: user?.created ?? new Date().toISOString(),
        total_bookings: 0,
        total_revenue: 0,
        is_returning: false,
      };
    });

    let customersSynced = 0;
    const BATCH_SIZE = 200;
    for (let i = 0; i < customerRows.length; i += BATCH_SIZE) {
      const batch = customerRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('shiftos_customers')
        .upsert(batch, { onConflict: 'company_id,shiftos_user_id' });
      if (error) {
        console.error(`[bootstrap] Customer upsert batch ${i} error:`, error.message);
      } else {
        customersSynced += batch.length;
      }
    }

    // 8. Build customer_id lookup: shiftos_user_id -> supabase id
    const { data: customerLookup } = await supabase
      .from('shiftos_customers')
      .select('id, shiftos_user_id')
      .eq('company_id', companyId);

    const customerIdMap = new Map<number, string>();
    for (const c of customerLookup ?? []) {
      customerIdMap.set(c.shiftos_user_id, c.id);
    }

    // 9. UPSERT reservations in batches
    const reservationRows = miamiReservations.map((r) => {
      const calendarName = r.readonly_values.calendar_name;
      const { revenue, revenueSource } = resolveRevenue(calendarName, priceMap);
      return {
        id: r.id,
        company_id: companyId,
        customer_id: customerIdMap.get(r.user) ?? null,
        shiftos_user_id: r.user,
        calendar_name: calendarName,
        sim_count: 1,
        revenue,
        revenue_source: revenueSource,
        coupon_code: null,
        discount_amount: 0,
        paid: r.paid,
        booking_time: r.time,
        created_at: r.created,
      };
    });

    let reservationsSynced = 0;
    for (let i = 0; i < reservationRows.length; i += BATCH_SIZE) {
      const batch = reservationRows.slice(i, i + BATCH_SIZE);
      const { error } = await supabase
        .from('shiftos_reservations')
        .upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`[bootstrap] Reservation upsert batch ${i} error:`, error.message);
      } else {
        reservationsSynced += batch.length;
      }
    }

    // 10. Compute aggregates per customer
    const uniqueCustomerIds = [...new Set(
      reservationRows
        .map((r) => r.customer_id)
        .filter((id): id is string => id !== null),
    )];

    console.log(`[bootstrap] Updating aggregates for ${uniqueCustomerIds.length} customers`);

    for (let i = 0; i < uniqueCustomerIds.length; i += BATCH_SIZE) {
      const batch = uniqueCustomerIds.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((custId) => updateCustomerAggregates(supabase, custId)));
    }

    const durationMs = Date.now() - startMs;
    console.log(`[bootstrap] Complete in ${durationMs}ms`);

    return NextResponse.json({
      success: true,
      customers_synced: customersSynced,
      reservations_synced: reservationsSynced,
      miami_reservations_filtered: miamiReservations.length,
      total_api_users: allUsers.length,
      total_api_reservations: allReservations.length,
      duration_ms: durationMs,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[bootstrap] Failed:', message);
    return NextResponse.json(
      { error: message, duration_ms: Date.now() - startMs },
      { status: 500 },
    );
  }
}

// ── Helpers ──────────────────────────────────────────

async function resolveCompanyId(
  supabase: ReturnType<typeof getAdminSupabase>,
): Promise<string | null> {
  // Try both 'name' and 'company_name' columns (schema varies)
  const { data: byName } = await supabase
    .from('clients')
    .select('id')
    .ilike('name', '%Shift Arcade%')
    .limit(1)
    .single();

  if (byName) return byName.id;

  const { data: byCompany } = await supabase
    .from('clients')
    .select('id')
    .ilike('company_name', '%Shift Arcade%')
    .limit(1)
    .single();

  return byCompany?.id ?? null;
}

async function updateCustomerAggregates(
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
