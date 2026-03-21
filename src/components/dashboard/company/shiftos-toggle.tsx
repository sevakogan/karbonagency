'use client';

import { Activity } from 'lucide-react';

interface ShiftOSToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function ShiftOSToggle({ enabled, onToggle }: ShiftOSToggleProps) {
  return (
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 rounded-lg px-3 h-8 text-xs font-medium transition-all"
      style={{
        background: enabled ? '#00D26A18' : 'var(--fill-quaternary)',
        color: enabled ? '#00D26A' : 'var(--text-tertiary)',
        border: enabled ? '1.5px solid #00D26A' : '1.5px solid transparent',
      }}
    >
      <Activity size={13} />
      ShiftOS Analytics
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: enabled ? '#00D26A' : 'var(--text-quaternary)' }}
      />
    </button>
  );
}
