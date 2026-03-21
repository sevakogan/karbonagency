'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Eye, EyeOff, ExternalLink, Check } from 'lucide-react';
import { expandVariants } from '@/lib/animations';
import type { CredentialField as CredentialFieldType } from '@/types';

interface CredentialFieldProps {
  field: CredentialFieldType;
  value: string;
  onChange: (value: string) => void;
}

const inputStyle = {
  background: 'var(--fill-tertiary)',
  border: '1px solid transparent',
  borderRadius: '8px',
  color: 'var(--text-primary)',
  fontSize: '13px',
  padding: '7px 10px',
  outline: 'none',
  width: '100%',
} as const;

export function CredentialField({ field, value, onChange }: CredentialFieldProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const isSecret = field.type === 'secret';
  const hasValue = value.trim().length > 0;
  const isTextarea = field.key === 'service_account_json';

  return (
    <div className="mb-3">
      {/* Label row */}
      <div className="flex items-center gap-1 mb-1">
        <label className="font-medium" style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
          {field.label}
        </label>
        {field.required && <span style={{ color: 'var(--system-red)', fontSize: '12px' }}>*</span>}
        {hasValue && <Check size={11} style={{ color: 'var(--system-green)' }} />}
      </div>

      {/* Help — single line, subtle */}
      {field.help && (
        <p style={{ fontSize: '10px', color: 'var(--text-quaternary)', lineHeight: 1.3, marginBottom: '4px' }}>
          {field.help}
        </p>
      )}

      {/* Input */}
      <div className="relative">
        {isTextarea ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)', fontSize: '11px', resize: 'vertical' }}
          />
        ) : (
          <input
            type={isSecret && !showSecret ? 'password' : 'text'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            style={{ ...inputStyle, paddingRight: isSecret ? '32px' : '10px' }}
          />
        )}

        {isSecret && !isTextarea && (
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-2 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-quaternary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        )}
      </div>

      {/* Walkthrough — collapsed by default */}
      {field.walkthrough && (
        <div className="mt-1">
          <button
            type="button"
            onClick={() => setShowWalkthrough(!showWalkthrough)}
            className="flex items-center gap-0.5"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '10px',
              color: 'var(--system-blue)',
              fontWeight: 500,
              padding: 0,
            }}
          >
            <motion.div
              animate={{ rotate: showWalkthrough ? 90 : 0 }}
              transition={{ duration: 0.15 }}
            >
              <ChevronRight size={10} />
            </motion.div>
            How to find this
          </button>

          <AnimatePresence>
            {showWalkthrough && (
              <motion.div
                variants={expandVariants}
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                className="overflow-hidden"
              >
                <div
                  className="mt-1 p-2"
                  style={{ background: 'var(--fill-quaternary)', borderRadius: '6px' }}
                >
                  <ol className="space-y-0.5">
                    {field.walkthrough.steps.map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-1.5"
                        style={{ fontSize: '10px', color: 'var(--text-secondary)', lineHeight: 1.4 }}
                      >
                        <span
                          className="flex-shrink-0 w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold"
                          style={{ fontSize: '8px', background: 'var(--accent-muted)', color: 'var(--accent)', marginTop: '1px' }}
                        >
                          {i + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  {field.walkthrough.direct_link && (
                    <a
                      href={field.walkthrough.direct_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 mt-1.5"
                      style={{ fontSize: '10px', color: 'var(--system-blue)', fontWeight: 500, textDecoration: 'none' }}
                    >
                      Open <ExternalLink size={9} />
                    </a>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
