'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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

export function PlatformsClient({ company, platforms, integrations: initialIntegrations }: Props) {
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
    // Reload integrations - in production we'd use router.refresh()
    window.location.reload();
  }, []);

  const getIntegration = (slug: string) =>
    integrations.find((i) => i.platform_slug === slug);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href={`/dashboard/companies/${company.id}`}
          className="flex items-center justify-center w-8 h-8"
          style={{
            background: 'var(--fill-quaternary)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--text-secondary)',
          }}
        >
          <ArrowLeft size={15} />
        </Link>
        <div>
          <h1
            className="font-semibold"
            style={{ fontSize: '18px', color: 'var(--text-primary)' }}
          >
            Platforms
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            {company.name}
          </p>
        </div>
      </div>

      {/* Platform list — compact rows */}
      <motion.div
        className="space-y-1.5 max-w-2xl"
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
      >
        {(platforms as PlatformCatalogEntry[]).map((platform) => (
          <motion.div key={platform.slug} variants={staggerItem}>
            <IntegrationCard
              platform={platform}
              integration={getIntegration(platform.slug)}
              onConfigure={handleConfigure}
              onToggle={handleToggle}
            />
          </motion.div>
        ))}
      </motion.div>

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
