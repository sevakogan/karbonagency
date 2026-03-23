import { NextRequest, NextResponse } from 'next/server';

// ──────────────────────────────────────────────────────
// GET /api/cron/sync-creatives
//
// Runs every 2 hours. Triggers a fetch of creative-level Meta ad data.
// Since creative data changes throughout the day, this serves as a
// cache-warming endpoint. The actual data is served fresh from the
// /api/meta/creative-performance endpoint.
// ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accessToken = process.env.META_ACCESS_TOKEN ?? process.env.META_CAPI_ACCESS_TOKEN;
  const adAccountId = process.env.META_AD_ACCOUNT_ID;

  if (!accessToken || !adAccountId) {
    return NextResponse.json(
      { error: 'Missing META_ACCESS_TOKEN or META_AD_ACCOUNT_ID env vars' },
      { status: 500 }
    );
  }

  try {
    // Call the creative-performance endpoint to pull fresh data
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
      || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    const response = await fetch(`${baseUrl}/api/meta/creative-performance`, {
      headers: {
        Authorization: `Bearer ${cronSecret}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[sync-creatives] Failed to fetch creative data:', errorText);
      return NextResponse.json(
        { error: `Creative fetch failed (${response.status})` },
        { status: 500 }
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ads_fetched: data.count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[sync-creatives] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
