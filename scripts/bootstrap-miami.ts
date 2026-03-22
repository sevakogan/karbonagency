/**
 * Local bootstrap script — pulls ALL Miami customers + reservations from ShiftOS
 * and upserts into Supabase. Run with: npx tsx scripts/bootstrap-miami.ts
 */

import { createClient } from '@supabase/supabase-js';

const API_URL = process.env.SHIFTOS_API_URL ?? 'https://api.shiftarcade.com';
const USERNAME = process.env.SHIFTOS_USERNAME ?? '';
const PASSWORD = process.env.SHIFTOS_PASSWORD ?? '';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const MIAMI_PREFIXES = ['4a0347db', '46f2b5ed', '730936f4', '4e54fad2', '33de486d', 'fe7c95bd', 'b0c11521', '2656d125'];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getToken(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const data = await res.json();
  return data.access;
}

async function fetchAll<T>(token: string, endpoint: string): Promise<T[]> {
  const all: T[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${API_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}page=${page}&page_size=100`;
    console.log(`  Fetching ${url}`);
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) { console.error(`  Error: ${res.status}`); break; }
    const data = await res.json();
    const results = data.results ?? data;
    if (!Array.isArray(results) || results.length === 0) { hasMore = false; break; }
    all.push(...results);
    hasMore = !!data.next;
    page++;
  }

  return all;
}

async function findCompanyId(): Promise<string> {
  const { data } = await supabase
    .from('clients')
    .select('id, name')
    .ilike('name', '%shift%arcade%')
    .limit(1)
    .single();
  if (!data) throw new Error('No Shift Arcade company found');
  console.log(`Company: ${data.name} (${data.id})`);
  return data.id;
}

async function main() {
  const start = Date.now();
  console.log('=== ShiftOS Miami Bootstrap ===\n');

  const token = await getToken();
  console.log('✅ Authenticated\n');

  const companyId = await findCompanyId();

  // 1. Fetch Miami users only (server-side filter)
  console.log('\n📥 Fetching MIAMI users (location filter)...');
  const users = await fetchAll<any>(token, '/users/?location=db405f16-fdf8-4d01-a4eb-1b980625b360');
  console.log(`  Got ${users.length} Miami users`);

  // 2. Fetch Miami reservations only (server-side filter, only is_base=true slots)
  console.log('\n📥 Fetching MIAMI reservations (location filter)...');
  const allMiamiSlots = await fetchAll<any>(token, '/reservations/?location=db405f16-fdf8-4d01-a4eb-1b980625b360');
  console.log(`  Got ${allMiamiSlots.length} total sim-slot records`);

  // Deduplicate: group by user + date to get actual visits
  // Each "visit" = unique (user, date). Count sims per visit.
  const visitMap = new Map<string, any>();
  for (const slot of allMiamiSlots) {
    const dateKey = (slot.time ?? slot.created ?? '').substring(0, 10); // YYYY-MM-DD
    const visitKey = `${slot.user}_${dateKey}`;
    if (!visitMap.has(visitKey)) {
      visitMap.set(visitKey, {
        ...slot,
        sim_count: 1,
        calendar_names: [slot.readonly_values?.calendar_name ?? ''],
      });
    } else {
      const existing = visitMap.get(visitKey)!;
      existing.sim_count += 1;
      existing.calendar_names.push(slot.readonly_values?.calendar_name ?? '');
    }
  }
  const miamiRes = Array.from(visitMap.values());
  console.log(`  ${miamiRes.length} unique visits (deduplicated from ${allMiamiSlots.length} slots)`);

  // All users from the location filter are Miami customers
  const miamiUsers = users;
  console.log(`  ${miamiUsers.length} Miami customers`);

  // 3. Upsert customers
  console.log('\n💾 Upserting customers...');
  const custRows = miamiUsers.map((u: any) => ({
    company_id: companyId,
    shiftos_user_id: u.id,
    first_name: u.first_name ?? '',
    last_name: u.last_name ?? '',
    email: u.email ?? '',
    phone: u.phone ?? '',
    signup_date: u.created ?? new Date().toISOString(),
    total_bookings: 0,
    total_revenue: 0,
    is_returning: false,
  }));

  // Batch upsert 100 at a time
  for (let i = 0; i < custRows.length; i += 100) {
    const batch = custRows.slice(i, i + 100);
    const { error } = await supabase
      .from('shiftos_customers')
      .upsert(batch, { onConflict: 'company_id,shiftos_user_id' });
    if (error) console.error(`  Batch ${i}: ${error.message}`);
    else console.log(`  Upserted customers ${i + 1}-${Math.min(i + 100, custRows.length)}`);
  }

  // 4. Get customer ID mapping (shiftos_user_id -> supabase id)
  const { data: custMap } = await supabase
    .from('shiftos_customers')
    .select('id, shiftos_user_id')
    .eq('company_id', companyId);
  const idMap = new Map((custMap ?? []).map((c) => [c.shiftos_user_id, c.id]));

  // 5. Upsert reservations
  console.log('\n💾 Upserting reservations...');
  const resRows = miamiRes.map((r: any) => ({
    id: r.id,
    company_id: companyId,
    customer_id: idMap.get(r.user) ?? null,
    shiftos_user_id: r.user,
    calendar_name: r.calendar_names?.join(', ') ?? r.readonly_values?.calendar_name ?? r.calendar ?? '',
    sim_count: r.sim_count ?? 1,
    revenue: 0,
    revenue_source: 'unknown',
    coupon_code: r.coupon_code ?? null,
    discount_amount: 0,
    paid: r.paid ?? false,
    booking_time: r.time ?? r.created ?? new Date().toISOString(),
    created_at: r.created ?? new Date().toISOString(),
  }));

  for (let i = 0; i < resRows.length; i += 100) {
    const batch = resRows.slice(i, i + 100);
    const { error } = await supabase
      .from('shiftos_reservations')
      .upsert(batch, { onConflict: 'id' });
    if (error) console.error(`  Batch ${i}: ${error.message}`);
    else console.log(`  Upserted reservations ${i + 1}-${Math.min(i + 100, resRows.length)}`);
  }

  // 6. Compute aggregates
  console.log('\n📊 Computing aggregates...');
  for (const [shiftosId, supabaseId] of idMap.entries()) {
    const { data: custRes } = await supabase
      .from('shiftos_reservations')
      .select('booking_time, revenue, paid')
      .eq('customer_id', supabaseId)
      .eq('paid', true)
      .order('booking_time', { ascending: true });

    const bookings = custRes ?? [];
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((s, b) => s + Number(b.revenue ?? 0), 0);
    const firstBooking = bookings[0]?.booking_time ?? null;
    const lastBooking = bookings[bookings.length - 1]?.booking_time ?? null;

    await supabase
      .from('shiftos_customers')
      .update({
        total_bookings: totalBookings,
        total_revenue: totalRevenue,
        first_booking_at: firstBooking,
        last_booking_at: lastBooking,
        is_returning: totalBookings > 1,
      })
      .eq('id', supabaseId);
  }

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n✅ Bootstrap complete in ${duration}s`);
  console.log(`   Customers: ${miamiUsers.length}`);
  console.log(`   Reservations: ${miamiRes.length}`);
}

main().catch(console.error);
