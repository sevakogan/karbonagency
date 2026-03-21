import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';

// ──────────────────────────────────────────────────────
// POST /api/webhooks/ingest
// Universal data ingest webhook — receives data from N8N
// every 5 min for all sources (shiftos, square, meta, google, etc.)
// ──────────────────────────────────────────────────────

interface IngestPayload {
  source: 'shiftos' | 'square' | 'stripe' | 'meta' | 'google_ads' | 'google_analytics' | 'instagram';
  company_id: string;
  /** ISO date YYYY-MM-DD */
  date: string;
  /** Raw records from the source */
  records: Record<string, unknown>[];
  /** Optional campaign ID for ad platforms */
  campaign_id?: string;
}

// Validate the ingest API key
function validateApiKey(req: NextRequest): boolean {
  const key = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
  return key === process.env.INGEST_API_KEY;
}

export async function POST(req: NextRequest) {
  if (!validateApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: IngestPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { source, company_id, date, records, campaign_id } = payload;

  if (!source || !company_id || !date || !Array.isArray(records)) {
    return NextResponse.json(
      { error: 'Missing required fields: source, company_id, date, records[]' },
      { status: 400 },
    );
  }

  const supabase = getAdminSupabase();
  const results: { inserted: number; errors: string[] } = { inserted: 0, errors: [] };

  try {
    switch (source) {
      case 'shiftos':
        await ingestShiftOS(supabase, company_id, date, records, results);
        break;
      case 'square':
      case 'stripe':
        await ingestPayments(supabase, company_id, date, source, records, results);
        break;
      case 'meta':
      case 'google_ads':
      case 'google_analytics':
      case 'instagram':
        await ingestAdPlatform(supabase, company_id, date, source, records, campaign_id, results);
        break;
      default:
        return NextResponse.json({ error: `Unknown source: ${source}` }, { status: 400 });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    results.errors.push(message);
  }

  return NextResponse.json({
    ok: results.errors.length === 0,
    source,
    date,
    inserted: results.inserted,
    errors: results.errors,
  });
}

// ── ShiftOS: reservations + users ────────────────────

async function ingestShiftOS(
  supabase: ReturnType<typeof getAdminSupabase>,
  companyId: string,
  date: string,
  records: Record<string, unknown>[],
  results: { inserted: number; errors: string[] },
) {
  // Records from N8N come as reservation objects
  // Aggregate into daily_metrics row
  const reservations = records.filter((r) => r.type === 'reservation' || r.calendar_name);
  const users = records.filter((r) => r.type === 'user' || r.signup_date);

  const totalBookings = reservations.length;
  const totalUsers = users.length;

  // Upsert daily_metrics for ShiftOS
  const row = {
    client_id: companyId,
    campaign_id: null,
    date,
    platform: 'shiftos',
    conversions: totalBookings,
    clicks: totalUsers, // new signups
    impressions: 0,
    spend: 0,
    reach: 0,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    cost_per_conversion: 0,
    roas: 0,
    video_views: 0,
    leads: 0,
    link_clicks: 0,
  };

  // Delete existing row for this date/platform/client, then insert
  await supabase
    .from('daily_metrics')
    .delete()
    .eq('client_id', companyId)
    .eq('date', date)
    .eq('platform', 'shiftos');

  const { error } = await supabase.from('daily_metrics').insert(row);
  if (error) {
    results.errors.push(`daily_metrics insert: ${error.message}`);
  } else {
    results.inserted += 1;
  }

  // Also upsert individual reservations into shiftos_reservations
  if (reservations.length > 0) {
    const resRows = reservations.map((r) => ({
      company_id: companyId,
      shiftos_user_id: String(r.user_id ?? r.shiftos_user_id ?? ''),
      calendar_name: String(r.calendar_name ?? r.calendar ?? ''),
      sim_count: Number(r.sim_count ?? r.simulators ?? 1),
      revenue: Number(r.revenue ?? r.total ?? r.price ?? 0),
      revenue_source: String(r.revenue_source ?? 'estimated'),
      coupon_code: r.coupon_code ? String(r.coupon_code) : null,
      discount_amount: Number(r.discount_amount ?? 0),
      paid: Boolean(r.paid ?? r.is_paid ?? false),
      booking_time: String(r.booking_time ?? r.start_time ?? r.created ?? new Date().toISOString()),
      created_at: String(r.created ?? r.created_at ?? new Date().toISOString()),
    }));

    const { error: resErr } = await supabase
      .from('shiftos_reservations')
      .upsert(resRows, { onConflict: 'company_id,shiftos_user_id,booking_time' })
      .select();

    if (resErr) {
      results.errors.push(`shiftos_reservations: ${resErr.message}`);
    } else {
      results.inserted += resRows.length;
    }
  }

  // Upsert customers
  if (users.length > 0) {
    const custRows = users.map((u) => ({
      company_id: companyId,
      shiftos_user_id: String(u.id ?? u.user_id ?? ''),
      first_name: String(u.first_name ?? ''),
      last_name: String(u.last_name ?? ''),
      email: String(u.email ?? ''),
      phone: String(u.phone ?? u.phone_number ?? ''),
      signup_date: String(u.signup_date ?? u.date_joined ?? u.created ?? new Date().toISOString()),
    }));

    const { error: custErr } = await supabase
      .from('shiftos_customers')
      .upsert(custRows, { onConflict: 'company_id,shiftos_user_id' })
      .select();

    if (custErr) {
      results.errors.push(`shiftos_customers: ${custErr.message}`);
    } else {
      results.inserted += custRows.length;
    }
  }
}

// ── Payments: Square / Stripe ────────────────────────

async function ingestPayments(
  supabase: ReturnType<typeof getAdminSupabase>,
  companyId: string,
  date: string,
  source: 'square' | 'stripe',
  records: Record<string, unknown>[],
  results: { inserted: number; errors: string[] },
) {
  // Store as daily_metrics with platform = 'square' or 'stripe'
  const totalRevenue = records.reduce((sum, r) => sum + Number(r.amount ?? r.total ?? 0), 0);
  const transactionCount = records.length;

  const row = {
    client_id: companyId,
    campaign_id: null,
    date,
    platform: source,
    spend: 0,
    impressions: 0,
    reach: 0,
    clicks: transactionCount,
    ctr: 0,
    cpc: 0,
    cpm: 0,
    conversions: transactionCount,
    cost_per_conversion: totalRevenue > 0 && transactionCount > 0 ? totalRevenue / transactionCount : 0,
    roas: 0,
    video_views: 0,
    leads: 0,
    link_clicks: 0,
  };

  await supabase
    .from('daily_metrics')
    .delete()
    .eq('client_id', companyId)
    .eq('date', date)
    .eq('platform', source);

  const { error } = await supabase.from('daily_metrics').insert(row);
  if (error) {
    results.errors.push(`daily_metrics insert (${source}): ${error.message}`);
  } else {
    results.inserted += 1;
  }
}

// ── Ad Platforms: Meta / Google / Instagram ───────────

async function ingestAdPlatform(
  supabase: ReturnType<typeof getAdminSupabase>,
  companyId: string,
  date: string,
  platform: string,
  records: Record<string, unknown>[],
  campaignId: string | undefined,
  results: { inserted: number; errors: string[] },
) {
  // Each record maps directly to daily_metrics columns
  // N8N sends pre-aggregated data per campaign or per day
  for (const r of records) {
    const row = {
      client_id: companyId,
      campaign_id: campaignId ?? (r.campaign_id as string) ?? null,
      date: (r.date as string) ?? date,
      platform,
      spend: Number(r.spend ?? r.cost ?? 0),
      impressions: Number(r.impressions ?? 0),
      reach: Number(r.reach ?? 0),
      clicks: Number(r.clicks ?? r.link_clicks ?? 0),
      ctr: Number(r.ctr ?? 0),
      cpc: Number(r.cpc ?? r.cost_per_click ?? 0),
      cpm: Number(r.cpm ?? r.cost_per_mille ?? 0),
      conversions: Number(r.conversions ?? r.actions ?? 0),
      cost_per_conversion: Number(r.cost_per_conversion ?? r.cost_per_action ?? 0),
      roas: Number(r.roas ?? r.return_on_ad_spend ?? 0),
      video_views: Number(r.video_views ?? 0),
      leads: Number(r.leads ?? 0),
      link_clicks: Number(r.link_clicks ?? r.outbound_clicks ?? 0),
    };

    // Delete existing row for this exact combination
    const deleteQuery = supabase
      .from('daily_metrics')
      .delete()
      .eq('client_id', companyId)
      .eq('date', row.date)
      .eq('platform', platform);

    if (row.campaign_id) {
      deleteQuery.eq('campaign_id', row.campaign_id);
    }

    await deleteQuery;

    const { error } = await supabase.from('daily_metrics').insert(row);
    if (error) {
      results.errors.push(`daily_metrics insert (${platform}): ${error.message}`);
    } else {
      results.inserted += 1;
    }
  }
}
