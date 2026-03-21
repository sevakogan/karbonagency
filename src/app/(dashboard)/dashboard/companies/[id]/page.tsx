import { notFound } from 'next/navigation';
import { getCompanyById } from '@/lib/actions/companies';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { CompanyDashboard } from '@/components/dashboard/company/company-dashboard';
import type { CompanyIntegration } from '@/types';
import type { DailyRow } from '@/lib/dashboard/use-dashboard-data';

export const dynamic = 'force-dynamic';

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const supabase = getAdminSupabase();

  // Fetch 90 days of raw daily_metrics with platform column
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const since = ninetyDaysAgo.toISOString().split('T')[0];

  const [{ data: dailyRows }, { data: integrations }] = await Promise.all([
    supabase
      .from('daily_metrics')
      .select('date, platform, spend, impressions, reach, clicks, ctr, cpc, cpm, conversions, cost_per_conversion, roas, video_views, leads, link_clicks')
      .eq('client_id', id)
      .gte('date', since)
      .order('date', { ascending: true }),
    supabase
      .from('company_integrations')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: true }),
  ]);

  const mappedMetrics: DailyRow[] = (dailyRows ?? []).map((r) => ({
    date: r.date as string,
    platform: r.platform as string,
    spend: Number(r.spend) || 0,
    impressions: Number(r.impressions) || 0,
    reach: Number(r.reach) || 0,
    clicks: Number(r.clicks) || 0,
    ctr: Number(r.ctr) || 0,
    cpc: Number(r.cpc) || 0,
    cpm: Number(r.cpm) || 0,
    conversions: Number(r.conversions) || 0,
    costPerConversion: Number(r.cost_per_conversion) || 0,
    roas: Number(r.roas) || 0,
    videoViews: Number(r.video_views) || 0,
    leads: Number(r.leads) || 0,
    linkClicks: Number(r.link_clicks) || 0,
  }));

  return (
    <CompanyDashboard
      company={company}
      integrations={(integrations ?? []) as CompanyIntegration[]}
      dailyMetrics={mappedMetrics}
    />
  );
}
