"use client";

import { useState, useEffect } from "react";
import { getMetaAccountStatus } from "@/lib/actions/meta";

interface MetaStatusBadgeProps {
  readonly clientId: string;
  /** If provided, uses this ad account ID directly instead of looking up from the clients table. */
  readonly adAccountId?: string;
}

type ConnectionState = "loading" | "connected" | "disconnected" | "error";

export default function MetaStatusBadge({ clientId, adAccountId }: MetaStatusBadgeProps) {
  const [state, setState] = useState<ConnectionState>("loading");
  const [detail, setDetail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      try {
        const status = await getMetaAccountStatus(clientId, adAccountId);

        if (cancelled) return;

        if (!status.isConnected) {
          setState("disconnected");
          setDetail("No Meta Ad Account configured");
          return;
        }

        if (status.error) {
          setState("error");
          setDetail(status.error);
          return;
        }

        if (status.tokenStatus && !status.tokenStatus.isValid) {
          setState("error");
          setDetail(status.tokenStatus.error ?? "Token expired");
          return;
        }

        setState("connected");
        setDetail(
          status.adAccountId
            ? `Account: ${status.adAccountId}`
            : null
        );
      } catch {
        if (cancelled) return;
        setState("error");
        setDetail("Failed to check status");
      }
    }

    checkStatus();
    return () => { cancelled = true; };
  }, [clientId, adAccountId]);

  const config: Record<
    ConnectionState,
    { bg: string; dot: string; text: string; label: string }
  > = {
    loading: {
      bg: "bg-gray-50 border-gray-200",
      dot: "bg-gray-300 animate-pulse",
      text: "text-gray-500",
      label: "Checking Meta…",
    },
    connected: {
      bg: "bg-green-50 border-green-200",
      dot: "bg-green-500",
      text: "text-green-700",
      label: "Meta Connected",
    },
    disconnected: {
      bg: "bg-gray-50 border-gray-200",
      dot: "bg-gray-400",
      text: "text-gray-500",
      label: "Meta Not Connected",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      dot: "bg-red-500",
      text: "text-red-700",
      label: "Meta Error",
    },
  };

  const { bg, dot, text, label } = config[state];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${bg}`}
      title={detail ?? undefined}
    >
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      <span className={`text-xs font-medium ${text}`}>{label}</span>
    </div>
  );
}
