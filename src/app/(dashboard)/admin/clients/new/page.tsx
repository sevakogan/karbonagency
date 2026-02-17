"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/actions/clients";
import { verifyMetaAdAccount } from "@/lib/actions/meta-connect";
import Breadcrumb from "@/components/ui/breadcrumb";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";

// ---------------------------------------------------------------------------
// Meta help section
// ---------------------------------------------------------------------------

function MetaHelpSection() {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-1.5">
          How to find your Ad Account ID
        </h4>
        <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
          <li>
            Go to{" "}
            <span className="font-medium text-blue-600">
              business.facebook.com
            </span>
          </li>
          <li>
            Click{" "}
            <span className="font-medium text-gray-900">
              Business Settings
            </span>{" "}
            (gear icon)
          </li>
          <li>
            Go to{" "}
            <span className="font-medium text-gray-900">
              Accounts &gt; Ad Accounts
            </span>
          </li>
          <li>Copy the numeric Ad Account ID</li>
        </ol>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-gray-700 mb-1.5">
          Page ID &amp; Pixel ID
        </h4>
        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
          <li>
            <span className="font-medium text-gray-900">Page ID:</span>{" "}
            Facebook Page → About → Page ID
          </li>
          <li>
            <span className="font-medium text-gray-900">Pixel ID:</span>{" "}
            Events Manager → Data Sources → select Pixel → Settings
          </li>
        </ul>
      </div>
      <div className="p-2 rounded-lg bg-blue-50 border border-blue-100">
        <p className="text-xs text-blue-700">
          <span className="font-medium">Tip:</span> All IDs are numbers only.
          Don&apos;t include prefixes like &quot;act_&quot;.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Verify badge
// ---------------------------------------------------------------------------

function VerifyBadge({
  status,
  name,
}: {
  readonly status: "idle" | "verifying" | "valid" | "invalid";
  readonly name?: string;
}) {
  if (status === "idle") return null;

  if (status === "verifying") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-gray-500">
        <svg
          className="w-3.5 h-3.5 animate-spin"
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
        Verifying…
      </span>
    );
  }

  if (status === "valid") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-0.5">
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
        Verified{name ? ` — ${name}` : ""}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-2 py-0.5">
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
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
      Invalid
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export default function NewClientPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [showMetaHelp, setShowMetaHelp] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<
    "idle" | "verifying" | "valid" | "invalid"
  >("idle");
  const [verifiedName, setVerifiedName] = useState("");
  const [adAccountId, setAdAccountId] = useState("");

  const handleVerify = useCallback(async () => {
    const trimmed = adAccountId.trim();
    if (!trimmed || !/^\d+$/.test(trimmed)) return;

    setVerifyStatus("verifying");
    const result = await verifyMetaAdAccount(trimmed);
    if (result.valid) {
      setVerifyStatus("valid");
      setVerifiedName(result.name ?? "");
    } else {
      setVerifyStatus("invalid");
      setVerifiedName("");
    }
  }, [adAccountId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const slug = (formData.get("slug") as string).trim();
    const contactEmail = (formData.get("contact_email") as string).trim();
    const contactPhone = (formData.get("contact_phone") as string).trim();
    const ghlLocationId = (formData.get("ghl_location_id") as string).trim();
    const metaAdAccountId = (
      formData.get("meta_ad_account_id") as string
    ).trim();
    const metaPageId = (formData.get("meta_page_id") as string).trim();
    const metaPixelId = (formData.get("meta_pixel_id") as string).trim();

    const { id, error } = await createClient({
      name,
      slug,
      contact_email: contactEmail || undefined,
      contact_phone: contactPhone || undefined,
      ghl_location_id: ghlLocationId || undefined,
      meta_ad_account_id: metaAdAccountId || undefined,
      meta_pixel_id: metaPixelId || undefined,
      meta_page_id: metaPageId || undefined,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error);
      return;
    }

    router.push(`/admin/clients/${id}`);
  };

  const isValidAdAccountInput =
    adAccountId.trim().length > 0 && /^\d+$/.test(adAccountId.trim());

  return (
    <div className="max-w-lg">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Clients", href: "/admin/clients" },
          { label: "New Client" },
        ]}
      />
      <h1 className="text-2xl font-black text-gray-900 mt-2 mb-1">
        Add Client
      </h1>
      <p className="text-sm text-gray-500 mb-8">
        Create a new client and connect their Facebook ads
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* ── Client Info ─────────────────────────── */}
        <div>
          <label className={formStyles.label}>
            Venue Name <span className="text-red-600">*</span>
          </label>
          <input
            name="name"
            required
            className={formStyles.input}
            placeholder="e.g. SpeedZone Racing"
          />
        </div>

        <div>
          <label className={formStyles.label}>
            Slug <span className="text-red-600">*</span>
          </label>
          <input
            name="slug"
            required
            className={formStyles.input}
            placeholder="e.g. speedzone-racing"
            pattern="[a-z0-9-]+"
            title="Lowercase letters, numbers, and hyphens only"
          />
        </div>

        <div>
          <label className={formStyles.label}>Contact Email</label>
          <input
            name="contact_email"
            type="email"
            className={formStyles.input}
            placeholder="contact@venue.com"
          />
        </div>

        <div>
          <label className={formStyles.label}>Contact Phone</label>
          <input
            name="contact_phone"
            type="tel"
            className={formStyles.input}
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label className={formStyles.label}>GHL Location ID</label>
          <input
            name="ghl_location_id"
            className={formStyles.input}
            placeholder="Optional GoHighLevel location ID"
          />
        </div>

        {/* ── Meta Ads Integration ────────────────── */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.52 1.49-3.93 3.78-3.93 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-900">
                Meta Ads Integration
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowMetaHelp((prev) => !prev)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                />
              </svg>
              <span>How to find IDs</span>
            </button>
          </div>

          {showMetaHelp && <MetaHelpSection />}

          <div className="space-y-3 mt-3">
            {/* Ad Account ID with verify */}
            <div>
              <label className={formStyles.label}>Meta Ad Account ID</label>
              <div className="flex gap-2">
                <input
                  name="meta_ad_account_id"
                  inputMode="numeric"
                  className={`flex-1 ${formStyles.input}`}
                  placeholder="e.g. 881993397805743"
                  value={adAccountId}
                  onChange={(e) => {
                    setAdAccountId(e.target.value);
                    setVerifyStatus("idle");
                    setVerifiedName("");
                  }}
                />
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={
                    !isValidAdAccountInput || verifyStatus === "verifying"
                  }
                  className={buttonStyles.secondary}
                >
                  {verifyStatus === "verifying" ? "…" : "Verify"}
                </button>
              </div>
              <div className="mt-1.5">
                <VerifyBadge status={verifyStatus} name={verifiedName} />
              </div>
            </div>

            {/* Facebook Page ID */}
            <div>
              <label className={formStyles.label}>Facebook Page ID</label>
              <input
                name="meta_page_id"
                inputMode="numeric"
                className={formStyles.input}
                placeholder="e.g. 1234567890"
              />
            </div>

            {/* Meta Pixel ID */}
            <div>
              <label className={formStyles.label}>Meta Pixel ID</label>
              <input
                name="meta_pixel_id"
                inputMode="numeric"
                className={formStyles.input}
                placeholder="e.g. 9876543210"
              />
            </div>
          </div>
        </div>

        {/* ── Error & Submit ──────────────────────── */}
        {status === "error" && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "saving"}
          className={`w-full ${buttonStyles.primary}`}
        >
          {status === "saving" ? "Creating..." : "Create Client"}
        </button>
      </form>
    </div>
  );
}
