import { notFound } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getCompanyById } from '@/lib/actions/companies';
import { PlatformDeepDive } from './platform-deep-dive';

export const dynamic = 'force-dynamic';

export default async function PlatformPage({
  params,
}: {
  params: Promise<{ id: string; platform: string }>;
}) {
  const { id, platform: platformSlug } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  // Map the platform slug to the daily_metrics platform column
  // daily_metrics uses 'meta' not 'meta_ads' for legacy rows
  const platformMap: Record<string, string> = {
    meta_ads: 'meta',
    meta: 'meta',
    google_analytics: 'google_analytics',
    google_ads: 'google_ads',
    tiktok_ads: 'tiktok_ads',
  };
  const dbPlatform = platformMap[platformSlug] ?? platformSlug;

  // Fetch platform catalog info
  const supabase = await createSupabaseServer();
  const { data: catalogEntry } = await supabase
    .from('platform_catalog')
    .select('display_name, category, sync_enabled')
    .eq('slug', platformSlug)
    .single();

  const platformName = catalogEntry?.display_name ?? platformSlug.replace(/_/g, ' ');

  // Fetch daily metrics for this platform
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const since = ninetyDaysAgo.toISOString().split('T')[0];

  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('client_id', id)
    .eq('platform', dbPlatform)
    .gte('date', since)
    .order('date', { ascending: true });

  const rows = metrics ?? [];

  // Aggregate KPIs
  const totalSpend = rows.reduce((s, r) => s + (Number(r.spend) || 0), 0);
  const totalImpressions = rows.reduce((s, r) => s + (Number(r.impressions) || 0), 0);
  const totalClicks = rows.reduce((s, r) => s + (Number(r.clicks) || 0), 0);
  const totalConversions = rows.reduce((s, r) => s + (Number(r.conversions) || 0), 0);
  const totalReach = rows.reduce((s, r) => s + (Number(r.reach) || 0), 0);
  const avgCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCpm = totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0;

  return (
    <PlatformDeepDive
      companyId={id}
      companyName={company.name}
      platformSlug={platformSlug}
      platformName={platformName}
      kpis={{
        totalSpend,
        totalImpressions,
        totalClicks,
        totalConversions,
        totalReach,
        avgCtr,
        avgCpc,
        avgCpm,
      }}
      dailyData={rows.map((r) => ({
        date: r.date,
        spend: Number(r.spend) || 0,
        impressions: Number(r.impressions) || 0,
        clicks: Number(r.clicks) || 0,
        conversions: Number(r.conversions) || 0,
      }))}
    />
  );
}
