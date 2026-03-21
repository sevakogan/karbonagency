'use client';

import { motion } from 'framer-motion';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function ToggleSwitch({ checked, onChange, disabled = false, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative inline-flex items-center"
      style={{
        width: 51,
        height: 31,
        borderRadius: 15.5,
        background: checked ? 'var(--system-green)' : 'var(--fill-secondary)',
        transition: 'background var(--duration-fast) var(--ease-ios)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      <motion.div
        animate={{ x: checked ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 27,
          height: 27,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          position: 'absolute',
          top: 2,
          left: 2,
        }}
      />
    </button>
  );
}
