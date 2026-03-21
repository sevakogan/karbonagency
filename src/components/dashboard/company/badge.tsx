'use client';

export function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 9px',
      borderRadius: 20,
      background: color + '16',
      color,
      fontSize: 10,
      fontWeight: 700,
    }}>
      {text}
    </span>
  );
}
