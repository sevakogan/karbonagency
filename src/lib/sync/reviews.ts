import { getAdminSupabase } from '@/lib/supabase-admin';

// ──────────────────────────────────────────────────────
// Review/Reputation Sync — Google Places + Yelp Fusion
// Stores reviews in Supabase `reviews` table
// ──────────────────────────────────────────────────────

interface ReviewRow {
  company_id: string;
  platform: 'google' | 'yelp';
  external_id: string;
  author_name: string;
  rating: number;
  text: string | null;
  review_time: string | null;
  synced_at: string;
}

// ── Google Places Reviews ────────────────────────────

interface GoogleReview {
  author_name: string;
  rating: number;
  text: string;
  time: number; // unix timestamp
  relative_time_description: string;
}

interface GooglePlaceDetails {
  result: {
    reviews?: GoogleReview[];
    rating?: number;
    user_ratings_total?: number;
  };
  status: string;
  error_message?: string;
}

export async function syncGoogleReviews(
  companyId: string,
  placeId: string
): Promise<{ success: boolean; upserted: number; rating?: number; total?: number; error?: string }> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return { success: false, upserted: 0, error: 'Missing GOOGLE_PLACES_API_KEY env var' };
  }

  if (!placeId) {
    return { success: false, upserted: 0, error: 'Missing placeId parameter' };
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set('fields', 'reviews,rating,user_ratings_total');
    url.searchParams.set('key', apiKey);

    const response = await fetch(url.toString());
    if (!response.ok) {
      return { success: false, upserted: 0, error: `Google API error (${response.status})` };
    }

    const json = (await response.json()) as GooglePlaceDetails;

    if (json.status !== 'OK') {
      return {
        success: false,
        upserted: 0,
        error: `Google Places API: ${json.status} — ${json.error_message ?? 'Unknown error'}`,
      };
    }

    const reviews = json.result.reviews ?? [];
    const now = new Date().toISOString();

    const rows: ReviewRow[] = reviews.map((r) => ({
      company_id: companyId,
      platform: 'google' as const,
      external_id: `google_${placeId}_${r.time}`, // unique per review
      author_name: r.author_name,
      rating: r.rating,
      text: r.text || null,
      review_time: new Date(r.time * 1000).toISOString(),
      synced_at: now,
    }));

    if (rows.length > 0) {
      const supabase = getAdminSupabase();
      const { error } = await supabase
        .from('reviews')
        .upsert(rows, { onConflict: 'platform,external_id', ignoreDuplicates: false });

      if (error) {
        return { success: false, upserted: 0, error: `Database error: ${error.message}` };
      }
    }

    return {
      success: true,
      upserted: rows.length,
      rating: json.result.rating,
      total: json.result.user_ratings_total,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, upserted: 0, error: message };
  }
}

// ── Yelp Fusion Reviews ─────────────────────────────

interface YelpReview {
  id: string;
  rating: number;
  text: string;
  time_created: string; // "2024-01-15 12:30:00"
  user: { name: string };
}

interface YelpReviewsResponse {
  reviews: YelpReview[];
  total: number;
  possible_languages: string[];
  error?: { code: string; description: string };
}

export async function syncYelpReviews(
  companyId: string,
  yelpBusinessId: string
): Promise<{ success: boolean; upserted: number; error?: string }> {
  const apiKey = process.env.YELP_API_KEY;
  if (!apiKey) {
    return { success: false, upserted: 0, error: 'Missing YELP_API_KEY env var' };
  }

  if (!yelpBusinessId) {
    return { success: false, upserted: 0, error: 'Missing yelpBusinessId parameter' };
  }

  try {
    const url = `https://api.yelp.com/v3/businesses/${encodeURIComponent(yelpBusinessId)}/reviews?sort_by=newest&limit=50`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });

    if (!response.ok) {
      return { success: false, upserted: 0, error: `Yelp API error (${response.status})` };
    }

    const json = (await response.json()) as YelpReviewsResponse;

    if (json.error) {
      return {
        success: false,
        upserted: 0,
        error: `Yelp API: ${json.error.code} — ${json.error.description}`,
      };
    }

    const reviews = json.reviews ?? [];
    const now = new Date().toISOString();

    const rows: ReviewRow[] = reviews.map((r) => ({
      company_id: companyId,
      platform: 'yelp' as const,
      external_id: `yelp_${r.id}`,
      author_name: r.user.name,
      rating: r.rating,
      text: r.text || null,
      review_time: r.time_created ? new Date(r.time_created.replace(' ', 'T')).toISOString() : null,
      synced_at: now,
    }));

    if (rows.length > 0) {
      const supabase = getAdminSupabase();
      const { error } = await supabase
        .from('reviews')
        .upsert(rows, { onConflict: 'platform,external_id', ignoreDuplicates: false });

      if (error) {
        return { success: false, upserted: 0, error: `Database error: ${error.message}` };
      }
    }

    return { success: true, upserted: rows.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, upserted: 0, error: message };
  }
}
