'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { wizardStepVariants, springDefault } from '@/lib/animations';
import { createCompany, updateWizardStep, completeWizardSetup } from '@/lib/actions/companies';
import { saveIntegrationCredentials } from '@/lib/actions/integrations';
import { CredentialField } from '@/components/dashboard/credential-field';
import type { PlatformSlug, PlatformCatalogEntry, CredentialField as CredentialFieldType } from '@/types';

export default function NewCompanyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('resume');

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [companyId, setCompanyId] = useState<string | null>(resumeId);

  // Step 1: Company basics
  const [name, setName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [description, setDescription] = useState('');

  // Step 2: Platform selection
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformSlug[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<PlatformCatalogEntry[]>([]);

  // Step 3+: Credential entry
  const [currentPlatformIndex, setCurrentPlatformIndex] = useState(0);
  const [credentials, setCredentials] = useState<Record<PlatformSlug, Record<string, string>>>({} as Record<PlatformSlug, Record<string, string>>);
  const [connectionResults, setConnectionResults] = useState<Record<PlatformSlug, { success: boolean; message: string }>>({} as Record<PlatformSlug, { success: boolean; message: string }>);

  const totalSteps = 2 + selectedPlatforms.length + 1;

  const goNext = useCallback(() => {
    setDirection(1);
    setStep((s) => s + 1);
  }, []);

  const goBack = useCallback(() => {
    setDirection(-1);
    setStep((s) => s - 1);
  }, []);

  const handleStep1Submit = async () => {
    if (!name.trim()) return;
    if (!companyId) {
      const result = await createCompany({ name, website_url: websiteUrl, description });
      if (result.error || !result.id) {
        alert(result.error ?? 'Failed to create company');
        return;
      }
      setCompanyId(result.id);

      // Fetch platforms
      const res = await fetch('/api/v1/health');
      // Load platforms for step 2
      const { getPlatformCatalog } = await import('@/lib/actions/companies');
      const { data } = await getPlatformCatalog();
      setAvailablePlatforms(data as PlatformCatalogEntry[]);
    }
    goNext();
  };

  const handleStep2Submit = async () => {
    if (companyId) {
      await updateWizardStep(companyId, 3, { selected_platforms: selectedPlatforms });
    }
    setCurrentPlatformIndex(0);
    goNext();
  };

  const handlePlatformCredentialSave = async (platformSlug: PlatformSlug) => {
    if (!companyId) return;
    const creds = credentials[platformSlug] ?? {};
    const result = await saveIntegrationCredentials(companyId, platformSlug, creds, true);
    setConnectionResults((prev) => ({
      ...prev,
      [platformSlug]: {
        success: result.success,
        message: result.statusDetail ?? result.error ?? '',
      },
    }));
  };

  const handlePlatformNext = () => {
    if (currentPlatformIndex < selectedPlatforms.length - 1) {
      setCurrentPlatformIndex((i) => i + 1);
      goNext();
    } else {
      goNext(); // Go to review step
    }
  };

  const handleFinish = async () => {
    if (companyId) {
      await completeWizardSetup(companyId);
    }
    router.push(`/dashboard/companies/${companyId}`);
  };

  const togglePlatform = (slug: PlatformSlug) => {
    setSelectedPlatforms((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const currentPlatformSlug = selectedPlatforms[currentPlatformIndex];
  const currentPlatform = availablePlatforms.find((p) => p.slug === currentPlatformSlug);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-[var(--space-4)]"
      style={{ background: 'var(--bg-base)' }}
    >
      <div
        className="w-full max-w-[600px] glass-card overflow-hidden"
        style={{ minHeight: 500 }}
      >
        {/* Progress bar */}
        <div className="p-[var(--space-4)] flex items-center justify-between" style={{ borderBottom: '1px solid var(--separator)' }}>
          <span style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-secondary)' }}>
            Step {step} of {totalSteps}
          </span>
          <div className="flex-1 mx-[var(--space-4)] h-1 rounded-full" style={{ background: 'var(--fill-quaternary)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'var(--accent)' }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={springDefault}
            />
          </div>
          {step > 1 && (
            <button
              onClick={goBack}
              style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Back
            </button>
          )}
        </div>

        {/* Step content */}
        <div className="p-[var(--space-6)] relative overflow-hidden" style={{ minHeight: 400 }}>
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={wizardStepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <h2 className="font-bold mb-[var(--space-6)]" style={{ fontSize: 'var(--text-title-2)', color: 'var(--text-primary)' }}>
                  Let's set up your company
                </h2>

                <div className="space-y-[var(--space-4)]">
                  <div>
                    <label className="block mb-[var(--space-1)] font-medium" style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)' }}>
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Shift Arcade Miami"
                      className="w-full"
                      style={{ background: 'var(--fill-tertiary)', border: '1px solid transparent', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 'var(--text-body)', padding: '12px 16px', minHeight: 'var(--tap-min)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-[var(--space-1)] font-medium" style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)' }}>
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={websiteUrl}
                      onChange={(e) => setWebsiteUrl(e.target.value)}
                      placeholder="https://shiftarcademiami.com"
                      className="w-full"
                      style={{ background: 'var(--fill-tertiary)', border: '1px solid transparent', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 'var(--text-body)', padding: '12px 16px', minHeight: 'var(--tap-min)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label className="block mb-[var(--space-1)] font-medium" style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)' }}>
                      Description (optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Premium racing simulator studio"
                      rows={3}
                      className="w-full"
                      style={{ background: 'var(--fill-tertiary)', border: '1px solid transparent', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 'var(--text-body)', padding: '12px 16px', outline: 'none', resize: 'vertical' }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleStep1Submit}
                  disabled={!name.trim()}
                  className="w-full mt-[var(--space-6)]"
                  style={{
                    background: name.trim() ? 'var(--accent)' : 'var(--fill-tertiary)',
                    color: name.trim() ? 'white' : 'var(--text-quaternary)',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    padding: '0 24px',
                    minHeight: 'var(--tap-min)',
                    fontWeight: 600,
                    fontSize: 'var(--text-body)',
                    cursor: name.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Continue
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={wizardStepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <h2 className="font-bold mb-[var(--space-2)]" style={{ fontSize: 'var(--text-title-2)', color: 'var(--text-primary)' }}>
                  What platforms does this company use?
                </h2>
                <p className="mb-[var(--space-6)]" style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>
                  Select all that apply. You can always add more later.
                </p>

                <div className="grid grid-cols-2 gap-[var(--space-3)]">
                  {availablePlatforms.map((platform) => {
                    const isSelected = selectedPlatforms.includes(platform.slug);
                    return (
                      <motion.button
                        key={platform.slug}
                        onClick={() => togglePlatform(platform.slug)}
                        className="text-left p-[var(--space-3)]"
                        style={{
                          background: isSelected ? 'var(--accent-muted)' : 'var(--fill-quaternary)',
                          border: `2px solid ${isSelected ? 'var(--accent)' : 'transparent'}`,
                          borderRadius: 'var(--radius-md)',
                          cursor: 'pointer',
                        }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span className="font-medium block" style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)' }}>
                          {platform.display_name}
                        </span>
                        <span style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-tertiary)' }}>
                          {platform.category}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <button
                  onClick={handleStep2Submit}
                  className="w-full mt-[var(--space-6)]"
                  style={{
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    padding: '0 24px',
                    minHeight: 'var(--tap-min)',
                    fontWeight: 600,
                    fontSize: 'var(--text-body)',
                    cursor: 'pointer',
                  }}
                >
                  {selectedPlatforms.length > 0 ? `Continue with ${selectedPlatforms.length} platforms` : 'Skip — set up later'}
                </button>
              </motion.div>
            )}

            {step > 2 && step <= 2 + selectedPlatforms.length && currentPlatform && (
              <motion.div
                key={`platform-${currentPlatformSlug}`}
                custom={direction}
                variants={wizardStepVariants}
                initial="enter"
                animate="center"
                exit="exit"
              >
                <h2 className="font-bold mb-[var(--space-2)]" style={{ fontSize: 'var(--text-title-2)', color: 'var(--text-primary)' }}>
                  Connect {currentPlatform.display_name}
                </h2>
                <p className="mb-[var(--space-4)]" style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>
                  for {name}
                </p>

                {(currentPlatform.credential_fields as CredentialFieldType[]).map((field) => (
                  <CredentialField
                    key={field.key}
                    field={field}
                    value={credentials[currentPlatformSlug]?.[field.key] ?? ''}
                    onChange={(v) => {
                      setCredentials((prev) => ({
                        ...prev,
                        [currentPlatformSlug]: {
                          ...prev[currentPlatformSlug],
                          [field.key]: v,
                        },
                      }));
                    }}
                  />
                ))}

                {connectionResults[currentPlatformSlug] && (
                  <div
                    className="p-[var(--space-3)] mb-[var(--space-3)]"
                    style={{
                      borderRadius: 'var(--radius-sm)',
                      background: connectionResults[currentPlatformSlug].success
                        ? 'color-mix(in srgb, var(--system-green) 12%, transparent)'
                        : 'color-mix(in srgb, var(--system-red) 12%, transparent)',
                      fontSize: 'var(--text-subhead)',
                      color: connectionResults[currentPlatformSlug].success
                        ? 'var(--system-green)'
                        : 'var(--system-red)',
                    }}
                  >
                    {connectionResults[currentPlatformSlug].message}
                  </div>
                )}

                <div className="flex gap-[var(--space-3)] mt-[var(--space-4)]">
                  <button
                    onClick={() => handlePlatformCredentialSave(currentPlatformSlug)}
                    className="flex-1"
                    style={{
                      background: 'var(--accent)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-full)',
                      padding: '0 24px',
                      minHeight: 'var(--tap-min)',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save & Test
                  </button>
                  <button
                    onClick={handlePlatformNext}
                    style={{
                      background: 'var(--fill-tertiary)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-full)',
                      padding: '0 24px',
                      minHeight: 'var(--tap-min)',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {connectionResults[currentPlatformSlug]?.success ? 'Continue' : 'Skip'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === totalSteps && (
              <motion.div
                key="review"
                custom={direction}
                variants={wizardStepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="text-center"
              >
                <h2 className="font-bold mb-[var(--space-2)]" style={{ fontSize: 'var(--text-title-2)', color: 'var(--text-primary)' }}>
                  You're all set!
                </h2>
                <p className="mb-[var(--space-6)]" style={{ fontSize: 'var(--text-headline)', color: 'var(--text-primary)' }}>
                  {name}
                </p>

                <div className="space-y-[var(--space-2)] mb-[var(--space-6)] text-left">
                  {selectedPlatforms.map((slug) => {
                    const result = connectionResults[slug];
                    const platform = availablePlatforms.find((p) => p.slug === slug);
                    return (
                      <div key={slug} className="flex items-center gap-[var(--space-2)]" style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)' }}>
                        {result?.success ? 'Connected' : 'Skipped'}:{' '}
                        {platform?.display_name ?? slug}
                      </div>
                    );
                  })}
                </div>

                <p className="mb-[var(--space-6)]" style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>
                  Your data is syncing now. You'll see metrics on your dashboard within a few minutes.
                </p>

                <button
                  onClick={handleFinish}
                  className="w-full mb-[var(--space-3)]"
                  style={{
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    padding: '0 24px',
                    minHeight: 'var(--tap-min)',
                    fontWeight: 600,
                    fontSize: 'var(--text-body)',
                    cursor: 'pointer',
                  }}
                >
                  Go to Dashboard
                </button>

                <button
                  onClick={() => { setStep(1); setCompanyId(null); setName(''); setWebsiteUrl(''); setDescription(''); setSelectedPlatforms([]); setCredentials({} as Record<PlatformSlug, Record<string, string>>); setConnectionResults({} as Record<PlatformSlug, { success: boolean; message: string }>); }}
                  className="w-full"
                  style={{
                    background: 'var(--fill-tertiary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-full)',
                    padding: '0 24px',
                    minHeight: 'var(--tap-min)',
                    fontWeight: 500,
                    fontSize: 'var(--text-body)',
                    cursor: 'pointer',
                  }}
                >
                  Set up another company
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
