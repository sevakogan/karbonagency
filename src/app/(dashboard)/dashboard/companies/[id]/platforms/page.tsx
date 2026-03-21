import { notFound } from 'next/navigation';
import { getCompanyById, getPlatformCatalog } from '@/lib/actions/companies';
import { getAdminSupabase } from '@/lib/supabase-admin';
import { PlatformsClient } from './platforms-client';
import type { CompanyIntegration } from '@/types';

export const dynamic = 'force-dynamic';

export default async function PlatformsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const [{ data: platforms }, integrations] = await Promise.all([
    getPlatformCatalog(),
    fetchIntegrationsWithCreds(id),
  ]);

  return (
    <PlatformsClient
      company={company}
      platforms={platforms}
      integrations={integrations}
    />
  );
}

async function fetchIntegrationsWithCreds(companyId: string): Promise<CompanyIntegration[]> {
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('company_integrations')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as CompanyIntegration[];
}
