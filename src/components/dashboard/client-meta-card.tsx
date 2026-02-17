"use client";

import { useState, useCallback } from "react";
import { updateClient } from "@/lib/actions/clients";
import { verifyMetaAdAccount } from "@/lib/actions/meta-connect";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientMetaCardProps {
  readonly clientId: string;
  readonly metaAdAccountId: string | null;
  readonly metaPageId: string | null;
  readonly metaPixelId: string | null;
}

type FeedbackKind = "success" | "error";

interface Feedback {
  readonly kind: FeedbackKind;
  readonly message: string;
}

type VerifyState = "idle" | "verifying" | "valid" | "invalid";

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MetaIcon() {
  return (
    <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
    </svg>
  );
}

function StatusDot({ connected }: { readonly connected: boolean }) {
  return (
    <span
      className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`}
    />
  );
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
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

export default function ClientMetaCard({
  clientId,
  metaAdAccountId,
  metaPageId,
  metaPixelId,
}: ClientMetaCardProps) {
  const [adAccount, setAdAccount] = useState(metaAdAccountId ?? "");
  const [pageId, setPageId] = useState(metaPageId ?? "");
  const [pixelId, setPixelId] = useState(metaPixelId ?? "");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [verifiedName, setVerifiedName] = useState("");

  // Track saved state for dirty detection
  const [savedAdAccount, setSavedAdAccount] = useState(metaAdAccountId ?? "");
  const [savedPageId, setSavedPageId] = useState(metaPageId ?? "");
  const [savedPixelId, setSavedPixelId] = useState(metaPixelId ?? "");

  const isConnected = savedAdAccount.length > 0;
  const isDirty =
    adAccount.trim() !== savedAdAccount ||
    pageId.trim() !== savedPageId ||
    pixelId.trim() !== savedPixelId;

  const isValidAdAccount =
    adAccount.trim().length === 0 || /^\d+$/.test(adAccount.trim());

  const handleVerify = useCallback(async () => {
    const trimmed = adAccount.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) return;

    setVerifyState("verifying");
    setFeedback(null);
    const result = await verifyMetaAdAccount(trimmed);
    if (result.valid) {
      setVerifyState("valid");
      setVerifiedName(result.name ?? "");
    } else {
      setVerifyState("invalid");
      setVerifiedName("");
      setFeedback({
        kind: "error",
        message: result.error ?? "Could not verify this Ad Account ID.",
      });
    }
  }, [adAccount]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setFeedback(null);

    const { error } = await updateClient(clientId, {
      meta_ad_account_id: adAccount.trim() || null,
      meta_page_id: pageId.trim() || null,
      meta_pixel_id: pixelId.trim() || null,
    });

    setSaving(false);

    if (error) {
      setFeedback({ kind: "error", message: error });
      return;
    }

    // Update saved state
    setSavedAdAccount(adAccount.trim());
    setSavedPageId(pageId.trim());
    setSavedPixelId(pixelId.trim());
    setFeedback({ kind: "success", message: "Meta integration updated." });
  }, [clientId, adAccount, pageId, pixelId]);

  const handleDisconnect = useCallback(async () => {
    setSaving(true);
    setFeedback(null);

    const { error } = await updateClient(clientId, {
      meta_ad_account_id: null,
      meta_page_id: null,
      meta_pixel_id: null,
    });

    setSaving(false);

    if (error) {
      setFeedback({ kind: "error", message: error });
      return;
    }

    setAdAccount("");
    setPageId("");
    setPixelId("");
    setSavedAdAccount("");
    setSavedPageId("");
    setSavedPixelId("");
    setVerifyState("idle");
    setVerifiedName("");
    setFeedback({ kind: "success", message: "Disconnected all Meta IDs." });
  }, [clientId]);

  const isBusy = saving || verifyState === "verifying";
  const canVerify =
    adAccount.trim().length > 0 &&
    /^\d+$/.test(adAccount.trim()) &&
    verifyState !== "verifying";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden mb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <MetaIcon />
          <h3 className="text-sm font-semibold text-gray-900">
            Meta Ads Integration
          </h3>
          <div className="flex items-center gap-1.5">
            <StatusDot connected={isConnected} />
            <span
              className={`text-xs font-medium ${isConnected ? "text-green-700" : "text-gray-400"}`}
            >
              {isConnected ? "Connected" : "Not Connected"}
            </span>
          </div>
        </div>

        {isConnected && (
          <button
            type="button"
            onClick={handleDisconnect}
            disabled={isBusy}
            className="text-xs text-red-600 hover:text-red-700 font-medium disabled:opacity-50"
          >
            Disconnect All
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        {/* Ad Account ID + Verify */}
        <div>
          <label className={formStyles.label}>Ad Account ID</label>
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              className={`flex-1 ${formStyles.input}`}
              placeholder="e.g. 881993397805743"
              value={adAccount}
              onChange={(e) => {
                setAdAccount(e.target.value);
                setVerifyState("idle");
                setVerifiedName("");
                setFeedback(null);
              }}
              disabled={isBusy}
            />
            <button
              type="button"
              onClick={handleVerify}
              disabled={!canVerify || isBusy}
              className={buttonStyles.secondary}
            >
              {verifyState === "verifying" ? (
                <span className="flex items-center gap-1">
                  <Spinner /> …
                </span>
              ) : (
                "Verify"
              )}
            </button>
          </div>
          {/* Verify result */}
          {verifyState === "valid" && (
            <p className="mt-1.5 text-xs text-green-700 flex items-center gap-1">
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              Verified{verifiedName ? ` — ${verifiedName}` : ""}
            </p>
          )}
          {verifyState === "invalid" && (
            <p className="mt-1.5 text-xs text-red-600">
              Invalid Ad Account ID. Check the number and try again.
            </p>
          )}
        </div>

        {/* Page ID */}
        <div>
          <label className={formStyles.label}>Facebook Page ID</label>
          <input
            inputMode="numeric"
            className={formStyles.input}
            placeholder="e.g. 1234567890"
            value={pageId}
            onChange={(e) => {
              setPageId(e.target.value);
              setFeedback(null);
            }}
            disabled={isBusy}
          />
        </div>

        {/* Pixel ID */}
        <div>
          <label className={formStyles.label}>Meta Pixel ID</label>
          <input
            inputMode="numeric"
            className={formStyles.input}
            placeholder="e.g. 9876543210"
            value={pixelId}
            onChange={(e) => {
              setPixelId(e.target.value);
              setFeedback(null);
            }}
            disabled={isBusy}
          />
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`rounded-lg border px-3 py-2 text-sm ${
              feedback.kind === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Save button */}
        {isDirty && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isBusy || !isValidAdAccount}
            className={`w-full ${buttonStyles.primary}`}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner /> Saving…
              </span>
            ) : (
              "Save Changes"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
