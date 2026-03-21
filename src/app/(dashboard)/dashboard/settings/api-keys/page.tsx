'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Key, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/animations';
import { listApiKeys, createApiKey, revokeApiKey } from '@/lib/actions/api-keys';
import type { ApiKey } from '@/types';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = async () => {
    const { data } = await listApiKeys();
    setKeys(data);
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) return;
    const { key, data } = await createApiKey(newKeyName);
    if (key && data) {
      setRevealedKey(key);
      setKeys((prev) => [data, ...prev]);
      setNewKeyName('');
    }
  };

  const handleRevoke = async (id: string) => {
    await revokeApiKey(id);
    setKeys((prev) => prev.map((k) => k.id === id ? { ...k, is_active: false } : k));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      <div className="flex items-center gap-[var(--space-4)] mb-[var(--space-6)]">
        <Link
          href="/dashboard/settings"
          className="flex items-center justify-center w-10 h-10"
          style={{ background: 'var(--fill-quaternary)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)' }}
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-bold" style={{ fontSize: 'var(--text-title-2)', color: 'var(--text-primary)' }}>
          API Keys
        </h1>
      </div>

      <p className="mb-[var(--space-6)]" style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-secondary)' }}>
        API keys let external services like N8N read your Karbon data. Keys are shown only once when created.
      </p>

      {/* Create new key */}
      <div className="glass-card p-[var(--space-4)] mb-[var(--space-6)]">
        <div className="flex gap-[var(--space-3)]">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., N8N Production)"
            className="flex-1"
            style={{ background: 'var(--fill-tertiary)', border: '1px solid transparent', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: 'var(--text-body)', padding: '12px 16px', outline: 'none' }}
          />
          <button
            onClick={handleCreate}
            disabled={!newKeyName.trim()}
            style={{
              background: newKeyName.trim() ? 'var(--accent)' : 'var(--fill-tertiary)',
              color: newKeyName.trim() ? 'white' : 'var(--text-quaternary)',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              padding: '0 24px',
              minHeight: 'var(--tap-min)',
              fontWeight: 600,
              cursor: newKeyName.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Create Key
          </button>
        </div>

        {revealedKey && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-[var(--space-3)] p-[var(--space-3)] flex items-center justify-between"
            style={{
              background: 'color-mix(in srgb, var(--system-amber) 12%, transparent)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <div>
              <p style={{ fontSize: 'var(--text-caption-1)', color: 'var(--system-amber)', fontWeight: 600 }}>
                Copy this key now — it won't be shown again
              </p>
              <code style={{ fontSize: 'var(--text-footnote)', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', wordBreak: 'break-all' }}>
                {revealedKey}
              </code>
            </div>
            <button
              onClick={() => handleCopy(revealedKey)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: 8 }}
            >
              <Copy size={16} />
            </button>
          </motion.div>
        )}
      </div>

      {/* Key list */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-[var(--space-3)]">
        {keys.map((key) => (
          <motion.div key={key.id} variants={staggerItem} className="glass-card p-[var(--space-4)] flex items-center justify-between">
            <div className="flex items-center gap-[var(--space-3)]">
              <Key size={16} style={{ color: key.is_active ? 'var(--system-green)' : 'var(--text-quaternary)' }} />
              <div>
                <span className="font-medium" style={{ fontSize: 'var(--text-subhead)', color: key.is_active ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {key.name}
                </span>
                <span className="ml-[var(--space-2)]" style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  {key.key_prefix}...
                </span>
              </div>
            </div>
            <div className="flex items-center gap-[var(--space-3)]">
              {key.last_used_at && (
                <span style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-tertiary)' }}>
                  Last used: {new Date(key.last_used_at).toLocaleDateString()}
                </span>
              )}
              {key.is_active && (
                <button
                  onClick={() => handleRevoke(key.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--system-red)', padding: 8 }}
                  title="Revoke key"
                >
                  <Trash2 size={16} />
                </button>
              )}
              {!key.is_active && (
                <span style={{ fontSize: 'var(--text-caption-1)', color: 'var(--system-red)' }}>Revoked</span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
