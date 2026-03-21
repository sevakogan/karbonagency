import type { SyncResult } from '@/types';

export async function syncGoogleAnalytics(
  companyId: string,
  credentials: Record<string, string>,
  since?: string,
  until?: string
): Promise<SyncResult> {
  const start = Date.now();

  const { property_id, service_account_json } = credentials;

  if (!property_id || !service_account_json) {
    return {
      success: false,
      rowsUpserted: 0,
      error: 'Missing property_id or service_account_json',
      durationMs: Date.now() - start,
    };
  }

  const now = new Date();
  const effectiveUntil = until ?? now.toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const effectiveSince = since ?? thirtyDaysAgo.toISOString().split('T')[0];

  try {
    const sa = JSON.parse(service_account_json);
    const accessToken = await getGoogleAccessToken(sa);

    const reportData = await fetchGA4Report(
      property_id,
      accessToken,
      effectiveSince,
      effectiveUntil
    );

    if (!reportData || reportData.length === 0) {
      return { success: true, rowsUpserted: 0, durationMs: Date.now() - start };
    }

    // GA4 metrics map to daily_metrics columns where applicable
    // GA4 doesn't have spend/ad metrics, so those stay 0
    const { getAdminSupabase } = await import('@/lib/supabase-admin');
    const adminSupabase = getAdminSupabase();

    const rows = reportData.map((day) => ({
      client_id: companyId,
      campaign_id: null,
      date: day.date,
      platform: 'google_analytics' as const,
      spend: 0,
      impressions: day.pageviews ?? 0,
      reach: day.users ?? 0,
      clicks: day.sessions ?? 0,
      ctr: 0,
      cpc: 0,
      cpm: 0,
      conversions: day.conversions ?? 0,
      cost_per_conversion: null,
      roas: null,
      video_views: 0,
      leads: day.newUsers ?? 0,
      link_clicks: 0,
    }));

    await adminSupabase
      .from('daily_metrics')
      .delete()
      .eq('client_id', companyId)
      .eq('platform', 'google_analytics')
      .is('campaign_id', null)
      .gte('date', effectiveSince)
      .lte('date', effectiveUntil);

    const { error: insertError } = await adminSupabase
      .from('daily_metrics')
      .insert(rows);

    if (insertError) {
      return {
        success: false,
        rowsUpserted: 0,
        error: `Database error: ${insertError.message}`,
        durationMs: Date.now() - start,
      };
    }

    return { success: true, rowsUpserted: rows.length, durationMs: Date.now() - start };
  } catch (err) {
    return {
      success: false,
      rowsUpserted: 0,
      error: err instanceof Error ? err.message : 'GA4 sync failed',
      durationMs: Date.now() - start,
    };
  }
}

// ---------- Google Auth (JWT for service account) ----------

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri: string;
}

async function getGoogleAccessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: sa.token_uri || 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));

  const signInput = `${header}.${payload}`;
  const key = await importPrivateKey(sa.private_key);
  const signature = await sign(key, signInput);
  const jwt = `${signInput}.${signature}`;

  const tokenUrl = sa.token_uri || 'https://oauth2.googleapis.com/token';
  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const data = await res.json();
  if (!data.access_token) {
    throw new Error(`Failed to get Google access token: ${JSON.stringify(data)}`);
  }
  return data.access_token;
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\n/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function sign(key: CryptoKey, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    encoder.encode(data)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ---------- GA4 Data API ----------

interface GA4DayRow {
  date: string;
  sessions: number;
  users: number;
  newUsers: number;
  pageviews: number;
  conversions: number;
  bounceRate: number;
  avgSessionDuration: number;
}

async function fetchGA4Report(
  propertyId: string,
  accessToken: string,
  startDate: string,
  endDate: string
): Promise<GA4DayRow[]> {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

  const body = {
    dateRanges: [{ startDate, endDate }],
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'sessions' },
      { name: 'totalUsers' },
      { name: 'newUsers' },
      { name: 'screenPageViews' },
      { name: 'conversions' },
      { name: 'bounceRate' },
      { name: 'averageSessionDuration' },
    ],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(data.error.message ?? 'GA4 API error');
  }

  if (!data.rows) return [];

  return data.rows.map((row: { dimensionValues: { value: string }[]; metricValues: { value: string }[] }) => {
    const rawDate = row.dimensionValues[0].value;
    const formattedDate = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
    return {
      date: formattedDate,
      sessions: parseInt(row.metricValues[0].value, 10),
      users: parseInt(row.metricValues[1].value, 10),
      newUsers: parseInt(row.metricValues[2].value, 10),
      pageviews: parseInt(row.metricValues[3].value, 10),
      conversions: parseInt(row.metricValues[4].value, 10),
      bounceRate: parseFloat(row.metricValues[5].value),
      avgSessionDuration: parseFloat(row.metricValues[6].value),
    };
  });
}
