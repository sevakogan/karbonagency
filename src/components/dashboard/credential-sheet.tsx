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

          {/* Sheet — compact panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-[340px] overflow-y-auto"
            style={{
              background: 'var(--bg-elevated)',
              borderLeft: '1px solid var(--glass-border-strong)',
              boxShadow: 'var(--shadow-elevated)',
            }}
            variants={{
              hidden: { x: '100%' },
              visible: { x: 0, transition: { type: 'spring', stiffness: 350, damping: 38 } },
              exit: { x: '100%', transition: { duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] } },
            }}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
              style={{
                background: 'var(--bg-elevated)',
                borderBottom: '1px solid var(--separator)',
              }}
            >
              <h2
                className="font-semibold"
                style={{ fontSize: '15px', color: 'var(--text-primary)' }}
              >
                {platform.display_name}
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: 'var(--fill-quaternary)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 26,
                  height: 26,
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

            {/* Body */}
            <div className="px-4 py-3">
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
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-1.5 mb-3 p-2 rounded-lg"
                  style={{
                    background: saveState === 'success'
                      ? 'color-mix(in srgb, var(--system-green) 10%, transparent)'
                      : 'color-mix(in srgb, var(--system-red) 10%, transparent)',
                    fontSize: '11px',
                    color: saveState === 'success' ? 'var(--system-green)' : 'var(--system-red)',
                  }}
                >
                  {saveState === 'success' ? <CheckCircle size={12} /> : <AlertCircle size={12} />}
                  {resultMessage}
                </motion.div>
              )}

              {/* Buttons — compact */}
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handleSaveAndConnect}
                  disabled={saveState === 'saving' || saveState === 'testing'}
                  className="flex-1 flex items-center justify-center gap-1.5"
                  style={{
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '7px 12px',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: (saveState === 'saving' || saveState === 'testing') ? 'not-allowed' : 'pointer',
                    opacity: (saveState === 'saving' || saveState === 'testing') ? 0.7 : 1,
                  }}
                >
                  {(saveState === 'saving' || saveState === 'testing') && (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Loader2 size={12} />
                    </motion.div>
                  )}
                  {saveState === 'testing' ? 'Testing...' : 'Save & Connect'}
                </button>

                <button
                  onClick={handleSaveOnly}
                  disabled={saveState === 'saving' || saveState === 'testing'}
                  style={{
                    background: 'var(--fill-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '8px',
                    padding: '7px 12px',
                    fontWeight: 500,
                    fontSize: '12px',
                    cursor: 'pointer',
                  }}
                >
                  Save
                </button>
              </div>

              {existingCredentials && Object.keys(existingCredentials).length > 0 && (
                <button
                  onClick={handleDisconnect}
                  className="w-full mt-2"
                  style={{
                    background: 'transparent',
                    color: 'var(--system-red)',
                    border: 'none',
                    padding: '6px',
                    fontWeight: 500,
                    fontSize: '11px',
                    cursor: 'pointer',
                  }}
                >
                  Disconnect
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
