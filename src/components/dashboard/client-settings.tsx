"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";

interface ClientData {
  id: string;
  name: string;
  company_name: string | null;
  logo_url: string | null;
  contact_email: string | null;
  meta_ad_account_id: string | null;
  meta_pixel_id: string | null;
  meta_access_token: string;
  meta_access_token_set: boolean;
}

interface Props {
  clientId: string;
}

export default function ClientSettings({ clientId }: Props) {
  const { session } = useAuth();
  const token = session?.access_token ?? null;

  const [data, setData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [form, setForm] = useState<Partial<ClientData>>({});
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/meta/client-settings?client_id=${clientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json: { data?: ClientData }) => {
        if (json.data) {
          setData(json.data);
          setForm(json.data);
          if (json.data.logo_url) setLogoPreview(json.data.logo_url);
        }
      })
      .finally(() => setLoading(false));
  }, [token, clientId]);

  const set = (k: keyof ClientData, v: string) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setLogoPreview(url);
      set("logo_url", url);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch(`/api/meta/client-settings?client_id=${clientId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json() as { data?: { success: boolean }; error?: string };
      if (json.error) {
        setSaveMsg({ type: "err", text: json.error });
      } else {
        setSaveMsg({ type: "ok", text: "Saved successfully ✓" });
        setData((prev) => prev ? { ...prev, ...form } : prev);
      }
    } catch (e) {
      setSaveMsg({ type: "err", text: String(e) });
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
        <span className="ml-3 text-sm text-gray-500">Loading settings…</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Could not load client settings. Check your permissions.
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">

      {/* Save bar */}
      {saveMsg && (
        <div className={`rounded-xl px-4 py-3 text-sm font-medium ${
          saveMsg.type === "ok"
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {saveMsg.type === "ok" ? "✅" : "❌"} {saveMsg.text}
        </div>
      )}

      {/* ── Identity ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-5">🏢 Client Identity</h2>

        <div className="flex items-start gap-5 mb-5">
          {/* Logo */}
          <div className="flex-shrink-0">
            <div
              onClick={() => fileRef.current?.click()}
              className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors overflow-hidden bg-gray-50"
            >
              {logoPreview ? (
                <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <div className="text-2xl">{(form.name ?? data.name)?.[0]?.toUpperCase() ?? "?"}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">Upload</div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFile} />
            <p className="text-[10px] text-gray-400 text-center mt-1">Click to upload</p>
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Client Name</label>
              <input
                value={form.name ?? ""}
                onChange={(e) => set("name", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="ShiftArcadeMiami"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Company / Business Name</label>
              <input
                value={form.company_name ?? ""}
                onChange={(e) => set("company_name", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Shift Arcade Miami LLC"
              />
            </div>
          </div>
        </div>

        {/* Logo URL fallback */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Logo URL <span className="font-normal text-gray-400">(or upload above)</span></label>
          <input
            value={form.logo_url ?? ""}
            onChange={(e) => { set("logo_url", e.target.value); setLogoPreview(e.target.value || null); }}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900 font-mono"
            placeholder="https://…/logo.png"
          />
        </div>
      </div>

      {/* ── Contact ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-5">📬 Contact Information</h2>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Contact Email</label>
          <input
            type="email"
            value={form.contact_email ?? ""}
            onChange={(e) => set("contact_email", e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900"
            placeholder="owner@shiftarcade.miami"
          />
        </div>
      </div>

      {/* ── Meta Credentials ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-1">🔑 Meta Credentials</h2>
        <p className="text-xs text-gray-500 mb-5">These are stored securely in the database and used by all API calls for this client.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Meta Ad Account ID
              <span className="ml-1 font-normal text-gray-400">— from Business Manager (just the numbers)</span>
            </label>
            <input
              value={form.meta_ad_account_id ?? ""}
              onChange={(e) => set("meta_ad_account_id", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="1957083288453810"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">
              Meta Pixel ID
              <span className="ml-1 font-normal text-gray-400">— from Events Manager</span>
            </label>
            <input
              value={form.meta_pixel_id ?? ""}
              onChange={(e) => set("meta_pixel_id", e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              placeholder="1165380555705221"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-600">
                Meta Access Token
                <span className="ml-1 font-normal text-gray-400">— long-lived token from Graph API Explorer</span>
              </label>
              {data.meta_access_token_set && (
                <span className="text-xs text-green-600 font-medium">✅ Token is set</span>
              )}
            </div>
            <div className="relative">
              <input
                type={showToken ? "text" : "password"}
                value={form.meta_access_token ?? ""}
                onChange={(e) => set("meta_access_token", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 pr-20 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="Paste new token to replace…"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {showToken ? "Hide" : "Show"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Leave unchanged to keep the existing token. The displayed value is masked for security.</p>
          </div>
        </div>

        {/* Quick SQL note for missing columns */}
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-xs text-amber-700 font-semibold mb-1">⚠️ If saving fails with a column error, run this in Supabase SQL editor:</p>
          <code className="text-[10px] text-amber-800 font-mono block">
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;<br />
            ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_email TEXT;
          </code>
        </div>
      </div>

      {/* Save button */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">Changes apply to all Ads Manager functions for this client immediately after saving.</p>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-semibold rounded-xl transition-colors shadow"
        >
          {saving ? (
            <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Saving…</>
          ) : (
            <>💾 Save Changes</>
          )}
        </button>
      </div>
    </div>
  );
}
