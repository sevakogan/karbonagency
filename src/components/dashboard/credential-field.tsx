'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Eye, EyeOff, ExternalLink, Check } from 'lucide-react';
import { expandVariants } from '@/lib/animations';
import type { CredentialField as CredentialFieldType } from '@/types';

interface CredentialFieldProps {
  field: CredentialFieldType;
  value: string;
  onChange: (value: string) => void;
}

export function CredentialField({ field, value, onChange }: CredentialFieldProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [showWalkthrough, setShowWalkthrough] = useState(false);
  const isSecret = field.type === 'secret';
  const hasValue = value.trim().length > 0;

  return (
    <div className="mb-[var(--space-4)]">
      {/* Label + required */}
      <div className="flex items-center gap-[var(--space-2)] mb-[var(--space-1)]">
        <label
          className="font-medium"
          style={{ fontSize: 'var(--text-subhead)', color: 'var(--text-primary)' }}
        >
          {field.label}
          {field.required && <span style={{ color: 'var(--system-red)' }}> *</span>}
        </label>
        {hasValue && (
          <Check size={14} style={{ color: 'var(--system-green)' }} />
        )}
      </div>

      {/* Help text */}
      {field.help && (
        <p
          className="mb-[var(--space-2)]"
          style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-tertiary)', lineHeight: 1.4 }}
        >
          {field.help}
        </p>
      )}

      {/* Input */}
      <div className="relative">
        {isSecret && field.key !== 'service_account_json' ? (
          <input
            type={showSecret ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full pr-10"
            style={{
              background: 'var(--fill-tertiary)',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-body)',
              padding: '12px 16px',
              minHeight: 'var(--tap-min)',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-muted)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        ) : field.key === 'service_account_json' ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full"
            style={{
              background: 'var(--fill-tertiary)',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-footnote)',
              fontFamily: 'var(--font-mono)',
              padding: '12px 16px',
              outline: 'none',
              resize: 'vertical',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-muted)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full"
            style={{
              background: 'var(--fill-tertiary)',
              border: '1px solid transparent',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: 'var(--text-body)',
              padding: '12px 16px',
              minHeight: 'var(--tap-min)',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-muted)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        )}

        {isSecret && field.key !== 'service_account_json' && (
          <button
            type="button"
            onClick={() => setShowSecret(!showSecret)}
            className="absolute right-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {/* Walkthrough accordion */}
      {field.walkthrough && (
        <div className="mt-[var(--space-2)]">
          <button
            type="button"
            onClick={() => setShowWalkthrough(!showWalkthrough)}
            className="flex items-center gap-[var(--space-1)] w-full text-left"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 'var(--text-caption-1)',
              color: 'var(--accent)',
              fontWeight: 500,
            }}
          >
            <motion.div animate={{ rotate: showWalkthrough ? 180 : 0 }}>
              <ChevronDown size={14} />
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
                  className="mt-[var(--space-2)] p-[var(--space-3)]"
                  style={{
                    background: 'var(--fill-quaternary)',
                    borderRadius: 'var(--radius-sm)',
                  }}
                >
                  <p
                    className="font-medium mb-[var(--space-2)]"
                    style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-primary)' }}
                  >
                    {field.walkthrough.title}
                  </p>
                  <ol className="space-y-[var(--space-1)]">
                    {field.walkthrough.steps.map((step, i) => (
                      <li
                        key={i}
                        className="flex gap-[var(--space-2)]"
                        style={{ fontSize: 'var(--text-caption-1)', color: 'var(--text-secondary)' }}
                      >
                        <span
                          className="flex-shrink-0 w-4 h-4 flex items-center justify-center rounded-full font-bold"
                          style={{
                            fontSize: '10px',
                            background: 'var(--accent-muted)',
                            color: 'var(--accent)',
                          }}
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
                      className="flex items-center gap-[var(--space-1)] mt-[var(--space-2)]"
                      style={{
                        fontSize: 'var(--text-caption-1)',
                        color: 'var(--system-blue)',
                        fontWeight: 500,
                        textDecoration: 'none',
                      }}
                    >
                      Open in new tab <ExternalLink size={12} />
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
