'use client';

import { DashboardHeader } from '@/components/dashboard/company/dashboard-header';
import { MarketingCommandCenter } from './marketing-command-center';

interface Props {
  company: any;
}

export function MarketingPageClient({ company }: Props) {
  return (
    <div>
      {company && (
        <DashboardHeader
          company={company}
          connectedPlatforms={['meta', 'google_analytics', 'google_ads', 'instagram', 'shiftos']}
          selectedPlatforms={new Set()}
          refreshing={false}
          onRefresh={() => window.location.reload()}
          activeTab="marketing"
        />
      )}
      <div className="mt-4">
        <MarketingCommandCenter />
      </div>
    </div>
  );
}
