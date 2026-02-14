"use client";

import { useState, useCallback } from "react";
import {
  connectMetaAdAccount,
  disconnectMetaAdAccount,
  verifyMetaAdAccount,
} from "@/lib/actions/meta-connect";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MetaConnectCardProps {
  readonly campaignId: string;
  readonly currentAdAccountId: string | null;
  readonly isAdmin: boolean;
}

type FeedbackKind = "success" | "error" | "info";

interface Feedback {
  readonly kind: FeedbackKind;
  readonly message: string;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetaIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
    </svg>
  );
}

function StatusDot({ connected }: { readonly connected: boolean }) {
  const dotClass = connected
    ? "bg-green-500"
    : "bg-gray-400";

  return <span className={`w-2.5 h-2.5 rounded-full ${dotClass}`} />;
}

function FeedbackMessage({ feedback }: { readonly feedback: Feedback }) {
  const styles: Record<FeedbackKind, string> = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <div
      className={`mt-3 rounded-lg border px-3 py-2 text-sm ${styles[feedback.kind]}`}
    >
      {feedback.message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Read-only status view (for non-admins)
// ---------------------------------------------------------------------------

function ReadOnlyStatus({
  currentAdAccountId,
}: {
  readonly currentAdAccountId: string | null;
}) {
  const connected = currentAdAccountId !== null;

  return (
    <div className="flex items-center gap-3">
      <StatusDot connected={connected} />
      <div>
        <p className="text-sm font-medium text-gray-900">
          {connected ? "Meta Ads Connected" : "Meta Ads Not Connected"}
        </p>
        {connected && (
          <p className="text-xs text-gray-500 mt-0.5">
            Account ID: {currentAdAccountId}
          </p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin editable form
// ---------------------------------------------------------------------------

function AdminForm({
  campaignId,
  currentAdAccountId,
}: {
  readonly campaignId: string;
  readonly currentAdAccountId: string | null;
}) {
  const [inputValue, setInputValue] = useState(currentAdAccountId ?? "");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [connectedId, setConnectedId] = useState(currentAdAccountId);

  const isConnected = connectedId !== null;
  const trimmedInput = inputValue.trim();
  const isValidInput = trimmedInput.length > 0 && /^\d+$/.test(trimmedInput);
  const hasChanged = trimmedInput !== (connectedId ?? "");

  const handleConnect = useCallback(async () => {
    if (!isValidInput) {
      setFeedback({
        kind: "error",
        message: "Please enter a valid numeric Ad Account ID.",
      });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const result = await connectMetaAdAccount(campaignId, trimmedInput);

    setSaving(false);

    if (result.success) {
      setConnectedId(trimmedInput);
      setFeedback({
        kind: "success",
        message: "Meta Ad Account connected successfully.",
      });
    } else {
      setFeedback({
        kind: "error",
        message: result.error ?? "Failed to connect.",
      });
    }
  }, [campaignId, trimmedInput, isValidInput]);

  const handleDisconnect = useCallback(async () => {
    setDisconnecting(true);
    setFeedback(null);

    const result = await disconnectMetaAdAccount(campaignId);

    setDisconnecting(false);

    if (result.success) {
      setConnectedId(null);
      setInputValue("");
      setFeedback({
        kind: "success",
        message: "Meta Ad Account disconnected.",
      });
    } else {
      setFeedback({
        kind: "error",
        message: result.error ?? "Failed to disconnect.",
      });
    }
  }, [campaignId]);

  const handleVerify = useCallback(async () => {
    if (!isValidInput) {
      setFeedback({
        kind: "error",
        message: "Please enter a valid numeric Ad Account ID to verify.",
      });
      return;
    }

    setVerifying(true);
    setFeedback(null);

    const result = await verifyMetaAdAccount(trimmedInput);

    setVerifying(false);

    if (result.valid) {
      const name = result.name ? ` (${result.name})` : "";
      setFeedback({
        kind: "success",
        message: `Ad Account verified${name}. Ready to connect.`,
      });
    } else {
      setFeedback({
        kind: "error",
        message: result.error ?? "Verification failed.",
      });
    }
  }, [trimmedInput, isValidInput]);

  const isBusy = saving || verifying || disconnecting;

  return (
    <div>
      {/* Status indicator */}
      <div className="flex items-center gap-3 mb-4">
        <StatusDot connected={isConnected} />
        <p className="text-sm font-medium text-gray-900">
          {isConnected ? "Connected" : "Not Connected"}
        </p>
        {isConnected && (
          <span className="text-xs text-gray-500">
            ID: {connectedId}
          </span>
        )}
      </div>

      {/* Input field */}
      <div className="flex flex-col gap-3">
        <div>
          <label
            htmlFor="meta-ad-account-id"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Meta Ad Account ID
          </label>
          <input
            id="meta-ad-account-id"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 881993397805743"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setFeedback(null);
            }}
            disabled={isBusy}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-400">
            Numeric ID from Meta Business Manager (without &quot;act_&quot;
            prefix)
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleConnect}
            disabled={isBusy || !isValidInput || !hasChanged}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#DC2626] px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <LoadingSpinner />
                Saving...
              </>
            ) : isConnected ? (
              "Update"
            ) : (
              "Connect"
            )}
          </button>

          <button
            type="button"
            onClick={handleVerify}
            disabled={isBusy || !isValidInput}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {verifying ? (
              <>
                <LoadingSpinner />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </button>

          {isConnected && (
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isBusy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {disconnecting ? (
                <>
                  <LoadingSpinner />
                  Disconnecting...
                </>
              ) : (
                "Disconnect"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && <FeedbackMessage feedback={feedback} />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading spinner
// ---------------------------------------------------------------------------

function LoadingSpinner() {
  return (
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
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function MetaConnectCard({
  campaignId,
  currentAdAccountId,
  isAdmin,
}: MetaConnectCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 border-b border-gray-100 px-5 py-4">
        <div className="text-blue-600">
          <MetaIcon />
        </div>
        <h3 className="text-sm font-semibold text-gray-900">
          Meta Ads Connection
        </h3>
      </div>

      {/* Body */}
      <div className="px-5 py-4">
        {isAdmin ? (
          <AdminForm
            campaignId={campaignId}
            currentAdAccountId={currentAdAccountId}
          />
        ) : (
          <ReadOnlyStatus currentAdAccountId={currentAdAccountId} />
        )}
      </div>
    </div>
  );
}
