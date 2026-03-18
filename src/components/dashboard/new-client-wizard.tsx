"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";

// ─── Types ─────────────────────────────────────────────────────────────────

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
  name: "", company_name: "", contact_email: "",
  logo_url: "", meta_ad_account_id: "", meta_pixel_id: "", meta_access_token: "",
};

const STORAGE_KEY = "karbon_new_client_draft";

function loadDraft(): { form: FormData; step: number } | null {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null"); } catch { return null; }
}
function saveDraft(form: FormData, step: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ form: { ...form, meta_access_token: "" }, step }));
}
function clearDraft() { if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY); }

// ─── Step Bar ──────────────────────────────────────────────────────────────

const STEPS = ["Client Info", "Meta Credentials", "Invite & Connect"];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center mb-8">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current ? "bg-red-600 text-white" :
              i === current ? "bg-red-600 text-white ring-4 ring-red-100" :
              "bg-gray-100 text-gray-400"
            }`}>
              {i < current
                ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                : i + 1}
            </div>
            <span className={`text-[10px] font-medium mt-1 whitespace-nowrap ${i === current ? "text-red-600" : i < current ? "text-gray-600" : "text-gray-400"}`}>{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${i < current ? "bg-red-400" : "bg-gray-200"}`} />}
        </div>
      ))}
    </div>
  );
}

// ─── Resume Banner ─────────────────────────────────────────────────────────

function ResumeBanner({ draft, onResume, onDiscard }: { draft: { form: FormData; step: number }; onResume: () => void; onDiscard: () => void }) {
  return (
    <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-amber-800">📝 Unfinished client</p>
        <p className="text-xs text-amber-600 mt-0.5">&ldquo;{draft.form.name || "Untitled"}&rdquo; — stopped at step {draft.step + 1}</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onDiscard} className="text-xs text-amber-500 hover:text-amber-700 font-medium px-2 py-1 rounded-lg hover:bg-amber-100 transition-colors">Discard</button>
        <button onClick={onResume} className="text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition-colors">Continue →</button>
      </div>
    </div>
  );
}

// ─── Step 1 — Client Info ──────────────────────────────────────────────────

function Step1({ form, setForm, onNext }: { form: FormData; setForm: (f: FormData) => void; onNext: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  function handleLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setForm({ ...form, logo_url: ev.target?.result as string });
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Client Name <span className="text-red-500">*</span></label>
        <input autoFocus autoComplete="off" type="text" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="e.g. Shift Arcade Miami"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Company Name</label>
        <input autoComplete="off" type="text" value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          placeholder="e.g. ShiftArcade LLC"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Contact Email</label>
        <input autoComplete="off" type="email" value={form.contact_email}
          onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
          placeholder="e.g. owner@shiftarcade.com"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
        <p className="text-[10px] text-gray-400 mt-1">Used to pre-fill the invite email</p>
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Logo</label>
        <div className="flex gap-3 items-start">
          {form.logo_url && <img src={form.logo_url} alt="preview" className="w-14 h-14 rounded-xl object-cover border border-gray-200 flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full px-3 py-2 text-xs font-medium border border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-400 hover:text-red-500 transition-colors">
              📁 Upload image
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
            <input autoComplete="off" type="url" value={form.logo_url.startsWith("data:") ? "" : form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="or paste image URL"
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
          </div>
        </div>
      </div>
      <div className="pt-2 flex justify-end">
        <button onClick={onNext} disabled={!form.name.trim()}
          className="px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next: Meta Credentials →
        </button>
      </div>
    </div>
  );
}

// ─── Expandable info section ────────────────────────────────────────────────

function InfoSection({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
        <span className="text-xs font-semibold text-gray-700">{icon} {title}</span>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="px-4 py-3 text-xs text-gray-600 space-y-2 bg-white">{children}</div>}
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-blue-600 underline font-medium hover:text-blue-700">
      {children}
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </a>
  );
}

// ─── Step 2 — Meta Credentials ─────────────────────────────────────────────

function Step2({ form, setForm, onNext, onBack }: {
  form: FormData; setForm: (f: FormData) => void;
  onNext: (withCreds: boolean) => void; onBack: () => void;
}) {
  const [showToken, setShowToken] = useState(false);
  const hasAny = form.meta_ad_account_id || form.meta_pixel_id || form.meta_access_token;

  return (
    <div className="space-y-5">

      {/* Ad Account ID */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Ad Account ID</label>
        <input autoComplete="off" name="meta_ad_account_id" type="text" value={form.meta_ad_account_id}
          onChange={(e) => setForm({ ...form, meta_ad_account_id: e.target.value })}
          placeholder="act_1234567890"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
        <InfoSection title="What is it & where to find it" icon="💳">
          <p className="font-medium text-gray-800">What it is:</p>
          <p>Your unique Meta advertising account ID — all ad spend is billed to this account. Starts with <code className="bg-gray-100 px-1 rounded">act_</code> followed by numbers.</p>
          <p className="font-medium text-gray-800 mt-2">Where to find it:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to: <ExternalLink href="https://business.facebook.com/settings/ad-accounts">business.facebook.com/settings/ad-accounts</ExternalLink></li>
            <li>Click your ad account name</li>
            <li>Your Account ID (act_XXXXXXXXXX) appears at the top right</li>
          </ol>
          <p className="font-medium text-gray-800 mt-2">Don&apos;t have an ad account yet?</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to: <ExternalLink href="https://business.facebook.com/settings/ad-accounts">Business Settings → Ad Accounts</ExternalLink></li>
            <li>Click <strong>+ Add</strong> → <strong>Create a new ad account</strong></li>
            <li>Enter account name, select currency &amp; time zone</li>
            <li>Add a payment method (credit card or PayPal)</li>
            <li>Your new <code className="bg-gray-100 px-1 rounded">act_XXXXXXXXXX</code> ID appears immediately</li>
          </ol>
        </InfoSection>
      </div>

      {/* Pixel ID */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Pixel ID</label>
        <input autoComplete="off" name="meta_pixel_id" type="text" value={form.meta_pixel_id}
          onChange={(e) => setForm({ ...form, meta_pixel_id: e.target.value })}
          placeholder="1165380555705221"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
        <InfoSection title="What is it & where to find it" icon="📡">
          <p className="font-medium text-gray-800">What it is:</p>
          <p>A piece of code installed on the client&apos;s website that tracks visitor actions (purchases, bookings, page views). The Pixel ID is the 15–16 digit number that identifies their pixel.</p>
          <p className="font-medium text-gray-800 mt-2">Where to find it:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to: <ExternalLink href="https://business.facebook.com/events-manager/list">business.facebook.com/events-manager</ExternalLink></li>
            <li>Click <strong>Data Sources</strong> in the left menu</li>
            <li>Click your pixel name</li>
            <li>The Pixel ID is the number shown directly below the pixel name</li>
          </ol>
          <p className="font-medium text-gray-800 mt-2">No pixel yet? Create one:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to <ExternalLink href="https://business.facebook.com/events-manager/list">Events Manager</ExternalLink> → click <strong>+ Connect Data Sources</strong></li>
            <li>Choose <strong>Web</strong></li>
            <li>Select <strong>Meta Pixel</strong> → click Connect</li>
            <li>Name it (e.g. &ldquo;ShiftArcade Website&rdquo;) → click Continue</li>
            <li>Copy the Pixel ID shown on the next screen</li>
            <li>Send it to your developer to install on the website — or use <ExternalLink href="https://www.facebook.com/business/help/952192354843755">Meta&apos;s partner integrations</ExternalLink> for platforms like Shopify/Squarespace</li>
          </ol>
        </InfoSection>
      </div>

      {/* Access Token */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Access Token</label>
        <div className="relative">
          <input autoComplete="off" name="meta_access_token"
            type={showToken ? "text" : "password"} value={form.meta_access_token}
            onChange={(e) => setForm({ ...form, meta_access_token: e.target.value })}
            placeholder="EAAxxxxxx..."
            className="w-full px-3 py-2.5 pr-16 text-sm border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent" />
          <button type="button" onClick={() => setShowToken(!showToken)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 hover:text-gray-600 font-medium">
            {showToken ? "Hide" : "Show"}
          </button>
        </div>
        <InfoSection title="What is it, how to get it & make it long-lived" icon="🔑">
          <p className="font-medium text-gray-800">What it is:</p>
          <p>A secure key that gives Karbon Agency permission to read and manage ads on this account. Must be <strong>long-lived</strong> (60+ days or never-expiring).</p>

          <p className="font-medium text-gray-800 mt-3">✅ Method 1 — System User Token (Recommended — never expires)</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to: <ExternalLink href="https://business.facebook.com/settings/system-users">Business Settings → System Users</ExternalLink></li>
            <li>Click <strong>+ Add</strong> → name it <em>&ldquo;Karbon Agency API&rdquo;</em> → Role: <strong>Admin</strong></li>
            <li>Click <strong>Generate New Token</strong></li>
            <li>Select your Business App (or create one at <ExternalLink href="https://developers.facebook.com/apps">developers.facebook.com/apps</ExternalLink>)</li>
            <li>Check these permissions: <code className="bg-gray-100 px-1 rounded">✅ ads_management</code> <code className="bg-gray-100 px-1 rounded">✅ ads_read</code> <code className="bg-gray-100 px-1 rounded">✅ business_management</code></li>
            <li>Click <strong>Generate Token</strong></li>
            <li className="font-semibold text-red-600">⚠️ Copy it immediately — it won&apos;t be shown again</li>
          </ol>

          <p className="font-medium text-gray-800 mt-3">🔄 Method 2 — Personal Long-Lived Token (expires in 60 days)</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Go to: <ExternalLink href="https://developers.facebook.com/tools/explorer/">Graph API Explorer</ExternalLink></li>
            <li>Click <strong>Generate Access Token</strong> → log in with your Facebook account</li>
            <li>Add permissions: <code className="bg-gray-100 px-1 rounded">ads_management</code>, <code className="bg-gray-100 px-1 rounded">ads_read</code></li>
            <li>Click <strong>Generate Access Token</strong> — this gives you a short-lived token (1 hour)</li>
            <li>To extend to 60 days: go to <ExternalLink href="https://developers.facebook.com/tools/debug/accesstoken/">Access Token Debugger</ExternalLink></li>
            <li>Paste your token → click <strong>Debug</strong> → click <strong>Extend Access Token</strong></li>
            <li>Copy the new long-lived token at the bottom of the page</li>
          </ol>
        </InfoSection>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <button onClick={onBack} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors">← Back</button>
        <div className="flex gap-2">
          <button onClick={() => onNext(false)}
            className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            Skip — Invite Client
          </button>
          {hasAny && (
            <button onClick={() => onNext(true)}
              className="px-5 py-2.5 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 transition-colors">
              Save & Continue →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3 — Invite ───────────────────────────────────────────────────────

const PLAIN_TEXT = (clientName: string, karbonBizId: string) =>
`Hi ${clientName || "there"},

To get your campaigns live in our dashboard, please complete these 3 steps in Meta Business Manager (takes ~5 minutes):

━━━━━━━━━━━━━━━━━━━━━━
⚠️ BEFORE YOU START — Add an email to your Business Manager
━━━━━━━━━━━━━━━━━━━━━━
Meta requires a verified email on your Business Manager account before you can connect partners or set up tracking. If you haven't done this yet:

1. Open: https://business.facebook.com/settings
2. Click "Business info" — it's the FIRST item at the very top of the left sidebar
3. Scroll down to "Business contact info"
4. Add your email address and click Save
5. Check your inbox and click the verification link Meta sends you

Once your email is verified, continue with the steps below.

━━━━━━━━━━━━━━━━━━━━━━
STEP 1 — Add Karbon Agency as a Partner
━━━━━━━━━━━━━━━━━━━━━━
1. Open: https://business.facebook.com/settings/partners
2. Click "Add" → "Give a partner access to your assets"
3. Enter Business Manager ID: ${karbonBizId || "[YOUR KARBON BIZ ID]"}
4. Grant:
   ✅ Ad Account → role: Advertiser
   ✅ Pixel → role: Analyst

━━━━━━━━━━━━━━━━━━━━━━
STEP 2 — Find and send your Ad Account ID
━━━━━━━━━━━━━━━━━━━━━━
1. Open: https://business.facebook.com/settings/ad-accounts
2. Click your ad account name
3. Copy the ID shown at top right — it starts with "act_"
4. Reply to this message with that ID

No ad account yet? Create one:
→ Same page → click "+ Add" → "Create a new ad account"
→ Enter name, currency, time zone, add payment method

━━━━━━━━━━━━━━━━━━━━━━
STEP 3 — Find and send your Pixel ID
━━━━━━━━━━━━━━━━━━━━━━
1. Open: https://business.facebook.com/events-manager/list
2. Click "Data Sources" → click your pixel
3. The Pixel ID is the number below the pixel name (15–16 digits)
4. Reply with that number too

No pixel yet? Create one:
→ Same page → click "+ Connect Data Sources" → Web → Meta Pixel
→ Name it, click Create → copy the Pixel ID shown
→ Send the ID to me and have your developer install it on your site

━━━━━━━━━━━━━━━━━━━━━━

That's it! Once I have your Ad Account ID, Pixel ID, and partner access is accepted, your dashboard will be live within minutes.

Questions? Just reply to this message.`;

function CopyBtn({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2500); });
  }
  return (
    <button onClick={copy}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
        done ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
      }`}>
      {done
        ? <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg> Copied!</>
        : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" /></svg> {label}</>
      }
    </button>
  );
}

function Step3({ form, createdId, onDone }: { form: FormData; createdId: string | null; onDone: () => void }) {
  const [karbonBizId, setKarbonBizId] = useState<string>(() => {
    if (typeof window !== "undefined") return localStorage.getItem("karbon_biz_id") ?? "";
    return "";
  });
  const [appUrl, setAppUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") setAppUrl(window.location.origin);
  }, []);

  function saveKarbonId(val: string) {
    setKarbonBizId(val);
    if (typeof window !== "undefined") localStorage.setItem("karbon_biz_id", val);
  }

  // Build shareable invite URL — encodes client info so nobody can guess it
  const invitePayload = btoa(JSON.stringify({
    clientId: createdId,
    clientName: form.name,
    karbonBizId,
    ts: Date.now(),
  }));
  const shareableUrl = `${appUrl}/invite?d=${invitePayload}`;

  const plainText = PLAIN_TEXT(form.name, karbonBizId);
  const emailSubject = encodeURIComponent(`Connect your Meta account — 3 quick steps for ${form.name}`);
  const emailBody = encodeURIComponent(plainText);
  const mailtoLink = `mailto:${form.contact_email}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="space-y-5">
      {/* Success */}
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800">&ldquo;{form.name}&rdquo; created</p>
          <p className="text-xs text-emerald-600">Now send the client their setup instructions.</p>
        </div>
      </div>

      {/* Karbon Biz ID */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Karbon Agency Business Manager ID</label>
        <input autoComplete="off" type="text" value={karbonBizId} onChange={(e) => saveKarbonId(e.target.value)}
          placeholder="e.g. 123456789012345"
          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-red-500" />
        <p className="text-[10px] text-gray-400 mt-1">
          Find it at <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">business.facebook.com/settings</a> → Business Info.
          Saved locally — you only enter this once.
        </p>
      </div>

      {/* Message preview */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-semibold text-gray-700">Message to send client</label>
          {form.contact_email && <span className="text-[10px] text-gray-400">To: {form.contact_email}</span>}
        </div>
        <pre className="w-full p-4 text-[11px] text-gray-700 bg-gray-50 border border-gray-200 rounded-xl overflow-auto whitespace-pre-wrap max-h-56 leading-relaxed font-mono">
          {plainText}
        </pre>
      </div>

      {/* Send options */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-600">Send to client via:</p>

        {/* Email + Copy text */}
        <div className="flex flex-wrap gap-2">
          {form.contact_email && (
            <a href={mailtoLink}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              📧 Open in Mail App
            </a>
          )}
          <CopyBtn text={plainText} label="Copy as Text (for SMS / iMessage)" />
        </div>

        {/* Shareable URL */}
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">🔗 Or share a link — opens a full onboarding page</p>
          <div className="flex gap-2 items-center">
            <input readOnly value={shareableUrl}
              className="flex-1 px-3 py-2 text-[11px] bg-white border border-gray-200 rounded-lg font-mono text-gray-600 truncate focus:outline-none focus:ring-2 focus:ring-red-400"
              onFocus={(e) => e.target.select()} />
            <CopyBtn text={shareableUrl} label="Copy Link" />
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5">Unique URL — no one can guess it. Opens a step-by-step page your client can bookmark.</p>
        </div>
      </div>

      <button onClick={onDone}
        className="w-full px-5 py-3 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 transition-colors mt-2">
        {createdId ? "Open Ads Manager →" : "Back to Dashboard →"}
      </button>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────

export default function NewClientWizard() {
  const { session } = useAuth();
  const token = session?.access_token ?? null;
  const router = useRouter();

  const [showResume, setShowResume] = useState(false);
  const [draft, setDraft] = useState<{ form: FormData; step: number } | null>(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormData>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);

  useEffect(() => {
    const saved = loadDraft();
    if (saved?.form.name) { setDraft(saved); setShowResume(true); }
  }, []);

  useEffect(() => { if (step < 2) saveDraft(form, step); }, [form, step]);

  function resumeDraft() { if (draft) { setForm(draft.form); setStep(draft.step); } setShowResume(false); }
  function discardDraft() { clearDraft(); setDraft(null); setShowResume(false); }

  async function createClient(withCreds: boolean) {
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
      if (withCreds) {
        if (form.meta_ad_account_id) body.meta_ad_account_id = form.meta_ad_account_id;
        if (form.meta_pixel_id)      body.meta_pixel_id      = form.meta_pixel_id;
        if (form.meta_access_token)  body.meta_access_token  = form.meta_access_token;
      }
      const res  = await fetch("/api/meta/clients", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      const json = await res.json() as { data?: { id: string }; error?: string };
      if (!res.ok || json.error) throw new Error(json.error ?? "Failed to create client");
      setCreatedId(json.data!.id);
      clearDraft();
      setStep(2);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Unknown error");
    } finally { setSaving(false); }
  }

  function handleDone() {
    clearDraft();
    router.push(createdId ? `/dashboard/clients/${createdId}` : "/dashboard");
  }

  return (
    <div className="max-w-xl mx-auto">
      {showResume && draft && <ResumeBanner draft={draft} onResume={resumeDraft} onDiscard={discardDraft} />}
      <StepBar current={step} />
      {saveError && (
        <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">⚠️ {saveError}</div>
      )}
      {step === 0 && <Step1 form={form} setForm={setForm} onNext={() => setStep(1)} />}
      {step === 1 && (
        saving
          ? <div className="flex items-center justify-center py-16 gap-3 text-gray-500 text-sm"><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Creating client…</div>
          : <Step2 form={form} setForm={setForm} onBack={() => setStep(0)} onNext={createClient} />
      )}
      {step === 2 && <Step3 form={form} createdId={createdId} onDone={handleDone} />}
    </div>
  );
}
