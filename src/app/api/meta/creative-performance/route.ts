import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { createSupabaseServer } from '@/lib/supabase-server';

// ──────────────────────────────────────────────────────
// GET /api/meta/creative-performance
// Pulls ad-level (creative-level) insights from Meta Graph API.
// Returns each ad with: name, status, spend, impressions, clicks, CTR, CPC, conversions, ROAS
// Auth: Supabase session (admin role) OR CRON_SECRET
// ──────────────────────────────────────────────────────

const META_GRAPH_URL = 'https://graph.facebook.com/v22.0';

interface MetaAdInsight {
  spend: string;
  impressions: string;
  clicks: string;
  ctr: string;
  cpc: string;
  conversions?: string;
  actions?: Array<{ action_type: string; value: string }>;
  cost_per_action_type?: Array<{ action_type: string; value: string }>;
}

interface MetaAdNode {
  id: string;
  name: string;
  status: string;
  insights?: { data: MetaAdInsight[] };
}

interface MetaAdsResponse {
  data: MetaAdNode[];
  paging?: { cursors?: { after?: string }; next?: string };
  error?: { message: string; code: number };
}

export async function GET(request: NextRequest) {
  if (!(await isAuthorized(request))) {
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
    const normalizedAccountId = adAccountId.startsWith('act_')
      ? adAccountId
      : `act_${adAccountId}`;

    const fields = [
      'name',
      'status',
      'insights.date_preset(last_30d){spend,impressions,clicks,ctr,cpc,conversions,actions,cost_per_action_type}',
    ].join(',');

    const url = `${META_GRAPH_URL}/${normalizedAccountId}/ads?fields=${fields}&limit=50`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[creative-performance] Meta API error:', errorText);
      return NextResponse.json(
        { error: `Meta API error (${response.status})` },
        { status: response.status }
      );
    }

    const json = (await response.json()) as MetaAdsResponse;

    if (json.error) {
      return NextResponse.json(
        { error: json.error.message },
        { status: 500 }
      );
    }

    const ads = (json.data ?? []).map((ad) => {
      const insight = ad.insights?.data?.[0];

      // Extract conversions from actions array
      const conversions = extractActionValue(insight?.actions, 'offsite_conversion.fb_pixel_purchase')
        || extractActionValue(insight?.actions, 'offsite_conversion.fb_pixel_lead')
        || extractActionValue(insight?.actions, 'lead')
        || 0;

      const costPerConversion = extractActionValue(insight?.cost_per_action_type, 'offsite_conversion.fb_pixel_purchase')
        || extractActionValue(insight?.cost_per_action_type, 'offsite_conversion.fb_pixel_lead')
        || extractActionValue(insight?.cost_per_action_type, 'lead')
        || 0;

      const spend = parseFloat(insight?.spend ?? '0');
      const revenue = conversions * (costPerConversion > 0 ? spend / costPerConversion * (spend / conversions) : 0);
      const roas = spend > 0 && revenue > 0 ? Math.round((revenue / spend) * 100) / 100 : 0;

      return {
        ad_id: ad.id,
        name: ad.name,
        status: ad.status,
        spend: spend,
        impressions: parseInt(insight?.impressions ?? '0', 10),
        clicks: parseInt(insight?.clicks ?? '0', 10),
        ctr: parseFloat(insight?.ctr ?? '0'),
        cpc: parseFloat(insight?.cpc ?? '0'),
        conversions,
        cost_per_conversion: costPerConversion,
        roas,
      };
    });

    return NextResponse.json({
      ads,
      count: ads.length,
      period: 'last_30d',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[creative-performance] Error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ── Helpers ──────────────────────────────────────────

function extractActionValue(
  actions: Array<{ action_type: string; value: string }> | undefined,
  actionType: string
): number {
  if (!actions) return 0;
  const action = actions.find((a) => a.action_type === actionType);
  return action ? parseFloat(action.value) : 0;
}

async function isAuthorized(req: NextRequest): Promise<boolean> {
  // CRON_SECRET check
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  // Supabase session check (admin only)
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const adminSupabase = getAdminSupabase();
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    return profile?.role === 'admin';
  } catch {
    return false;
  }
}
