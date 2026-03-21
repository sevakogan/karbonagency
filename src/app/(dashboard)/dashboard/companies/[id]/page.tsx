import { notFound } from 'next/navigation';
import { getCompanyById } from '@/lib/actions/companies';
import { getCompanyIntegrations } from '@/lib/actions/integrations';
import { CompanyOverviewClient } from './company-overview-client';

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const { data: integrations } = await getCompanyIntegrations(id);

  return <CompanyOverviewClient company={company} integrations={integrations} />;
}
