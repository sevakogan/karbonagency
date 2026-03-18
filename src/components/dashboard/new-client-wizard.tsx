"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormData {
  name: string;
  company_name: string;
  contact_email: string;
  logo_url: string;
  meta_ad_account_id: string;
  meta_pixel_id: string;
  meta_access_token: string;
}

const EMPTY: FormData = {
  name: "",
  company_name: "",
  contact_email: "",
  logo_url: "",
  meta_ad_account_id: "",
  meta_pixel_id: "",
  meta_access_token: "",
};

const STORAGE_KEY = "karbon_new_client_draft";

function loadDraft(): { form: FormData; step: number } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { form: FormData; step: number };
  } catch { return null; }
}

function saveDraft(form: FormData, step: number) {
  if (typeof window === "undefined") return;
  // Don't persist access token for security
  const safe = { ...form, meta_access_token: "" };
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ form: safe, step }));
}

function clearDraft() {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
}

// ---------------------------------------------------------------------------
// Step indicators
// ---------------------------------------------------------------------------

const STEPS = ["Client Info", "Meta Credentials", "Invite Client"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current ? "bg-red-600 text-white" :
              i === current ? "bg-red-600 text-white ring-4 ring-red-100" :
              "bg-gray-100 text-gray-400"
            }`}>
              {i < current ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              ) : i + 1}
            </div>
            <span className={`text-[10px] font-medium mt-1 whitespace-nowrap ${
              i === current ? "text-red-600" : i < current ? "text-gray-600" : "text-gray-400"
            }`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${i < current ? "bg-red-400" : "bg-gray-200"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Draft resume banner
// ---------------------------------------------------------------------------

function ResumeBanner({ draft, onResume, onDiscard }: {
  draft: { form: FormData; step: number };
  onResume: () => void;
  onDiscard: () => void;
}) {
  return (
    <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-amber-800">📝 You have an unfinished client</p>
        <p className="text-xs text-amber-600 mt-0.5">
          &ldquo;{draft.form.name || "Untitled"}&rdquo; — stopped at step {draft.step + 1} of 3
        </p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onDiscard} className="text-xs text-amber-500 hover:text-amber-700 font-medium px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors">
          Discard
        </button>
        <button onClick={onResume} className="text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors">
          Continue →
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1 — Client Info
// ---------------------------------------------------------------------------

function Step1({ form, setForm, onNext }: {
  form: FormData;
  setForm: (f: FormData) => void;
  onNext: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm({ ...form, logo_url: ev.target?.result as string });
    reader.readAsDataURL(file);
  }

  const canProceed = form.name.trim().length > 0;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Client Name <span className="text-red-500">*</span></label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Shift Arcade Miami"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Company Name</label>
        <input
          type="text"
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          placeholder="e.g. ShiftArcade LLC"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contact Email</label>
        <input
          type="email"
          value={form.contact_email}
          onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
          placeholder="e.g. owner@shiftarcade.com"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <p className="text-[10px] text-gray-400 mt-1">Used to pre-fill the client invite email</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Logo</label>
        <div className="flex gap-3 items-start">
          {form.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.logo_url} alt="logo preview" className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
          )}
          <div className="flex-1 space-y-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="w-full px-3 py-2 text-xs font-medium border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors"
            >
              📁 Upload image
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
            <input
              type="url"
              value={form.logo_url.startsWith("data:") ? "" : form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="or paste image URL"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Next: Meta Credentials →
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2 — Meta Credentials
// ---------------------------------------------------------------------------

function Step2({ form, setForm, onNext, onBack }: {
  form: FormData;
  setForm: (f: FormData) => void;
  onNext: (hasCredentials: boolean) => void;
  onBack: () => void;
}) {
  const [showToken, setShowToken] = useState(false);
  const hasAny = form.meta_ad_account_id || form.meta_pixel_id || form.meta_access_token;

  return (
    <div className="space-y-5">
      <div className="rounded-xl bg-blue-50 border border-blue-100 p-4 text-xs text-blue-700">
        <p className="font-semibold mb-1">📋 What you need from the client</p>
        <ul className="space-y-0.5 list-disc list-inside text-blue-600">
          <li>Their <strong>Ad Account ID</strong> — starts with <code>act_</code></li>
          <li>Their <strong>Pixel ID</strong> — 15–16 digit number from Events Manager</li>
          <li>A <strong>long-lived access token</strong> with <code>ads_read</code> + <code>ads_management</code> permissions</li>
        </ul>
        <p className="mt-2 text-blue-500">Don&apos;t have these yet? Skip to the next step to send the client an invite.</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ad Account ID</label>
        <input
          type="text"
          value={form.meta_ad_account_id}
          onChange={(e) => setForm({ ...form, meta_ad_account_id: e.target.value })}
          placeholder="act_1234567890"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <p className="text-[10px] text-gray-400 mt-1">Found in Meta Business Settings → Ad Accounts</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pixel ID</label>
        <input
          type="text"
          value={form.meta_pixel_id}
          onChange={(e) => setForm({ ...form, meta_pixel_id: e.target.value })}
          placeholder="1165380555705221"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <p className="text-[10px] text-gray-400 mt-1">Found in Meta Business → Events Manager</p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Access Token</label>
        <div className="relative">
          <input
            type={showToken ? "text" : "password"}
            value={form.meta_access_token}
            onChange={(e) => setForm({ ...form, meta_access_token: e.target.value })}
            placeholder="EAAxxxxxx..."
            className="w-full px-3 py-2.5 pr-16 text-sm border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 font-medium"
          >
            {showToken ? "Hide" : "Show"}
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Long-lived token from Meta Business or System User</p>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <button onClick={onBack} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">
          ← Back
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onNext(false)}
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Skip — Invite Client
          </button>
          {hasAny && (
            <button
              onClick={() => onNext(true)}
              className="px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors"
            >
              Save & Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3 — Invite Client
// ---------------------------------------------------------------------------

const INVITE_TEMPLATE = (clientName: string, karbonBizId: string) => `Hi${clientName ? ` ${clientName}` : ""},

To get your campaigns live inside our dashboard, I need you to complete 3 quick steps in Meta Business Manager. It takes about 5 minutes.

──────────────────────────────────────
STEP 1 — Add Karbon Agency as a Partner
──────────────────────────────────────
1. Go to: https://business.facebook.com/settings/partners
2. Click "Add" → "Give a partner access to your assets"
3. Enter our Business Manager ID: ${karbonBizId || "[YOUR KARBON BIZ ID — fill in above]"}
4. Grant access to:
   ✅ Your Ad Account → role: Advertiser
   ✅ Your Pixel → role: Analyst

──────────────────────────────────────
STEP 2 — Send me your Ad Account ID
──────────────────────────────────────
1. Go to: https://business.facebook.com/settings/ad-accounts
2. Click your ad account — copy the ID that starts with act_
3. Reply to this email with that number

──────────────────────────────────────
STEP 3 — Send me your Pixel ID
──────────────────────────────────────
1. Go to: https://business.facebook.com/events-manager
2. Click your pixel — the ID is the number shown under the pixel name
3. Reply with that number too

──────────────────────────────────────

Once I have those two IDs and partner access is accepted, your dashboard will be live within minutes.

Questions? Just reply to this email.`;

function Step3({ form, createdId, onDone }: {
  form: FormData;
  createdId: string | null;
  onDone: () => void;
}) {
  const [karbonBizId, setKarbonBizId] = useState<string>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("karbon_biz_id") ?? "";
    return "";
  });
  const [copied, setCopied] = useState(false);

  const emailSubject = "Connect your Meta account to our ad dashboard — 3 quick steps";
  const emailBody = INVITE_TEMPLATE(form.name, karbonBizId);

  function saveKarbonId(val: string) {
    setKarbonBizId(val);
    if (typeof window !== "undefined") localStorage.setItem("karbon_biz_id", val);
  }

  function copyEmail() {
    const full = `Subject: ${emailSubject}\n\n${emailBody}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  const mailtoLink = `mailto:${form.contact_email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div className="space-y-5">
      {/* Success banner */}
      <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-bold text-green-800">&ldquo;{form.name}&rdquo; created successfully</p>
          <p className="text-xs text-green-600">Now send the client their onboarding instructions to connect Meta.</p>
        </div>
      </div>

      {/* Karbon BizID */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
          Your Karbon Agency Business Manager ID
        </label>
        <input
          type="text"
          value={karbonBizId}
          onChange={(e) => saveKarbonId(e.target.value)}
          placeholder="e.g. 123456789012345"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
        />
        <p className="text-[10px] text-gray-400 mt-1">
          Found at{" "}
          <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">
            business.facebook.com/settings
          </a>
          {" "}→ Business Info. Saved locally — you only need to enter this once.
        </p>
      </div>

      {/* Email preview */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-gray-700">Client invite email</label>
          {form.contact_email && (
            <span className="text-[10px] text-gray-400">To: {form.contact_email}</span>
          )}
        </div>
        <pre className="w-full p-4 text-[11px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl overflow-auto whitespace-pre-wrap max-h-64 leading-relaxed font-mono">
          {emailBody}
        </pre>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={copyEmail}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
            copied
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
          }`}
        >
          {copied ? (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Copied!</>
          ) : (
            <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg> Copy Email</>
          )}
        </button>

        {form.contact_email && (
          <a
            href={mailtoLink}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            Open in Mail App
          </a>
        )}
      </div>

      <button
        onClick={onDone}
        className="w-full px-5 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors"
      >
        {createdId ? "Open Ads Manager →" : "Back to Dashboard →"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wizard
// ---------------------------------------------------------------------------

export default function NewClientWizard() {
  const { session } = useAuth();
  const token = session?.access_token ?? null;
  const router = useRouter();

  const [draft, setDraft] = useState<{ form: FormData; step: number } | null>(null);
  const [showResume, setShowResume] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Load draft on mount
  useEffect(() => {
    const saved = loadDraft();
    if (saved && saved.form.name) {
      setDraft(saved);
      setShowResume(true);
    }
  }, []);

  // Auto-save on every change (except step 2 final / step 3 done)
  useEffect(() => {
    if (step < 2) saveDraft(form, step);
  }, [form, step]);

  function resumeDraft() {
    if (!draft) return;
    setForm(draft.form);
    setStep(draft.step);
    setShowResume(false);
  }

  function discardDraft() {
    clearDraft();
    setDraft(null);
    setShowResume(false);
  }

  function updateForm(f: FormData) {
    setForm(f);
  }

  async function createClient(withCredentials: boolean) {
    if (!token) return;
    setSaving(true);
    setSaveError(null);
    try {
      const body: Record<string, string | null> = {
        name: form.name,
        company_name: form.company_name || null,
        contact_email: form.contact_email || null,
        logo_url: form.logo_url || null,
      };
      if (withCredentials) {
        if (form.meta_ad_account_id) body.meta_ad_account_id = form.meta_ad_account_id;
        if (form.meta_pixel_id) body.meta_pixel_id = form.meta_pixel_id;
        if (form.meta_access_token) body.meta_access_token = form.meta_access_token;
      }
      const res = await fetch("/api/meta/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json() as { data?: { id: string }; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to create client");
      setCreatedId(json.data!.id);
      clearDraft();
      setStep(2);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  function handleDone() {
    clearDraft();
    if (createdId) {
      router.push(`/dashboard/clients/${createdId}`);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      {showResume && draft && (
        <ResumeBanner draft={draft} onResume={resumeDraft} onDiscard={discardDraft} />
      )}

      <StepBar current={step} />

      {saveError && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠️ {saveError}
        </div>
      )}

      {step === 0 && (
        <Step1 form={form} setForm={updateForm} onNext={() => setStep(1)} />
      )}

      {step === 1 && (
        saving ? (
          <div className="flex items-center justify-center py-16 gap-3 text-gray-500 text-sm">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Creating client…
          </div>
        ) : (
          <Step2
            form={form}
            setForm={updateForm}
            onBack={() => setStep(0)}
            onNext={(hasCredentials) => createClient(hasCredentials)}
          />
        )
      )}

      {step === 2 && (
        <Step3 form={form} createdId={createdId} onDone={handleDone} />
      )}
    </div>
  );
}
