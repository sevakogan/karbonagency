'use client';

import { DashboardHeader } from '@/components/dashboard/company/dashboard-header';
import { LifelineView } from './lifeline-view';
import type { Company } from '@/types';

interface Props {
  company: Company | null;
}

export function LifelinePageClient({ company }: Props) {
  if (!company) return null;

  return (
    <div className="flex flex-col gap-4">
      <DashboardHeader
        company={company}
        connectedPlatforms={[]}
        selectedPlatforms={new Set()}
        refreshing={false}
        onRefresh={() => {}}
        activeTab="lifeline"
      />
      <LifelineView />
    </div>
  );
}
