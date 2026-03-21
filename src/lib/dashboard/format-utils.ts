export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(n < 10 && n > 0 ? 2 : 0);
}

export function fmtDate(d: string): string {
  const date = new Date(d + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmtCurrency(n: number): string {
  return `$${fmt(n)}`;
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function delta(current: number, previous: number): { value: number; isUp: boolean } {
  if (previous === 0) return { value: 0, isUp: true };
  const pct = ((current - previous) / previous) * 100;
  return { value: Math.abs(pct), isUp: pct >= 0 };
}
