'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/animations';
import { IntegrationCard } from '@/components/dashboard/integration-card';
import { CredentialSheet } from '@/components/dashboard/credential-sheet';
import { toggleIntegration } from '@/lib/actions/integrations';
import type { Company, PlatformCatalogEntry, CompanyIntegration, PlatformSlug } from '@/types';

interface Props {
  company: Company;
  platforms: PlatformCatalogEntry[];
  integrations: CompanyIntegration[];
}

const categoryOrder = ['ads', 'analytics', 'seo', 'reviews'] as const;
const categoryLabels: Record<string, string> = {
  ads: 'Advertising',
  analytics: 'Analytics',
  seo: 'SEO',
  reviews: 'Reviews & Local',
};

export function PlatformsClient({ company, platforms, integrations: initialIntegrations }: Props) {
  const router = useRouter();
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformCatalogEntry | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleConfigure = useCallback((platform: PlatformCatalogEntry) => {
    setSelectedPlatform(platform);
    setIsSheetOpen(true);
  }, []);

  const handleToggle = useCallback(async (platformSlug: string, enabled: boolean) => {
    await toggleIntegration(company.id, platformSlug as PlatformSlug, enabled);
    setIntegrations((prev) =>
      prev.map((i) =>
        i.platform_slug === platformSlug ? { ...i, is_enabled: enabled } : i
      )
    );
  }, [company.id]);

  const handleSaved = useCallback(() => {
    window.location.reload();
  }, []);

  const getIntegration = (slug: string) =>
    integrations.find((i) => i.platform_slug === slug);

  // Group platforms by category
  const grouped = useMemo(() => {
    const groups: Record<string, PlatformCatalogEntry[]> = {};
    for (const cat of categoryOrder) {
      const items = (platforms as PlatformCatalogEntry[]).filter((p) => p.category === cat);
      if (items.length > 0) groups[cat] = items;
    }
    return groups;
  }, [platforms]);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-7 h-7"
          style={{
            background: 'var(--fill-quaternary)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--text-secondary)',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} />
        </button>
        <div>
          <h1 className="font-semibold" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
            Platforms
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
            {company.name}
          </p>
        </div>
      </div>

      {/* Grouped by category */}
      <div className="max-w-xl space-y-5">
        {categoryOrder.map((cat) => {
          const items = grouped[cat];
          if (!items) return null;
          return (
            <div key={cat}>
              {/* Category header */}
              <h3
                className="uppercase font-semibold mb-1.5"
                style={{
                  fontSize: '10px',
                  color: 'var(--text-tertiary)',
                  letterSpacing: '0.8px',
                }}
              >
                {categoryLabels[cat]}
              </h3>

              {/* iOS grouped list — inset rounded container */}
              <motion.div
                className="overflow-hidden"
                style={{
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                }}
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                {items.map((platform, idx) => (
                  <motion.div key={platform.slug} variants={staggerItem}>
                    {idx > 0 && (
                      <div style={{ marginLeft: 58, height: 1, background: 'var(--separator)' }} />
                    )}
                    <IntegrationCard
                      platform={platform}
                      integration={getIntegration(platform.slug)}
                      onConfigure={handleConfigure}
                      onToggle={handleToggle}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Credential Sheet */}
      <CredentialSheet
        platform={selectedPlatform}
        companyId={company.id}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSaved={handleSaved}
      />
    </motion.div>
  );
}
