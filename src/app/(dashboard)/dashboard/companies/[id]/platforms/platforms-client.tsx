'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, Loader2, CheckCircle, AlertCircle, Eye, EyeOff, ChevronRight, ExternalLink } from 'lucide-react';
import { saveIntegrationCredentials } from '@/lib/actions/integrations';
import type { Company, PlatformCatalogEntry, CompanyIntegration, PlatformSlug, CredentialField, IntegrationStatus } from '@/types';

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
  reviews: 'Reviews',
};
const categoryColors: Record<string, string> = {
  ads: '#007AFF',
  analytics: '#30D158',
  seo: '#BF5AF2',
  reviews: '#FF9F0A',
};

type SaveState = 'idle' | 'saving' | 'testing' | 'success' | 'error';

export function PlatformsClient({ company, platforms, integrations: initialIntegrations }: Props) {
  const router = useRouter();
  const [integrations] = useState(initialIntegrations);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformCatalogEntry | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [resultMessage, setResultMessage] = useState('');
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [expandedWalkthrough, setExpandedWalkthrough] = useState<string | null>(null);

  const getIntegration = (slug: string) => integrations.find((i) => i.platform_slug === slug);

  const grouped = useMemo(() => {
    const groups: Record<string, PlatformCatalogEntry[]> = {};
    for (const cat of categoryOrder) {
      const items = (platforms as PlatformCatalogEntry[]).filter((p) => p.category === cat);
      if (items.length > 0) groups[cat] = items;
    }
    return groups;
  }, [platforms]);

  const openPlatform = useCallback((platform: PlatformCatalogEntry) => {
    const integration = getIntegration(platform.slug);
    const existingCreds = (integration?.credentials ?? {}) as Record<string, string>;
    const fields = platform.credential_fields as CredentialField[];
    const initial: Record<string, string> = {};
    for (const f of fields) {
      initial[f.key] = existingCreds[f.key] ?? '';
    }
    setCredentials(initial);
    setSelectedPlatform(platform);
    setSaveState('idle');
    setResultMessage('');
    setShowSecrets({});
    setExpandedWalkthrough(null);
  }, [integrations]);

  const closePlatform = () => setSelectedPlatform(null);

  const handleSave = async (test: boolean) => {
    if (!selectedPlatform) return;
    setSaveState(test ? 'testing' : 'saving');
    setResultMessage('');
    try {
      const result = await saveIntegrationCredentials(
        company.id,
        selectedPlatform.slug as PlatformSlug,
        credentials,
        test
      );
      if (result.success) {
        setSaveState('success');
        setResultMessage(result.statusDetail ?? 'Saved');
        setTimeout(() => window.location.reload(), 1200);
      } else {
        setSaveState('error');
        setResultMessage(result.error ?? 'Failed');
      }
    } catch (err) {
      setSaveState('error');
      setResultMessage(err instanceof Error ? err.message : 'Error');
    }
  };

  const isBusy = saveState === 'saving' || saveState === 'testing';
  const fields = selectedPlatform ? (selectedPlatform.credential_fields as CredentialField[]) : [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
            Platforms
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>
            {company.name}
          </p>
        </div>
      </div>

      {/* Platform pills grouped by category */}
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {categoryOrder.map((cat) => {
          const items = grouped[cat];
          if (!items) return null;
          const color = categoryColors[cat];
          return (
            <div key={cat} style={{ marginBottom: 24 }}>
              <p style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: 8,
                textAlign: 'center',
              }}>
                {categoryLabels[cat]}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                {items.map((p) => {
                  const integration = getIntegration(p.slug);
                  const isConnected = integration?.status === 'connected';
                  return (
                    <button
                      key={p.slug}
                      onClick={() => openPlatform(p)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 14px',
                        borderRadius: 20,
                        border: `1px solid ${isConnected ? color : 'var(--separator-opaque)'}`,
                        background: isConnected ? `color-mix(in srgb, ${color} 10%, transparent)` : 'var(--bg-elevated)',
                        color: isConnected ? color : 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: isConnected ? color : 'var(--text-quaternary)',
                          flexShrink: 0,
                        }}
                      />
                      {p.display_name}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedPlatform && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {/* Backdrop */}
          <div
            onClick={closePlatform}
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }}
          />

          {/* Modal content */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 420,
              maxHeight: '80vh',
              overflowY: 'auto',
              background: 'var(--bg-base)',
              borderRadius: 16,
              boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
              border: '1px solid var(--separator-opaque)',
              margin: 16,
            }}
          >
            {/* Modal header */}
            <div style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 16px',
              background: 'var(--bg-base)',
              borderBottom: '1px solid var(--separator)',
              borderRadius: '16px 16px 0 0',
            }}>
              <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                {selectedPlatform.display_name}
              </h2>
              <button
                onClick={closePlatform}
                style={{
                  background: 'var(--fill-quaternary)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-tertiary)',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Fields */}
            <div style={{ padding: '12px 16px' }}>
              {fields.map((field) => {
                const isSecret = field.type === 'secret' && field.key !== 'service_account_json';
                const isTextarea = field.key === 'service_account_json';
                const val = credentials[field.key] ?? '';
                const hasValue = val.trim().length > 0;
                const isRevealed = showSecrets[field.key];

                return (
                  <div key={field.key} style={{ marginBottom: 14 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: 3 }}>
                      {field.label}
                      {field.required && <span style={{ color: 'var(--system-red)' }}>*</span>}
                      {hasValue && <CheckCircle size={11} style={{ color: 'var(--system-green)' }} />}
                    </label>
                    {field.help && (
                      <p style={{ fontSize: '10px', color: 'var(--text-quaternary)', margin: '0 0 4px 0', lineHeight: 1.3 }}>
                        {field.help}
                      </p>
                    )}
                    <div style={{ position: 'relative' }}>
                      {isTextarea ? (
                        <textarea
                          value={val}
                          onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          rows={3}
                          style={{
                            width: '100%',
                            background: 'var(--bg-grouped)',
                            border: '1px solid var(--separator-opaque)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            fontFamily: 'var(--font-mono)',
                            padding: '8px 10px',
                            outline: 'none',
                            resize: 'vertical',
                            boxSizing: 'border-box',
                          }}
                        />
                      ) : (
                        <input
                          type={isSecret && !isRevealed ? 'password' : 'text'}
                          value={val}
                          onChange={(e) => setCredentials({ ...credentials, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          style={{
                            width: '100%',
                            background: 'var(--bg-grouped)',
                            border: '1px solid var(--separator-opaque)',
                            borderRadius: 8,
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            padding: '8px 10px',
                            paddingRight: isSecret ? 36 : 10,
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                      )}
                      {isSecret && (
                        <button
                          type="button"
                          onClick={() => setShowSecrets({ ...showSecrets, [field.key]: !isRevealed })}
                          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-quaternary)' }}
                        >
                          {isRevealed ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      )}
                    </div>

                    {/* Walkthrough */}
                    {field.walkthrough && (
                      <div style={{ marginTop: 4 }}>
                        <button
                          type="button"
                          onClick={() => setExpandedWalkthrough(expandedWalkthrough === field.key ? null : field.key)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', color: 'var(--system-blue)', fontWeight: 500, padding: 0, display: 'flex', alignItems: 'center', gap: 2 }}
                        >
                          <ChevronRight size={10} style={{ transform: expandedWalkthrough === field.key ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                          How to find this
                        </button>
                        {expandedWalkthrough === field.key && (
                          <div style={{ marginTop: 4, padding: 8, background: 'var(--fill-quaternary)', borderRadius: 6 }}>
                            <ol style={{ margin: 0, paddingLeft: 16 }}>
                              {field.walkthrough.steps.map((step, i) => (
                                <li key={i} style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 2 }}>
                                  {step}
                                </li>
                              ))}
                            </ol>
                            {field.walkthrough.direct_link && (
                              <a href={field.walkthrough.direct_link} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 6, fontSize: '10px', color: 'var(--system-blue)', fontWeight: 500, textDecoration: 'none', background: 'color-mix(in srgb, var(--system-blue) 10%, transparent)', padding: '3px 8px', borderRadius: 6 }}>
                                Open <ExternalLink size={9} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Result */}
              {resultMessage && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10, padding: 8, borderRadius: 8,
                  background: saveState === 'success' ? 'color-mix(in srgb, var(--system-green) 10%, transparent)' : 'color-mix(in srgb, var(--system-red) 10%, transparent)',
                  fontSize: '11px', color: saveState === 'success' ? 'var(--system-green)' : 'var(--system-red)',
                }}>
                  {saveState === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                  {resultMessage}
                </div>
              )}

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleSave(true)}
                  disabled={isBusy}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    background: 'var(--accent)', color: 'white', border: 'none', borderRadius: 10,
                    padding: '10px 12px', fontWeight: 600, fontSize: '13px',
                    cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.7 : 1,
                  }}
                >
                  {isBusy && <Loader2 size={14} className="animate-spin" />}
                  {saveState === 'testing' ? 'Testing...' : 'Save & Connect'}
                </button>
                <button
                  onClick={() => handleSave(false)}
                  disabled={isBusy}
                  style={{
                    background: 'var(--fill-tertiary)', color: 'var(--text-secondary)',
                    border: '1px solid var(--separator-opaque)', borderRadius: 10,
                    padding: '10px 14px', fontWeight: 500, fontSize: '13px', cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
