import { notFound } from 'next/navigation';
import { getCompanyById, getPlatformCatalog } from '@/lib/actions/companies';
import { getCompanyIntegrations } from '@/lib/actions/integrations';
import { PlatformsClient } from './platforms-client';

export default async function PlatformsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const company = await getCompanyById(id);
  if (!company) notFound();

  const [{ data: platforms }, { data: integrations }] = await Promise.all([
    getPlatformCatalog(),
    getCompanyIntegrations(id),
  ]);

  return (
    <PlatformsClient
      company={company}
      platforms={platforms}
      integrations={integrations}
    />
  );
}
