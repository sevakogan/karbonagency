const API_URL = process.env.SHIFTOS_API_URL ?? 'https://api.shiftarcade.com';
const USERNAME = process.env.SHIFTOS_USERNAME ?? '';
const PASSWORD = process.env.SHIFTOS_PASSWORD ?? '';

const MIAMI_LOCATION_ID = 'db405f16-fdf8-4d01-a4eb-1b980625b360';
const MIAMI_CALENDAR_PREFIXES = ['4a0347db', '46f2b5ed', '730936f4', '4e54fad2', '33de486d', 'fe7c95bd', 'b0c11521', '2656d125'];

let cachedToken: { access: string; expiry: number } | null = null;

async function getToken(): Promise<string> {
  if (cachedToken && cachedToken.expiry > Date.now()) return cachedToken.access;

  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const data = await res.json();
  if (!data.access) throw new Error('ShiftOS auth failed');

  cachedToken = { access: data.access, expiry: Date.now() + 23 * 3600 * 1000 }; // 23hr
  return data.access;
}

async function apiGet(path: string): Promise<unknown> {
  const token = await getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export interface ShiftUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  created: string;
  customer_id: string;
}

export interface ShiftReservation {
  id: string;
  calendar: string;
  user: number;
  time: string;
  paid: boolean;
  created: string;
  readonly_values: {
    calendar_name: string;
    user_display_name: string;
  };
}

export async function getMiamiNewUsers(since: string): Promise<{ count: number; users: ShiftUser[] }> {
  const data = await apiGet(
    `/users/?location=${MIAMI_LOCATION_ID}&ordering=-created&created__gte=${since}&page_size=50`
  ) as { count: number; results: ShiftUser[] };
  return { count: data.count, users: data.results ?? [] };
}

export async function getMiamiNewReservations(since: string): Promise<{ count: number; reservations: ShiftReservation[] }> {
  const data = await apiGet(
    `/reservations/?ordering=-created&created__gte=${since}&page_size=100`
  ) as { count: number; results: ShiftReservation[] };

  const miami = (data.results ?? []).filter(
    (r) => MIAMI_CALENDAR_PREFIXES.some((p) => r.calendar.startsWith(p))
  );
  return { count: miami.length, reservations: miami };
}

export async function getMiamiTotalUsers(): Promise<number> {
  const data = await apiGet(`/users/?location=${MIAMI_LOCATION_ID}&page_size=1`) as { count: number };
  return data.count;
}

export async function getMiamiTotalReservations(): Promise<number> {
  const data = await apiGet(`/reservations/?page_size=1`) as { count: number };
  // Note: API doesn't filter reservations by location directly,
  // we'd need to filter by calendar. For total count, this is approximate.
  return data.count;
}

export async function getUserById(userId: number): Promise<ShiftUser> {
  const data = await apiGet(`/users/${userId}/`) as ShiftUser;
  return data;
}

// ── Charges (Stripe-confirmed payments) ──────────────────

export interface ShiftCharge {
  id: string;
  user: number;
  location: string;
  charge_id: string | null; // Stripe charge_id
  status: string;
  amount_cents: number;
  amount_captured: number;
  amount_refunded: number;
  receipt_url: string | null;
  notes: string | null;
  created: string;
}

/**
 * Fetch recent charges from ShiftOS, filtered to Miami only.
 * Uses created__gte / created__lte for the time window.
 */
export async function getMiamiCharges(
  since: string,
  until: string,
): Promise<ShiftCharge[]> {
  const data = await apiGet(
    `/accounting/charges/?created__gte=${since}&created__lte=${until}&ordering=-created&limit=200`,
  ) as { results: ShiftCharge[] };

  // Miami only
  return (data.results ?? []).filter(
    (c) => c.location === MIAMI_LOCATION_ID,
  );
}

/**
 * Fetch multiple users by ID in parallel (for CAPI enrichment).
 */
export async function getUsersByIds(userIds: number[]): Promise<Map<number, ShiftUser>> {
  const unique = [...new Set(userIds)];
  const results = await Promise.all(
    unique.map((id) => getUserById(id).catch(() => null)),
  );
  const map = new Map<number, ShiftUser>();
  for (let i = 0; i < unique.length; i++) {
    const user = results[i];
    if (user) map.set(unique[i], user);
  }
  return map;
}
