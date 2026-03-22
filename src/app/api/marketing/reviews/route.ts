import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

// ──────────────────────────────────────────────────────
// GET /api/marketing/reviews
// Returns review data: overall rating, total count, recent reviews, rating trend
// Query params: companyId, limit (default 20)
// Auth: Supabase session
// ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const params = request.nextUrl.searchParams;
    let companyId = params.get('companyId');
    const limit = Math.min(parseInt(params.get('limit') ?? '20', 10), 100);

    const supabase = getAdminSupabase();

    // Default to Shift Arcade Miami
    if (!companyId) {
      const { data: company } = await supabase
        .from('clients')
        .select('id')
        .ilike('name', '%shift%arcade%')
        .limit(1)
        .single();
      companyId = company?.id ?? null;
      if (!companyId) {
        return NextResponse.json({ error: 'No company found' }, { status: 400 });
      }
    }

    // Fetch all reviews for this company
    const { data: allReviews, error: allError } = await supabase
      .from('reviews')
      .select('id, platform, author_name, rating, text, review_time, synced_at')
      .eq('company_id', companyId)
      .order('review_time', { ascending: false });

    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 500 });
    }

    const reviews = allReviews ?? [];

    // Overall stats
    const totalCount = reviews.length;
    const avgRating = totalCount > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / totalCount) * 10) / 10
      : 0;

    // Per-platform breakdown
    const googleReviews = reviews.filter((r) => r.platform === 'google');
    const yelpReviews = reviews.filter((r) => r.platform === 'yelp');

    const googleAvg = googleReviews.length > 0
      ? Math.round((googleReviews.reduce((s, r) => s + r.rating, 0) / googleReviews.length) * 10) / 10
      : 0;
    const yelpAvg = yelpReviews.length > 0
      ? Math.round((yelpReviews.reduce((s, r) => s + r.rating, 0) / yelpReviews.length) * 10) / 10
      : 0;

    // Rating distribution (1-5 stars)
    const ratingDistribution = [1, 2, 3, 4, 5].map((stars) => ({
      stars,
      count: reviews.filter((r) => r.rating === stars).length,
    }));

    // Monthly rating trend
    const monthlyMap = new Map<string, { sum: number; count: number }>();
    for (const r of reviews) {
      if (!r.review_time) continue;
      const date = new Date(r.review_time);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthlyMap.get(key);
      if (existing) {
        monthlyMap.set(key, { sum: existing.sum + r.rating, count: existing.count + 1 });
      } else {
        monthlyMap.set(key, { sum: r.rating, count: 1 });
      }
    }

    const ratingTrend = [...monthlyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        avg_rating: Math.round((data.sum / data.count) * 10) / 10,
        review_count: data.count,
      }));

    // Recent reviews (limited)
    const recentReviews = reviews.slice(0, limit).map((r) => ({
      id: r.id,
      platform: r.platform,
      author_name: r.author_name,
      rating: r.rating,
      text: r.text,
      review_time: r.review_time,
    }));

    return NextResponse.json({
      overall_rating: avgRating,
      total_count: totalCount,
      platforms: {
        google: { count: googleReviews.length, avg_rating: googleAvg },
        yelp: { count: yelpReviews.length, avg_rating: yelpAvg },
      },
      rating_distribution: ratingDistribution,
      rating_trend: ratingTrend,
      recent_reviews: recentReviews,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[marketing/reviews] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Auth helper ──────────────────────────────────────

async function isAuthorized(req: NextRequest): Promise<boolean> {
  // CRON_SECRET / API key check
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  const apiKey = req.headers.get('x-api-key') || authHeader?.replace('Bearer ', '');
  if (apiKey && apiKey === process.env.INGEST_API_KEY) return true;

  // Supabase session check
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  } catch {
    return false;
  }
}
