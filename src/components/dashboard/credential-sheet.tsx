'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { sheetVariants, sheetOverlayVariants } from '@/lib/animations';
import { CredentialField } from './credential-field';
import { saveIntegrationCredentials, disconnectIntegration } from '@/lib/actions/integrations';
import type { PlatformCatalogEntry, CredentialField as CredentialFieldType, PlatformSlug } from '@/types';

interface CredentialSheetProps {
  platform: PlatformCatalogEntry | null;
  companyId: string;
  existingCredentials?: Record<string, string>;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

type SaveState = 'idle' | 'saving' | 'testing' | 'success' | 'error';

export function CredentialSheet({
  platform,
  companyId,
  existingCredentials = {},
  isOpen,
  onClose,
  onSaved,
}: CredentialSheetProps) {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [resultMessage, setResultMessage] = useState('');

  useEffect(() => {
    if (platform) {
      const initial: Record<string, string> = {};
      const fields = platform.credential_fields as CredentialFieldType[];
      for (const field of fields) {
        initial[field.key] = existingCredentials[field.key] ?? '';
      }
      setCredentials(initial);
      setSaveState('idle');
      setResultMessage('');
    }
  }, [platform, existingCredentials]);

  if (!platform) return null;

  const fields = platform.credential_fields as CredentialFieldType[];

  const handleFieldChange = (key: string, value: string) => {
    setCredentials((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveAndConnect = async () => {
    setSaveState('saving');
    setResultMessage('');

    try {
      setSaveState('testing');
      const result = await saveIntegrationCredentials(
        companyId,
        platform.slug as PlatformSlug,
        credentials,
        true
      );

      if (result.success) {
        setSaveState('success');
        setResultMessage(result.statusDetail ?? 'Connected successfully');
        setTimeout(() => {
          onSaved();
          onClose();
        }, 1500);
      } else {
        setSaveState('error');
        setResultMessage(result.error ?? 'Connection failed');
      }
    } catch (err) {
      setSaveState('error');
      setResultMessage(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleSaveOnly = async () => {
    setSaveState('saving');
    try {
      const result = await saveIntegrationCredentials(
        companyId,
        platform.slug as PlatformSlug,
        credentials,
        false
      );

      if (result.success) {
        setSaveState('success');
        setResultMessage('Credentials saved');
        setTimeout(() => {
          onSaved();
          onClose();
        }, 1000);
      } else {
        setSaveState('error');
        setResultMessage(result.error ?? 'Failed to save');
      }
    } catch (err) {
      setSaveState('error');
      setResultMessage(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const handleDisconnect = async () => {
    const result = await disconnectIntegration(companyId, platform.slug as PlatformSlug);
    if (result.success) {
      onSaved();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'var(--overlay-bg)' }}
            variants={sheetOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[440px] overflow-y-auto"
            style={{
              background: 'var(--glass-bg-heavy)',
              backdropFilter: 'blur(60px) saturate(200%)',
              WebkitBackdropFilter: 'blur(60px) saturate(200%)',
              borderLeft: '1px solid var(--glass-border-strong)',
              boxShadow: 'var(--shadow-elevated)',
            }}
            variants={{
              hidden: { x: '100%' },
              visible: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 40 } },
              exit: { x: '100%', transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] } },
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between p-[var(--space-4)]"
              style={{
                background: 'var(--glass-bg-thick)',
                backdropFilter: 'blur(var(--glass-blur))',
                borderBottom: '1px solid var(--glass-border)',
              }}
            >
              <h2
                className="font-bold"
                style={{ fontSize: 'var(--text-title-3)', color: 'var(--text-primary)' }}
              >
                {platform.display_name}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'var(--fill-tertiary)',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className="p-[var(--space-4)]">
              {fields.map((field) => (
                <CredentialField
                  key={field.key}
                  field={field}
                  value={credentials[field.key] ?? ''}
                  onChange={(v) => handleFieldChange(field.key, v)}
                />
              ))}

              {/* Result message */}
              {resultMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-[var(--space-2)] mb-[var(--space-4)] p-[var(--space-3)]"
                  style={{
                    borderRadius: 'var(--radius-sm)',
                    background: saveState === 'success'
                      ? 'color-mix(in srgb, var(--system-green) 12%, transparent)'
                      : 'color-mix(in srgb, var(--system-red) 12%, transparent)',
                    fontSize: 'var(--text-subhead)',
                    color: saveState === 'success' ? 'var(--system-green)' : 'var(--system-red)',
                  }}
                >
                  {saveState === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  {resultMessage}
                </motion.div>
              )}

              {/* Buttons */}
              <div className="space-y-[var(--space-2)]">
                <button
                  onClick={handleSaveAndConnect}
                  disabled={saveState === 'saving' || saveState === 'testing'}
                  className="w-full flex items-center justify-center gap-[var(--space-2)]"
                  style={{
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: 'var(--radius-full)',
                    padding: '0 24px',
                    minHeight: 'var(--tap-min)',
                    fontWeight: 600,
                    fontSize: 'var(--text-body)',
                    cursor: (saveState === 'saving' || saveState === 'testing') ? 'not-allowed' : 'pointer',
                    opacity: (saveState === 'saving' || saveState === 'testing') ? 0.7 : 1,
                  }}
                >
                  {(saveState === 'saving' || saveState === 'testing') && (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Loader2 size={16} />
                    </motion.div>
                  )}
                  {saveState === 'testing' ? 'Testing connection...' : 'Save & Connect'}
                </button>

                <button
                  onClick={handleSaveOnly}
                  disabled={saveState === 'saving' || saveState === 'testing'}
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
                  Save Only
                </button>

                {existingCredentials && Object.keys(existingCredentials).length > 0 && (
                  <button
                    onClick={handleDisconnect}
                    className="w-full"
                    style={{
                      background: 'transparent',
                      color: 'var(--system-red)',
                      border: 'none',
                      padding: '0 16px',
                      minHeight: 'var(--tap-min)',
                      fontWeight: 500,
                      fontSize: 'var(--text-body)',
                      cursor: 'pointer',
                    }}
                  >
                    Disconnect
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
