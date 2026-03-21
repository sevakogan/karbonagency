'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook that polls a callback at a fixed interval (default 5 min).
 * Returns the time since last successful poll for display.
 */
export function useLivePoll(
  fetchFn: () => Promise<void>,
  intervalMs: number = 300_000, // 5 min
) {
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchFn();
      setLastUpdated(new Date());
    } catch {
      // Silent fail on poll — data stays stale until next poll
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchFn, isRefreshing]);

  useEffect(() => {
    const timer = setInterval(() => {
      refresh();
    }, intervalMs);

    return () => {
      clearInterval(timer);
      abortRef.current?.abort();
    };
  }, [intervalMs, refresh]);

  return { lastUpdated, isRefreshing, refresh };
}

/**
 * Formats a Date as "X min ago" or "just now"
 */
export function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}
