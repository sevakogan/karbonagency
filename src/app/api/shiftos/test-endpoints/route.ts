import { NextResponse } from 'next/server';

const API_URL = process.env.SHIFTOS_API_URL ?? 'https://api.shiftarcade.com';
const USERNAME = process.env.SHIFTOS_USERNAME ?? '';
const PASSWORD = process.env.SHIFTOS_PASSWORD ?? '';

async function getToken(): Promise<string> {
  const res = await fetch(`${API_URL}/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  const data = await res.json();
  if (!data.access) throw new Error('Auth failed');
  return data.access;
}

async function apiGet(token: string, path: string) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return { error: res.status, statusText: res.statusText };
  return res.json();
}

export async function GET() {
  try {
    const token = await getToken();

    // Test all unexplored endpoints in parallel
    const [charges, vouchers, singleUser, checkouts] = await Promise.all([
      apiGet(token, '/accounting/charges/?page_size=3&ordering=-created'),
      apiGet(token, '/vouchers/?page_size=3'),
      apiGet(token, '/users/?page_size=1&ordering=-created'),  // get latest user to see all fields
      apiGet(token, '/reservations/checkouts/?page_size=3'),
    ]);

    return NextResponse.json({
      charges_sample: charges,
      vouchers_sample: vouchers,
      latest_user_full_fields: singleUser,
      checkouts_sample: checkouts,
    }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
