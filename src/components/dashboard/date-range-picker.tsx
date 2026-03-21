'use client';

import { motion } from 'framer-motion';

type DateRange = '7d' | '30d' | 'mtd' | 'custom';

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

const options: Array<{ value: DateRange; label: string }> = [
  { value: '7d', label: '7D' },
  { value: '30d', label: '30D' },
  { value: 'mtd', label: 'MTD' },
  { value: 'custom', label: 'Custom' },
];

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  return (
    <div
      className="relative flex p-[2px]"
      style={{
        background: 'var(--fill-quaternary)',
        borderRadius: 'var(--radius-full)',
      }}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className="relative z-10 px-[var(--space-3)] py-[var(--space-1)] font-medium"
          style={{
            fontSize: 'var(--text-caption-1)',
            color: value === option.value ? 'white' : 'var(--text-secondary)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            borderRadius: 'var(--radius-full)',
            minHeight: 32,
          }}
        >
          {value === option.value && (
            <motion.div
              layoutId="date-range-pill"
              className="absolute inset-0"
              style={{
                background: 'var(--accent)',
                borderRadius: 'var(--radius-full)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{option.label}</span>
        </button>
      ))}
    </div>
  );
}
