'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/lib/theme-provider';
import { Sun, Moon, Monitor } from 'lucide-react';

const icons = {
  light: Sun,
  dark: Moon,
  system: Monitor,
} as const;

const cycle: Array<'dark' | 'light' | 'system'> = ['dark', 'light', 'system'];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const Icon = icons[theme];

  const nextTheme = () => {
    const currentIndex = cycle.indexOf(theme);
    const next = cycle[(currentIndex + 1) % cycle.length];
    setTheme(next);
  };

  return (
    <button
      onClick={nextTheme}
      className="flex items-center justify-center"
      style={{
        width: 'var(--tap-min)',
        height: 'var(--tap-min)',
        borderRadius: 'var(--radius-full)',
        background: 'var(--fill-quaternary)',
        color: 'var(--text-secondary)',
        border: 'none',
        cursor: 'pointer',
      }}
      title={`Theme: ${theme}`}
    >
      <motion.div
        key={theme}
        initial={{ rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        exit={{ rotate: 180, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <Icon size={18} />
      </motion.div>
    </button>
  );
}
