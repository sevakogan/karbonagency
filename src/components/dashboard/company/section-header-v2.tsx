'use client';

import type { ReactNode } from 'react';

interface SectionHeaderV2Props {
  icon: ReactNode;
  title: string;
  right?: ReactNode;
}

export function SectionHeaderV2({ icon, title, right }: SectionHeaderV2Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span>
        <span style={{
          fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
          color: 'var(--text-primary)', textTransform: 'uppercase' as const,
        }}>
          {title}
        </span>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
