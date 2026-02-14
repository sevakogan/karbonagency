"use client";

import { useState, useCallback, useRef, useEffect } from "react";
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
// Icons
// ---------------------------------------------------------------------------

function MetaIcon({ className = "w-5 h-5" }: { readonly className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
    </svg>
  );
}

function ChevronIcon({ open }: { readonly open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Copyable helpers
// ---------------------------------------------------------------------------

function CopyableLink({ text }: { readonly text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700 hover:underline"
      title="Click to copy"
    >
      {text}
      {copied ? (
        <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      ) : (
        <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
        </svg>
      )}
    </button>
  );
}

function CopyableCode({ text }: { readonly text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1 font-mono bg-gray-100 rounded px-1 py-0.5 text-gray-700 hover:bg-gray-200 transition-colors"
      title="Click to copy"
    >
      {text}
      {copied && (
        <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Inline help section (rendered inside the popover, no absolute positioning)
// ---------------------------------------------------------------------------

function HelpSection() {
  return (
    <div className="border-b border-gray-100 px-4 py-3 bg-gray-50">
      <h4 className="text-xs font-semibold text-gray-700 mb-2">How to find your Ad Account ID</h4>
      <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside">
        <li>Go to <CopyableLink text="business.facebook.com" /></li>
        <li>Click <span className="font-medium text-gray-900">Business Settings</span> (gear icon)</li>
        <li>Go to <span className="font-medium text-gray-900">Accounts &gt; Ad Accounts</span></li>
        <li>Select the ad account for this project</li>
        <li>Copy the <span className="font-medium text-gray-900">Ad Account ID</span> (e.g. <CopyableCode text="881993397805743" />)</li>
      </ol>
      <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
        <p className="text-xs text-blue-700">
          <span className="font-medium">Tip:</span> The ID is numbers only. Don&apos;t include the &quot;act_&quot; prefix.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status dot
// ---------------------------------------------------------------------------

function StatusDot({ connected }: { readonly connected: boolean }) {
  return <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />;
}

// ---------------------------------------------------------------------------
// Feedback
// ---------------------------------------------------------------------------

function FeedbackMessage({ feedback }: { readonly feedback: Feedback }) {
  const styles: Record<FeedbackKind, string> = {
    success: "bg-green-50 border-green-200 text-green-700",
    error: "bg-red-50 border-red-200 text-red-700",
    info: "bg-blue-50 border-blue-200 text-blue-700",
  };

  return (
    <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${styles[feedback.kind]}`}>
      {feedback.message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading spinner
// ---------------------------------------------------------------------------

function LoadingSpinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Read-only badge (for non-admins)
// ---------------------------------------------------------------------------

function ReadOnlyBadge({ currentAdAccountId }: { readonly currentAdAccountId: string | null }) {
  const connected = currentAdAccountId !== null;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 ${
        connected
          ? "bg-green-50 border-green-200"
          : "bg-gray-50 border-gray-200"
      }`}
      title={connected ? `Ad Account: ${currentAdAccountId}` : undefined}
    >
      <MetaIcon className="w-4 h-4 text-blue-600" />
      <StatusDot connected={connected} />
      <span className={`text-xs font-medium ${connected ? "text-green-700" : "text-gray-500"}`}>
        {connected ? "Connected" : "Not Connected"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin compact popover
// ---------------------------------------------------------------------------

function AdminPopover({
  campaignId,
  currentAdAccountId,
}: {
  readonly campaignId: string;
  readonly currentAdAccountId: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [inputValue, setInputValue] = useState(currentAdAccountId ?? "");
  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [connectedId, setConnectedId] = useState(currentAdAccountId);
  const popoverRef = useRef<HTMLDivElement>(null);

  const isConnected = connectedId !== null;
  const trimmedInput = inputValue.trim();
  const isValidInput = trimmedInput.length > 0 && /^\d+$/.test(trimmedInput);
  const hasChanged = trimmedInput !== (connectedId ?? "");

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowHelp(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnect = useCallback(async () => {
    if (!isValidInput) {
      setFeedback({ kind: "error", message: "Enter a valid numeric Ad Account ID." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    const result = await connectMetaAdAccount(campaignId, trimmedInput);
    setSaving(false);
    if (result.success) {
      setConnectedId(trimmedInput);
      setFeedback({ kind: "success", message: "Connected successfully." });
    } else {
      setFeedback({ kind: "error", message: result.error ?? "Failed to connect." });
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
      setFeedback({ kind: "success", message: "Disconnected." });
    } else {
      setFeedback({ kind: "error", message: result.error ?? "Failed to disconnect." });
    }
  }, [campaignId]);

  const handleVerify = useCallback(async () => {
    if (!isValidInput) {
      setFeedback({ kind: "error", message: "Enter a valid numeric ID to verify." });
      return;
    }
    setVerifying(true);
    setFeedback(null);
    const result = await verifyMetaAdAccount(trimmedInput);
    setVerifying(false);
    if (result.valid) {
      const name = result.name ? ` (${result.name})` : "";
      setFeedback({ kind: "success", message: `Verified${name}. Ready to connect.` });
    } else {
      setFeedback({ kind: "error", message: result.error ?? "Verification failed." });
    }
  }, [trimmedInput, isValidInput]);

  const isBusy = saving || verifying || disconnecting;

  return (
    <div ref={popoverRef} className="relative">
      {/* Compact trigger button */}
      <button
        type="button"
        onClick={() => { setOpen((prev) => !prev); setShowHelp(false); }}
        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors cursor-pointer ${
          isConnected
            ? "bg-green-50 border-green-200 hover:bg-green-100"
            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
        }`}
      >
        <MetaIcon className="w-4 h-4 text-blue-600" />
        <StatusDot connected={isConnected} />
        <span className={`text-xs font-medium ${isConnected ? "text-green-700" : "text-gray-500"}`}>
          {isConnected ? "Connected" : "Not Connected"}
        </span>
        <ChevronIcon open={open} />
      </button>

      {/* Popover dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-80 rounded-xl border border-gray-200 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div className="flex items-center gap-2">
              <MetaIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-gray-900">Meta Ads</span>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp((prev) => !prev)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
              title="How to find your Ad Account ID"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
              </svg>
              <span>How to find ID</span>
            </button>
          </div>

          {/* Inline help section (toggled, no absolute positioning) */}
          {showHelp && <HelpSection />}

          {/* Body */}
          <div className="px-4 py-3">
            {/* Status */}
            <div className="flex items-center gap-2 mb-3">
              <StatusDot connected={isConnected} />
              <span className="text-sm font-medium text-gray-900">
                {isConnected ? "Connected" : "Not Connected"}
              </span>
              {isConnected && (
                <span className="text-xs text-gray-400 font-mono">{connectedId}</span>
              )}
            </div>

            {/* Input */}
            <input
              type="text"
              inputMode="numeric"
              placeholder="Ad Account ID (e.g. 881993397805743)"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setFeedback(null); }}
              disabled={isBusy}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-red-500 focus:ring-1 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                type="button"
                onClick={handleConnect}
                disabled={isBusy || !isValidInput || !hasChanged}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#DC2626] px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? <><LoadingSpinner /> Saving...</> : isConnected ? "Update" : "Connect"}
              </button>
              <button
                type="button"
                onClick={handleVerify}
                disabled={isBusy || !isValidInput}
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {verifying ? <><LoadingSpinner /> Verifying...</> : "Verify"}
              </button>
              {isConnected && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  disabled={isBusy}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {disconnecting ? <><LoadingSpinner /> ...</> : "Disconnect"}
                </button>
              )}
            </div>

            {/* Feedback */}
            {feedback && <FeedbackMessage feedback={feedback} />}
          </div>
        </div>
      )}
    </div>
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
  if (isAdmin) {
    return (
      <AdminPopover
        campaignId={campaignId}
        currentAdAccountId={currentAdAccountId}
      />
    );
  }

  return <ReadOnlyBadge currentAdAccountId={currentAdAccountId} />;
}
