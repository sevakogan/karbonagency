'use client';

import { useState, useEffect, useRef } from 'react';

interface AnimNumProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export function AnimNum({ value, prefix = '', suffix = '', decimals = 0 }: AnimNumProps) {
  const [d, setD] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    const end = value;
    const t0 = performance.now();
    function tick(now: number) {
      const p = Math.min((now - t0) / 1000, 1);
      setD(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  const formatted = decimals > 0 ? d.toFixed(decimals) : Math.round(d);
  const display = value >= 10000
    ? `${(d / 1000).toFixed(1)}k`
    : typeof formatted === 'number'
      ? formatted.toLocaleString()
      : formatted;

  return <>{prefix}{display}{suffix}</>;
}
