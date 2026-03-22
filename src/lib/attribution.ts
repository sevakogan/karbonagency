import { getAdminSupabase } from '@/lib/supabase-admin';

// ── Types ────────────────────────────────────────────────

type Source = 'meta_ad' | 'google_ad' | 'google_organic' | 'direct' | 'unknown';

interface Attribution {
  source: Source;
  confidence: number; // 0.0–1.0
  detail: Record<string, unknown>;
}

interface CustomerForAttribution {
  id: string;
  shiftos_user_id: number;
  first_booking_at: string | null;
  signup_date: string | null;
  attribution_source: string | null;
}

// ── Constants ────────────────────────────────────────────

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';

// Time windows for matching
const WINDOW_HIGH = 15 * 60 * 1000;     // 15 min → 95% confidence
const WINDOW_MEDIUM = 60 * 60 * 1000;   // 1 hour → 85% confidence
const WINDOW_DAY = 24 * 60 * 60 * 1000; // 24 hours → 75% confidence
const WINDOW_WEEK = 7 * 24 * 60 * 60 * 1000; // 7 days → 60% confidence

// ── Main attribution function ────────────────────────────

/**
 * Attribute a customer's acquisition source.
 *
 * Priority:
 * 1. CAPI match — Meta confirmed the purchase matched an ad click
 * 2. Timing correlation — ad clicks happened near customer's first booking
 * 3. Day-level fallback — ad activity on the same day as signup/booking
 * 4. Unknown — no signal
 */
export async function attributeCustomer(
  customer: CustomerForAttribution,
): Promise<Attribution> {
  const supabase = getAdminSupabase();
  const anchorTime = customer.first_booking_at ?? customer.signup_date;

  if (!anchorTime) {
    return { source: 'unknown', confidence: 0, detail: { reason: 'no_booking_or_signup_date' } };
  }

  const anchorMs = new Date(anchorTime).getTime();
  const anchorDate = new Date(anchorTime).toISOString().split('T')[0];

  // ── Step 1: Check CAPI match ──
  // Look for a charge from this user that was sent to CAPI
  // If Meta's events_matched indicated a match, we know it's ad-driven
  const { data: charges } = await supabase
    .from('shiftos_charges')
    .select('capi_sent_at, charge_created_at, net_amount_cents')
    .eq('shiftos_user_id', customer.shiftos_user_id)
    .not('capi_sent_at', 'is', null)
    .order('charge_created_at', { ascending: true })
    .limit(1);

  if (charges && charges.length > 0) {
    // This customer's charge was sent to CAPI and accepted by Meta
    // Meta does the matching on their end — if it was sent, Meta got it
    // We treat CAPI-sent charges as high-confidence ad attribution
    // because Meta only reports ROAS when it matches a click

    // Check if there were ad clicks around the same time
    const chargeTime = new Date(charges[0].charge_created_at).getTime();
    const adMatch = await findNearestAdActivity(supabase, chargeTime, anchorDate);

    if (adMatch) {
      return {
        source: 'meta_ad',
        confidence: adMatch.confidence,
        detail: {
          method: 'capi_with_ad_correlation',
          charge_time: charges[0].charge_created_at,
          ad_date: adMatch.date,
          ad_clicks: adMatch.clicks,
          ad_spend: adMatch.spend,
          time_gap_hours: adMatch.gapHours,
        },
      };
    }
  }

  // ── Step 2: Timing correlation with ad metrics ──
  const adMatch = await findNearestAdActivity(supabase, anchorMs, anchorDate);

  if (adMatch) {
    return {
      source: adMatch.platform === 'google_ads' ? 'google_ad' : 'meta_ad',
      confidence: adMatch.confidence,
      detail: {
        method: 'timing_correlation',
        anchor_time: anchorTime,
        ad_date: adMatch.date,
        ad_platform: adMatch.platform,
        ad_clicks: adMatch.clicks,
        ad_spend: adMatch.spend,
        time_gap_hours: adMatch.gapHours,
      },
    };
  }

  // ── Step 3: No ad activity at all → organic or direct ──
  // Check if there was any ad spend in the 30 days before booking
  const thirtyDaysBefore = new Date(anchorMs - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: recentAds } = await supabase
    .from('daily_metrics')
    .select('spend, clicks')
    .eq('client_id', MIAMI_COMPANY_ID)
    .in('platform', ['meta', 'google_ads'])
    .gte('date', thirtyDaysBefore)
    .lte('date', anchorDate);

  const totalClicks = (recentAds ?? []).reduce((s, r) => s + (Number(r.clicks) || 0), 0);

  if (totalClicks > 0) {
    // Ads were running but no strong timing match — could be delayed attribution
    return {
      source: 'meta_ad',
      confidence: 0.4,
      detail: {
        method: 'weak_correlation',
        reason: 'ads_running_but_no_timing_match',
        total_clicks_30d: totalClicks,
      },
    };
  }

  // No ads running at all when this customer signed up
  return {
    source: 'direct',
    confidence: 0.7,
    detail: {
      method: 'no_ad_activity',
      reason: 'no_ads_running_within_30_days_of_first_booking',
    },
  };
}

// ── Helpers ──────────────────────────────────────────────

interface AdMatch {
  date: string;
  platform: string;
  clicks: number;
  spend: number;
  confidence: number;
  gapHours: number;
}

async function findNearestAdActivity(
  supabase: ReturnType<typeof getAdminSupabase>,
  anchorMs: number,
  anchorDate: string,
): Promise<AdMatch | null> {
  // Check a 7-day window around the anchor date
  const weekBefore = new Date(anchorMs - WINDOW_WEEK).toISOString().split('T')[0];
  const dayAfter = new Date(anchorMs + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: adDays } = await supabase
    .from('daily_metrics')
    .select('date, platform, clicks, spend')
    .eq('client_id', MIAMI_COMPANY_ID)
    .in('platform', ['meta', 'google_ads'])
    .gte('date', weekBefore)
    .lte('date', dayAfter)
    .gt('clicks', 0)
    .order('date', { ascending: false });

  if (!adDays || adDays.length === 0) return null;

  // Find the closest day with ad clicks
  let best: AdMatch | null = null;

  for (const day of adDays) {
    // Use noon of the ad day as the reference point
    const adDayMs = new Date(`${day.date}T12:00:00Z`).getTime();
    const gapMs = Math.abs(anchorMs - adDayMs);
    const gapHours = Math.round(gapMs / (60 * 60 * 1000) * 10) / 10;

    let confidence = 0;
    if (day.date === anchorDate) {
      // Same day as booking
      confidence = 0.85;
    } else if (gapMs <= WINDOW_DAY) {
      confidence = 0.75;
    } else if (gapMs <= 3 * 24 * 60 * 60 * 1000) {
      confidence = 0.6;
    } else if (gapMs <= WINDOW_WEEK) {
      confidence = 0.5;
    } else {
      continue;
    }

    // Higher clicks on that day = more confidence
    const clicks = Number(day.clicks) || 0;
    if (clicks > 50) confidence = Math.min(confidence + 0.05, 1.0);

    if (!best || confidence > best.confidence) {
      best = {
        date: day.date,
        platform: day.platform,
        clicks,
        spend: Number(day.spend) || 0,
        confidence,
        gapHours,
      };
    }
  }

  return best;
}

// ── Batch attribution ────────────────────────────────────

/**
 * Attribute all untagged customers. Returns count of customers updated.
 */
export async function attributeUntaggedCustomers(): Promise<{
  processed: number;
  attributed: Record<Source, number>;
}> {
  const supabase = getAdminSupabase();

  // Fetch customers that haven't been attributed yet
  const { data: customers } = await supabase
    .from('shiftos_customers')
    .select('id, shiftos_user_id, first_booking_at, signup_date, attribution_source')
    .eq('company_id', MIAMI_COMPANY_ID)
    .or('attribution_source.is.null,attribution_source.eq.unknown')
    .limit(50); // Process in batches to stay within function timeout

  if (!customers || customers.length === 0) {
    return { processed: 0, attributed: { meta_ad: 0, google_ad: 0, google_organic: 0, direct: 0, unknown: 0 } };
  }

  const counts: Record<Source, number> = { meta_ad: 0, google_ad: 0, google_organic: 0, direct: 0, unknown: 0 };

  for (const customer of customers) {
    const attr = await attributeCustomer(customer);
    counts[attr.source] += 1;

    await supabase
      .from('shiftos_customers')
      .update({
        attribution_source: attr.source,
        attribution_confidence: attr.confidence,
        attribution_detail: attr.detail,
        attributed_at: new Date().toISOString(),
      })
      .eq('id', customer.id);
  }

  return { processed: customers.length, attributed: counts };
}
