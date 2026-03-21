import { notFound } from 'next/navigation';
import { getCompanyById } from '@/lib/actions/companies';
import { getCompanyIntegrations } from '@/lib/actions/integrations';
import { createSupabaseServer } from '@/lib/supabase-server';
import { CompanyOverviewClient } from './company-overview-client';

export const dynamic = 'force-dynamic';

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const { data: integrations } = await getCompanyIntegrations(id);

  // Fetch aggregated metrics from daily_metrics
  const supabase = await createSupabaseServer();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().split('T')[0];

  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('spend, impressions, clicks, conversions, cpc, roas')
    .eq('client_id', id)
    .gte('date', since);

  const rows = metrics ?? [];
  const totalSpend = rows.reduce((s, r) => s + (Number(r.spend) || 0), 0);
  const totalImpressions = rows.reduce((s, r) => s + (Number(r.impressions) || 0), 0);
  const totalClicks = rows.reduce((s, r) => s + (Number(r.clicks) || 0), 0);
  const totalConversions = rows.reduce((s, r) => s + (Number(r.conversions) || 0), 0);
  const avgCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const roasValues = rows.map((r) => Number(r.roas)).filter((v) => v > 0);
  const avgRoas = roasValues.length > 0 ? roasValues.reduce((a, b) => a + b, 0) / roasValues.length : 0;

  return (
    <CompanyOverviewClient
      company={company}
      integrations={integrations}
      metrics={{
        totalSpend,
        totalImpressions,
        totalClicks,
        totalConversions,
        avgCpc,
        avgRoas,
      }}
    />
  );
}
