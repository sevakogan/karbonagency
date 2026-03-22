import { NextRequest, NextResponse } from 'next/server';
import { syncGoogleReviews, syncYelpReviews } from '@/lib/sync/reviews';

const MIAMI_COMPANY_ID = '950d0b84-63fa-409b-ad4f-ca1fdae25c7c';

/**
 * GET /api/cron/sync-reviews
 *
 * Runs daily at 8am UTC. Pulls Google + Yelp reviews for Miami company
 * and upserts into the reviews table.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Array<{ platform: string; success: boolean; upserted: number; error?: string }> = [];

  // ── Google Reviews ──
  const googlePlaceId = process.env.GOOGLE_PLACE_ID;
  if (googlePlaceId) {
    const googleResult = await syncGoogleReviews(MIAMI_COMPANY_ID, googlePlaceId);
    results.push({
      platform: 'google',
      success: googleResult.success,
      upserted: googleResult.upserted,
      error: googleResult.error,
    });
  } else {
    results.push({
      platform: 'google',
      success: false,
      upserted: 0,
      error: 'GOOGLE_PLACE_ID env var not set — skipping',
    });
  }

  // ── Yelp Reviews ──
  const yelpBusinessId = process.env.YELP_BUSINESS_ID;
  if (yelpBusinessId) {
    const yelpResult = await syncYelpReviews(MIAMI_COMPANY_ID, yelpBusinessId);
    results.push({
      platform: 'yelp',
      success: yelpResult.success,
      upserted: yelpResult.upserted,
      error: yelpResult.error,
    });
  } else {
    results.push({
      platform: 'yelp',
      success: false,
      upserted: 0,
      error: 'YELP_BUSINESS_ID env var not set — skipping',
    });
  }

  const allSuccess = results.every((r) => r.success);
  const totalUpserted = results.reduce((s, r) => s + r.upserted, 0);

  return NextResponse.json({
    success: allSuccess,
    total_upserted: totalUpserted,
    results,
    timestamp: new Date().toISOString(),
  });
}
