"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface InviteData {
  clientId?: string;
  clientName?: string;
  karbonBizId?: string;
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-12 pb-8 last:pb-0">
      {/* vertical line */}
      <div className="absolute left-4 top-8 bottom-0 w-0.5 bg-gray-100 last:hidden" />
      {/* circle */}
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center text-white text-sm font-bold shadow-md">
        {n}
      </div>
      <div className="pt-0.5">
        <h3 className="text-base font-bold text-gray-900 mb-3">{title}</h3>
        <div className="space-y-2 text-sm text-gray-600">{children}</div>
      </div>
    </div>
  );
}

function ExLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[#1877F2] underline font-semibold hover:opacity-80">
      {children}
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
      </svg>
    </a>
  );
}

function Pill({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{children}</span>;
}

function InviteContent() {
  const params = useSearchParams();
  const [data, setData] = useState<InviteData>({});

  useEffect(() => {
    const d = params.get("d");
    if (!d) return;
    try {
      const decoded = JSON.parse(atob(d)) as InviteData;
      setData(decoded);
    } catch { /* invalid payload */ }
  }, [params]);

  const clientName = data.clientName || "your business";
  const karbonBizId = data.karbonBizId || "";

  return (
    <div className="min-h-screen bg-[#F0F2F5]">
      {/* Header */}
      <div className="bg-[#1877F2] text-white">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-black text-lg">K</div>
            <span className="font-semibold text-white/90 text-sm">Karbon Agency</span>
          </div>
          <h1 className="text-2xl font-black mb-2">Connect {clientName} to our Ad Dashboard</h1>
          <p className="text-blue-100 text-sm">3 steps · takes about 5 minutes · no technical experience needed</p>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-6 -mt-1">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 px-5 py-3 flex items-center gap-4">
          {["Add Karbon as Partner", "Send Ad Account ID", "Send Pixel ID"].map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div className="w-6 h-6 rounded-full bg-blue-50 border-2 border-[#1877F2] flex items-center justify-center text-[#1877F2] text-xs font-bold flex-shrink-0">{i + 1}</div>
              <span className="text-xs font-medium text-gray-600 hidden sm:block">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="max-w-2xl mx-auto px-6 pb-16">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-0">

          {/* Pre-check */}
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-5">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-900 mb-1">Do this first — verify your email in Meta Business Manager</p>
                <p className="text-xs text-amber-700 mb-3">Meta requires a verified email on your Business Manager account before you can connect partners or set up tracking. If you skip this, you&apos;ll see an error on Step 1.</p>
                <ol className="text-xs text-amber-800 space-y-1.5 list-decimal list-inside">
                  <li>Open: <ExLink href="https://business.facebook.com/settings">business.facebook.com/settings</ExLink></li>
                  <li>Click <strong>&ldquo;Business info&rdquo;</strong> — it&apos;s the <strong>very first item</strong> at the top of the left sidebar</li>
                  <li>Scroll down to <strong>&ldquo;Business contact info&rdquo;</strong></li>
                  <li>Add your email address and click <strong>Save</strong></li>
                  <li>Check your inbox and click the verification link Meta sends you</li>
                </ol>
                <p className="text-xs text-amber-600 mt-2 font-medium">✅ Once your email is verified, continue with Step 1 below.</p>
              </div>
            </div>
          </div>

          {/* Step 1 */}
          <Step n={1} title="Add Karbon Agency as a Partner in Meta Business Manager">
            <p>This gives us read-only access to manage your ads. You stay in full control.</p>
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-gray-800">Follow these steps:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Open: <ExLink href="https://business.facebook.com/settings/partners">Business Settings → Partners</ExLink></li>
                <li>Click <strong>&ldquo;Add&rdquo;</strong> → <strong>&ldquo;Give a partner access to your assets&rdquo;</strong></li>
                <li>
                  Enter our Business Manager ID:
                  {karbonBizId
                    ? <span className="ml-1 font-mono text-sm bg-yellow-100 text-yellow-900 px-2 py-0.5 rounded font-bold">{karbonBizId}</span>
                    : <span className="ml-1 text-red-500 font-medium">[ask Karbon Agency for this ID]</span>
                  }
                </li>
                <li>On the next screen, grant access to:</li>
              </ol>
              <div className="ml-5 flex flex-wrap gap-2 mt-1">
                <Pill color="bg-green-100 text-green-800">✅ Your Ad Account → role: Advertiser</Pill>
                <Pill color="bg-green-100 text-green-800">✅ Your Pixel → role: Analyst</Pill>
              </div>
            </div>
            <p className="text-xs text-gray-400">Don&apos;t have a Meta Business Manager account yet? Create one free at <ExLink href="https://business.facebook.com/overview">business.facebook.com</ExLink></p>
          </Step>

          {/* Step 2 */}
          <Step n={2} title="Send us your Ad Account ID">
            <p>Your Ad Account ID is a unique identifier for where your ads run. It starts with <code className="bg-gray-100 px-1 rounded font-mono text-sm">act_</code></p>
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-gray-800">Where to find it:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Open: <ExLink href="https://business.facebook.com/settings/ad-accounts">Business Settings → Ad Accounts</ExLink></li>
                <li>Click your ad account name</li>
                <li>Your ID (<code className="bg-white px-1 rounded font-mono text-xs">act_XXXXXXXXXX</code>) appears at the top of the page</li>
                <li>Copy it and reply to the email / message Karbon sent you</li>
              </ol>
            </div>
            <details className="group">
              <summary className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline list-none">
                ▶ I don&apos;t have an ad account yet — how do I create one?
              </summary>
              <div className="mt-2 bg-gray-50 rounded-xl p-4 text-xs space-y-1.5">
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Go to <ExLink href="https://business.facebook.com/settings/ad-accounts">Business Settings → Ad Accounts</ExLink></li>
                  <li>Click <strong>+ Add</strong> → <strong>Create a new ad account</strong></li>
                  <li>Enter an account name (e.g. &ldquo;{clientName}&rdquo;), select your currency and time zone</li>
                  <li>Add a payment method (credit card or PayPal)</li>
                  <li>Your new <code className="bg-white px-1 rounded font-mono">act_XXXXXXXXXX</code> ID appears at the top — copy and send it to Karbon</li>
                </ol>
              </div>
            </details>
          </Step>

          {/* Step 3 */}
          <Step n={3} title="Send us your Pixel ID">
            <p>The Meta Pixel tracks actions on your website (bookings, sign-ups, page views). The Pixel ID is a 15–16 digit number.</p>
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-gray-800">Where to find it:</p>
              <ol className="list-decimal list-inside space-y-1.5">
                <li>Open: <ExLink href="https://business.facebook.com/events-manager/list">Events Manager → Data Sources</ExLink></li>
                <li>Click your pixel name</li>
                <li>The Pixel ID (e.g. <code className="bg-white px-1 rounded font-mono text-xs">1165380555705221</code>) is shown below the pixel name</li>
                <li>Copy it and reply to the email / message from Karbon</li>
              </ol>
            </div>
            <details className="group">
              <summary className="text-xs text-blue-600 font-semibold cursor-pointer hover:underline list-none">
                ▶ I don&apos;t have a pixel yet — how do I create one?
              </summary>
              <div className="mt-2 bg-gray-50 rounded-xl p-4 text-xs space-y-1.5">
                <ol className="list-decimal list-inside space-y-1.5">
                  <li>Go to <ExLink href="https://business.facebook.com/events-manager/list">Events Manager</ExLink></li>
                  <li>Click <strong>+ Connect Data Sources</strong> (green button, top right)</li>
                  <li>Select <strong>Web</strong> → then <strong>Meta Pixel</strong> → click <strong>Connect</strong></li>
                  <li>Give your pixel a name (e.g. &ldquo;{clientName} Website&rdquo;) → click <strong>Continue</strong></li>
                  <li>Copy the Pixel ID shown → send it to Karbon</li>
                  <li>To install it on your website, forward the setup email to your developer, or use a <ExLink href="https://www.facebook.com/business/help/952192354843755">partner integration</ExLink> (Shopify, Squarespace, Wix, etc.)</li>
                </ol>
              </div>
            </details>
          </Step>

        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-3">
            <div className="w-7 h-7 rounded-lg bg-[#1877F2] flex items-center justify-center font-black text-white text-xs">K</div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-900">Karbon Agency</p>
              <p className="text-[10px] text-gray-400">This is a private onboarding link — for {clientName} only</p>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Questions? Reply to the email you received from Karbon Agency.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading onboarding page…</div>
      </div>
    }>
      <InviteContent />
    </Suspense>
  );
}
