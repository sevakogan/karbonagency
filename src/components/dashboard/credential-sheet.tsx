'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
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
    setSaveState('testing');
    setResultMessage('');
    try {
      const result = await saveIntegrationCredentials(
        companyId,
        platform.slug as PlatformSlug,
        credentials,
        true
      );
      if (result.success) {
        setSaveState('success');
        setResultMessage(result.statusDetail ?? 'Connected successfully');
        setTimeout(() => { onSaved(); onClose(); }, 1500);
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
        setResultMessage('Saved');
        setTimeout(() => { onSaved(); onClose(); }, 1000);
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
    if (result.success) { onSaved(); onClose(); }
  };

  const isBusy = saveState === 'saving' || saveState === 'testing';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop — click to close */}
          <motion.div
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.3)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="relative w-full max-w-sm h-full overflow-y-auto"
            style={{
              background: 'var(--bg-base)',
              borderLeft: '1px solid var(--separator-opaque)',
              boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
            }}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 350, damping: 38 }}
          >
            {/* Header */}
            <div
              className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
              style={{ background: 'var(--bg-base)', borderBottom: '1px solid var(--separator)' }}
            >
              <h2 className="font-semibold" style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
                {platform.display_name}
              </h2>
              <button
                onClick={onClose}
                type="button"
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

            {/* Form */}
            <div className="px-4 py-3">
              {fields.map((field) => (
                <CredentialField
                  key={field.key}
                  field={field}
                  value={credentials[field.key] ?? ''}
                  onChange={(v) => handleFieldChange(field.key, v)}
                />
              ))}

              {/* Result */}
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

              {/* Buttons */}
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleSaveAndConnect}
                  disabled={isBusy}
                  className="flex-1 flex items-center justify-center gap-1.5"
                  style={{
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: isBusy ? 'not-allowed' : 'pointer',
                    opacity: isBusy ? 0.7 : 1,
                  }}
                >
                  {isBusy && (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                      <Loader2 size={12} />
                    </motion.div>
                  )}
                  {saveState === 'testing' ? 'Testing...' : 'Save & Connect'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveOnly}
                  disabled={isBusy}
                  style={{
                    background: 'var(--fill-tertiary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--separator-opaque)',
                    borderRadius: '8px',
                    padding: '8px 12px',
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
                  type="button"
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
        </div>
      )}
    </AnimatePresence>
  );
}
