import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { createHash } from 'crypto';

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';

function sha256(input: string): string {
  return createHash('sha256').update(input.trim().toLowerCase()).digest('hex');
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const segment = request.nextUrl.searchParams.get('segment') ?? 'all';
  const supabase = getAdminSupabase();

  let query = supabase
    .from('shiftos_customers')
    .select('email, phone, first_name, last_name, total_bookings, total_revenue, last_booking_at, is_returning')
    .eq('company_id', MIAMI_COMPANY_ID);

  const now = new Date();

  // Segment filters
  if (segment === 'churned') {
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
    query = query.lt('last_booking_at', ninetyDaysAgo);
  } else if (segment === 'vip') {
    query = query.gte('total_revenue', 500);
  } else if (segment === 'one_time') {
    query = query.eq('total_bookings', 1);
  } else if (segment === 'at_risk') {
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    query = query.lt('last_booking_at', thirtyDaysAgo).gte('last_booking_at', sixtyDaysAgo);
  } else if (segment === 'returning') {
    query = query.eq('is_returning', true);
  }

  const { data: customers } = await query;

  // Format for Meta Custom Audiences (hashed PII)
  const audience = (customers ?? [])
    .filter((c) => c.email)
    .map((c) => ({
      email: sha256(c.email),
      phone: c.phone ? sha256(c.phone.replace(/\D/g, '')) : null,
      fn: c.first_name ? sha256(c.first_name) : null,
      ln: c.last_name ? sha256(c.last_name) : null,
    }));

  const available_segments = ['all', 'churned', 'vip', 'one_time', 'at_risk', 'returning'];

  return NextResponse.json({
    segment,
    count: audience.length,
    available_segments,
    schema: ['EMAIL_SHA256', 'PHONE_SHA256', 'FN_SHA256', 'LN_SHA256'],
    data: audience,
  });
}
