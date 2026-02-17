"use client";

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SyncResult {
  readonly campaign: string;
  readonly rows: number;
  readonly error: string | null;
}

interface SyncResponse {
  readonly message: string;
  readonly since: string;
  readonly until: string;
  readonly results: readonly SyncResult[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SyncMetaButton() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = useCallback(async (days: number) => {
    setSyncing(true);
    setResult(null);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setError("Not authenticated. Please sign in again.");
        setSyncing(false);
        return;
      }

      const now = new Date();
      const rangeStart = new Date(now);
      rangeStart.setDate(now.getDate() - days);
      const since = rangeStart.toISOString().split("T")[0];
      const until = now.toISOString().split("T")[0];

      const res = await fetch(
        `/api/sync-meta?since=${since}&until=${until}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? `Sync failed (${res.status})`);
        setSyncing(false);
        return;
      }

      const data: SyncResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }, []);

  const totalRows = result?.results.reduce((sum, r) => sum + r.rows, 0) ?? 0;
  const hasErrors = result?.results.some((r) => r.error !== null) ?? false;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <svg
          className="w-5 h-5 text-blue-600"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
        </svg>
        <h3 className="text-sm font-semibold text-gray-900">
          Sync Meta Ads Data
        </h3>
      </div>

      <p className="text-xs text-gray-500 mb-4">
        Pull ad performance data from Meta for all connected clients.
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => handleSync(7)}
          disabled={syncing}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          Last 7 days
        </button>
        <button
          type="button"
          onClick={() => handleSync(30)}
          disabled={syncing}
          className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          Last 30 days
        </button>
        <button
          type="button"
          onClick={() => handleSync(90)}
          disabled={syncing}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {syncing ? "Syncing…" : "Last 90 days"}
        </button>
      </div>

      {/* Spinner */}
      {syncing && (
        <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
          <svg
            className="w-4 h-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Pulling data from Meta… this may take a moment.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <div
          className={`mt-4 rounded-lg border px-3 py-2 text-xs ${
            hasErrors
              ? "bg-yellow-50 border-yellow-200 text-yellow-800"
              : "bg-green-50 border-green-200 text-green-700"
          }`}
        >
          <p className="font-medium">{result.message}</p>
          <p className="text-gray-500 mt-0.5">
            {result.since} → {result.until} · {totalRows} rows synced
          </p>
          {result.results
            .filter((r) => r.error)
            .map((r, i) => (
              <p key={i} className="text-red-600 mt-1">
                {r.campaign}: {r.error}
              </p>
            ))}
        </div>
      )}
    </div>
  );
}
