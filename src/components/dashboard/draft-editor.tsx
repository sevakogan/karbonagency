"use client";

import { useState, useRef } from "react";
import type { ShiftArcadeDraftCampaign } from "@/lib/meta-api-write";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EditableDraft {
  name: string;
  objective: string;
  daily_budget_dollars: number;
  bid_strategy: string;
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  linkUrl: string;
  ageMin: number;
  ageMax: number;
  locations: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const OBJECTIVES = [
  { value: "OUTCOME_SALES", label: "Conversions (Sales)" },
  { value: "OUTCOME_LEADS", label: "Lead Generation" },
  { value: "OUTCOME_TRAFFIC", label: "Traffic" },
  { value: "OUTCOME_AWARENESS", label: "Awareness / Reach" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement" },
];

const BID_STRATEGIES = [
  { value: "LOWEST_COST_WITHOUT_CAP", label: "Lowest Cost (No Cap)" },
  { value: "LOWEST_COST_WITH_BID_CAP", label: "Bid Cap" },
  { value: "COST_CAP", label: "Cost Cap" },
];

const CTAS = ["BOOK_NOW", "LEARN_MORE", "SIGN_UP", "CONTACT_US", "GET_OFFER", "SHOP_NOW", "SUBSCRIBE"];

// ---------------------------------------------------------------------------
// Media type guidance (Claude pre-computed recommendations per objective)
// ---------------------------------------------------------------------------

const MEDIA_GUIDANCE: Record<string, {
  recommended: string; ratio: string; duration: string; hook: string; tip: string;
}> = {
  OUTCOME_SALES: {
    recommended: "Short-form video (15–30s) or single image",
    ratio: "9:16 vertical for Reels/Stories, 1:1 for Feed",
    duration: "15–30 seconds max. First 3 seconds are critical.",
    hook: "Start with simulator in action — driver POV, G-force moment, or finishing lap. Skip intros.",
    tip: "Include price or 'Book Now' overlay. Show the physical venue + equipment quality.",
  },
  OUTCOME_LEADS: {
    recommended: "Carousel (3–5 slides) or lead-form video",
    ratio: "1:1 square for carousel, 9:16 for video",
    duration: "30–45 seconds for video, or carousel with 3–5 strong images",
    hook: "Lead with a question: 'Want to race F1 cars in Miami?' or 'Corporate events with a twist?'",
    tip: "Use real customer faces/reactions. Social proof converts leads better than product shots.",
  },
  OUTCOME_TRAFFIC: {
    recommended: "Single image with strong CTA or short video",
    ratio: "1.91:1 landscape for link ads in Feed",
    duration: "Keep video under 15 seconds — you're just driving clicks.",
    hook: "Show the experience outcome: friends laughing, podium celebrations, leaderboard.",
    tip: "Bright, high-contrast thumbnail. Text overlay with your URL + location.",
  },
  OUTCOME_AWARENESS: {
    recommended: "Video (30–60s) or high-quality photo",
    ratio: "16:9 for in-stream, 9:16 for Reels",
    duration: "Awareness allows longer videos. 30–60 seconds is sweet spot.",
    hook: "Cinematic brand video. Show Wynwood location, multiple sims, the atmosphere.",
    tip: "No hard sell needed. Focus on aspirational brand imagery and venue quality.",
  },
};

function getGuidance(objective: string) {
  return MEDIA_GUIDANCE[objective] ?? MEDIA_GUIDANCE.OUTCOME_SALES;
}

// ---------------------------------------------------------------------------
// Projected performance bars (illustrative — based on historical benchmarks)
// ---------------------------------------------------------------------------

function PerformanceProjection({ budget, objective }: { budget: number; objective: string }) {
  // Simple projection using industry benchmarks for sim racing / entertainment in Miami
  const CPM_EST: Record<string, number> = {
    OUTCOME_SALES: 12, OUTCOME_LEADS: 10, OUTCOME_TRAFFIC: 8, OUTCOME_AWARENESS: 6, OUTCOME_ENGAGEMENT: 7,
  };
  const CTR_EST: Record<string, number> = {
    OUTCOME_SALES: 1.8, OUTCOME_LEADS: 1.5, OUTCOME_TRAFFIC: 2.2, OUTCOME_AWARENESS: 1.0, OUTCOME_ENGAGEMENT: 2.5,
  };
  const CVR_EST: Record<string, number> = {
    OUTCOME_SALES: 3.5, OUTCOME_LEADS: 8.0, OUTCOME_TRAFFIC: 0, OUTCOME_AWARENESS: 0, OUTCOME_ENGAGEMENT: 0,
  };

  const cpm = CPM_EST[objective] ?? 10;
  const ctr = CTR_EST[objective] ?? 1.5;
  const cvr = CVR_EST[objective] ?? 2;

  const monthlyBudget = budget * 30;
  const impressions = Math.round((monthlyBudget / cpm) * 1000);
  const clicks = Math.round(impressions * (ctr / 100));
  const conversions = Math.round(clicks * (cvr / 100));
  const estimatedCPA = conversions > 0 ? (monthlyBudget / conversions) : 0;

  const data = [
    { name: "Impressions/k", value: Math.round(impressions / 1000), color: "#3b82f6" },
    { name: "Clicks", value: clicks, color: "#8b5cf6" },
    ...(conversions > 0 ? [{ name: "Conversions", value: conversions, color: "#16a34a" }] : []),
  ];

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-blue-900">📊 Projected Monthly Performance</h4>
        <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Est. based on industry benchmarks</span>
      </div>
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-white rounded-lg p-2 text-center">
          <div className="text-lg font-black text-blue-700">{(impressions / 1000).toFixed(0)}K</div>
          <div className="text-[10px] text-gray-500">Impressions/mo</div>
        </div>
        <div className="bg-white rounded-lg p-2 text-center">
          <div className="text-lg font-black text-purple-700">{clicks.toLocaleString()}</div>
          <div className="text-[10px] text-gray-500">Clicks/mo</div>
        </div>
        <div className="bg-white rounded-lg p-2 text-center">
          <div className="text-lg font-black text-green-700">
            {conversions > 0 ? conversions : ctr.toFixed(1) + "%"}
          </div>
          <div className="text-[10px] text-gray-500">{conversions > 0 ? `Conv (est. $${estimatedCPA.toFixed(0)} CPA)` : "Est. CTR"}</div>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <XAxis dataKey="name" tick={{ fontSize: 9 }} />
          <YAxis tick={{ fontSize: 9 }} />
          <Tooltip formatter={(v: number) => v.toLocaleString()} />
          <Bar dataKey="value" radius={[3, 3, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-blue-600 mt-1">Based on $50–100/day budgets in Miami DMA. Actual results vary.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Draft Editor
// ---------------------------------------------------------------------------

interface Props {
  draft: ShiftArcadeDraftCampaign;
  token: string;
  clientId: string;
  onClose: () => void;
  onLaunch?: (draftId: string) => void;
}

export default function DraftEditor({ draft, token, clientId, onClose, onLaunch }: Props) {
  const [form, setForm] = useState<EditableDraft>({
    name: draft.campaign.name,
    objective: draft.campaign.objective ?? "OUTCOME_SALES",
    daily_budget_dollars: (draft.campaign.daily_budget ?? 1000) / 100,
    bid_strategy: draft.campaign.bid_strategy ?? "LOWEST_COST_WITHOUT_CAP",
    headline: draft.creativeSpec.headline,
    primaryText: draft.creativeSpec.primaryText,
    description: draft.creativeSpec.description,
    callToAction: draft.creativeSpec.callToAction,
    linkUrl: draft.creativeSpec.linkUrl,
    ageMin: (draft.adSet.targeting as { age_min?: number })?.age_min ?? 21,
    ageMax: (draft.adSet.targeting as { age_max?: number })?.age_max ?? 45,
    locations: "South Florida — 15mi radius",
    notes: draft.notes,
  });

  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [aiRec, setAiRec] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [loadingRotate, setLoadingRotate] = useState(false);
  const [creativeVariations, setCreativeVariations] = useState<Array<{ headline: string; primaryText: string; label: string }> | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launchResult, setLaunchResult] = useState<{ success: boolean; message: string } | null>(null);
  const [activeSection, setActiveSection] = useState<"campaign" | "creative" | "targeting" | "media">("campaign");

  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof EditableDraft, v: string | number) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const handleMedia = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setMediaFile(f);
    setMediaPreview(URL.createObjectURL(f));
  };

  const getAiRecommendation = async () => {
    setLoadingAi(true);
    setAiRec(null);
    try {
      const res = await fetch("/api/meta/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          client_id: clientId,
          messages: [{
            role: "user",
            content: `I'm setting up a Meta ad campaign for Shift Arcade Miami (premium sim racing venue in Wynwood).
Campaign: "${form.name}"
Objective: ${form.objective}
Budget: $${form.daily_budget_dollars}/day
Headline: "${form.headline}"
Primary text: "${form.primaryText}"
Target audience: ${form.ageMin}–${form.ageMax} age, ${form.locations}
${mediaFile ? `Media: ${mediaFile.name} (${mediaFile.type})` : "No media uploaded yet"}

Please give me:
1. 🎬 Specific media recommendation (exact specs, concept, what to shoot)
2. ✏️ Improved headline (keep under 40 chars)
3. 📝 Improved primary text (keep under 125 chars)
4. ⚡ One key optimization tip for this objective
5. ⚠️ One thing to avoid

Be specific to sim racing / Wynwood / South Florida context.`,
          }],
        }),
      });
      const json = await res.json() as { reply?: string; error?: string };
      setAiRec(json.reply ?? json.error ?? "No response");
    } catch (e) {
      setAiRec("Could not reach AI assistant. Check ANTHROPIC_API_KEY in Vercel.");
    } finally {
      setLoadingAi(false);
    }
  };

  const getCreativeRotations = async () => {
    setLoadingRotate(true);
    setCreativeVariations(null);
    try {
      const res = await fetch("/api/meta/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          client_id: clientId,
          messages: [{
            role: "user",
            content: `Generate 3 different ad creative variations for Shift Arcade Miami (premium sim racing in Wynwood).
Campaign: "${form.name}" | Objective: ${form.objective} | Budget: $${form.daily_budget_dollars}/day

Current headline: "${form.headline}"
Current text: "${form.primaryText}"

Return EXACTLY this JSON format (no extra text, just JSON):
[
  {"label":"🔥 Urgency","headline":"<max 40 chars>","primaryText":"<max 125 chars>"},
  {"label":"💡 Curiosity","headline":"<max 40 chars>","primaryText":"<max 125 chars>"},
  {"label":"🏆 Social proof","headline":"<max 40 chars>","primaryText":"<max 125 chars>"}
]

Make them specific to sim racing / Wynwood / South Florida. Each should have a completely different angle.`,
          }],
        }),
      });
      const json = await res.json() as { reply?: string; data?: { message?: string }; error?: string };
      const raw = json.reply ?? json.data?.message ?? "";
      // Extract JSON array from response
      const match = raw.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]) as Array<{ headline: string; primaryText: string; label: string }>;
        setCreativeVariations(parsed);
      } else {
        setCreativeVariations([{ label: "AI", headline: "Could not parse", primaryText: raw.slice(0, 125) }]);
      }
    } catch (e) {
      setCreativeVariations([{ label: "Error", headline: "AI unavailable", primaryText: String(e) }]);
    } finally {
      setLoadingRotate(false);
    }
  };

  const handleLaunch = async () => {
    if (!confirm(`Launch "${form.name}" to Meta as PAUSED? You can activate it in the Campaigns tab.`)) return;
    setLaunching(true);
    try {
      const res = await fetch(`/api/meta/campaigns?client_id=${clientId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name,
          objective: form.objective,
          status: "PAUSED",
          daily_budget: Math.round(form.daily_budget_dollars * 100),
          bid_strategy: form.bid_strategy,
          special_ad_categories: ["NONE"],
        }),
      });
      const json = await res.json() as { data?: { id: string }; error?: string };
      if (json.error) {
        setLaunchResult({ success: false, message: json.error });
      } else {
        setLaunchResult({ success: true, message: `Campaign created (ID: ${json.data?.id}). It's PAUSED — activate it in the Campaigns tab when ready.` });
        onLaunch?.(draft.id);
      }
    } catch (e) {
      setLaunchResult({ success: false, message: String(e) });
    } finally {
      setLaunching(false);
    }
  };

  const guidance = getGuidance(form.objective);
  const sections = [
    { id: "campaign" as const, label: "📋 Campaign" },
    { id: "creative" as const, label: "✍️ Creative" },
    { id: "targeting" as const, label: "🎯 Targeting" },
    { id: "media" as const, label: "🖼️ Media + AI" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <div className="text-xs text-gray-400">Edit Draft</div>
            <h2 className="text-sm font-bold text-gray-900 truncate max-w-sm">{draft.name}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLaunch}
              disabled={launching}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow disabled:opacity-50"
            >
              {launching ? "Launching…" : "🚀 Push to Meta (Paused)"}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Launch result */}
        {launchResult && (
          <div className={`px-6 py-3 text-sm ${launchResult.success ? "bg-green-50 text-green-800 border-b border-green-100" : "bg-red-50 text-red-800 border-b border-red-100"}`}>
            {launchResult.success ? "✅" : "❌"} {launchResult.message}
          </div>
        )}

        {/* Section tabs */}
        <div className="flex border-b border-gray-100 px-6 bg-white">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
                activeSection === s.id
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

          {/* CAMPAIGN section */}
          {activeSection === "campaign" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Campaign Name</label>
                <input
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Objective</label>
                  <select
                    value={form.objective}
                    onChange={(e) => set("objective", e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    {OBJECTIVES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Bid Strategy</label>
                  <select
                    value={form.bid_strategy}
                    onChange={(e) => set("bid_strategy", e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    {BID_STRATEGIES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Daily Budget: <span className="text-red-600 font-bold">${form.daily_budget_dollars}/day</span>
                </label>
                <input
                  type="range" min={5} max={500} step={5}
                  value={form.daily_budget_dollars}
                  onChange={(e) => set("daily_budget_dollars", parseInt(e.target.value))}
                  className="w-full accent-red-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>$5/day</span><span>$500/day</span>
                </div>
              </div>

              <PerformanceProjection budget={form.daily_budget_dollars} objective={form.objective} />

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={3}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* CREATIVE section */}
          {activeSection === "creative" && (
            <div className="space-y-4">
              {/* AI Rotate button */}
              <div className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                <div>
                  <div className="text-xs font-bold text-purple-800">🔄 AI Creative Rotation</div>
                  <div className="text-xs text-purple-600 mt-0.5">Generate 3 different angles — click any to apply it</div>
                </div>
                <button
                  onClick={getCreativeRotations}
                  disabled={loadingRotate}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 shrink-0"
                >
                  {loadingRotate ? (
                    <><div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> Generating…</>
                  ) : (
                    <>🔄 Generate Variations</>
                  )}
                </button>
              </div>

              {/* Variations picker */}
              {creativeVariations && (
                <div className="space-y-2">
                  {creativeVariations.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => { set("headline", v.headline); set("primaryText", v.primaryText); setCreativeVariations(null); }}
                      className="w-full text-left border border-purple-200 bg-white hover:bg-purple-50 rounded-xl px-4 py-3 transition-colors group"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-purple-700">{v.label}</span>
                        <span className="text-xs text-purple-400 group-hover:text-purple-600">Tap to apply →</span>
                      </div>
                      <div className="text-xs font-semibold text-gray-900">{v.headline}</div>
                      <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{v.primaryText}</div>
                    </button>
                  ))}
                  <button onClick={() => setCreativeVariations(null)} className="text-xs text-gray-400 hover:text-gray-600 w-full text-center py-1">✕ Dismiss</button>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Headline <span className="text-gray-400 font-normal">({form.headline.length}/40 chars)</span>
                </label>
                <input
                  value={form.headline}
                  onChange={(e) => set("headline", e.target.value)}
                  maxLength={40}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Primary Text <span className="text-gray-400 font-normal">({form.primaryText.length}/125 chars recommended)</span>
                </label>
                <textarea
                  value={form.primaryText}
                  onChange={(e) => set("primaryText", e.target.value)}
                  rows={4}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                  <input
                    value={form.description}
                    onChange={(e) => set("description", e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Call to Action</label>
                  <select
                    value={form.callToAction}
                    onChange={(e) => set("callToAction", e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                  >
                    {CTAS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Destination URL</label>
                <input
                  value={form.linkUrl}
                  onChange={(e) => set("linkUrl", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono"
                />
              </div>

              {/* Ad preview */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="text-xs font-semibold text-gray-500 mb-2">📱 Ad Preview (Feed)</div>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-xs">
                  {mediaPreview ? (
                    <img src={mediaPreview} alt="preview" className="w-full h-40 object-cover" />
                  ) : (
                    <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-xs">
                      Upload media to preview
                    </div>
                  )}
                  <div className="px-3 py-2">
                    <div className="text-[10px] text-gray-400 truncate">{form.linkUrl}</div>
                    <div className="text-sm font-bold text-gray-900 truncate mt-0.5">{form.headline}</div>
                    <div className="text-xs text-gray-500 truncate">{form.description}</div>
                  </div>
                  <div className="px-3 pb-3">
                    <span className="inline-block bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-1 rounded-md">
                      {form.callToAction.replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TARGETING section */}
          {activeSection === "targeting" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Min Age</label>
                  <input type="number" min={18} max={65} value={form.ageMin}
                    onChange={(e) => set("ageMin", parseInt(e.target.value))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Max Age</label>
                  <input type="number" min={18} max={65} value={form.ageMax}
                    onChange={(e) => set("ageMax", parseInt(e.target.value))}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Locations / Geo Notes</label>
                <input value={form.locations} onChange={(e) => set("locations", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* South Florida targeting map */}
              <div className="rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600">🗺️ Targeting Map — South Florida</div>
                <svg viewBox="0 0 340 280" className="w-full bg-gradient-to-b from-sky-50 to-emerald-50">
                  {/* Grid */}
                  {[40,80,120,160,200,240].map(v => (
                    <line key={`h${v}`} x1="0" y1={v} x2="340" y2={v} stroke="#e2e8f0" strokeWidth="0.5"/>
                  ))}
                  {[40,80,120,160,200,240,280,320].map(v => (
                    <line key={`v${v}`} x1={v} y1="0" x2={v} y2="280" stroke="#e2e8f0" strokeWidth="0.5"/>
                  ))}

                  {/* Atlantic Ocean */}
                  <rect x="255" y="0" width="85" height="280" fill="#bfdbfe" opacity="0.5"/>
                  <text x="275" y="140" fontSize="9" fill="#93c5fd" transform="rotate(90,275,140)" textAnchor="middle">ATLANTIC OCEAN</text>

                  {/* Florida coastline (simplified) */}
                  <polyline points="255,20 250,60 248,100 244,140 240,180 238,220 235,260" fill="none" stroke="#94a3b8" strokeWidth="1.5"/>

                  {/* Everglades */}
                  <ellipse cx="100" cy="220" rx="90" ry="40" fill="#bbf7d0" opacity="0.4"/>
                  <text x="100" y="223" fontSize="8" fill="#6ee7b7" textAnchor="middle">EVERGLADES</text>

                  {/* I-95 highway */}
                  <polyline points="220,20 218,80 215,140 212,200 210,260" fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6,3"/>
                  <text x="224" y="140" fontSize="7" fill="#d97706">I-95</text>

                  {/* West Palm Beach */}
                  <circle cx="230" cy="45" r="5" fill="#6366f1" opacity="0.7"/>
                  <text x="170" y="49" fontSize="9" fill="#4f46e5" fontWeight="600">West Palm Beach</text>

                  {/* Fort Lauderdale */}
                  <circle cx="228" cy="115" r="5" fill="#6366f1" opacity="0.7"/>
                  <text x="165" y="119" fontSize="9" fill="#4f46e5" fontWeight="600">Fort Lauderdale</text>

                  {/* Wynwood star — home base */}
                  <circle cx="220" cy="175" r="9" fill="#ef4444" opacity="0.2"/>
                  <circle cx="220" cy="175" r="6" fill="#ef4444"/>
                  <text x="220" y="171" fontSize="10" textAnchor="middle" fill="white" fontWeight="bold">★</text>
                  <text x="155" y="179" fontSize="9" fill="#dc2626" fontWeight="700">WYNWOOD</text>
                  <text x="155" y="190" fontSize="7" fill="#ef4444">(Shift Arcade)</text>

                  {/* Miami */}
                  <circle cx="222" cy="210" r="4" fill="#6366f1" opacity="0.7"/>
                  <text x="165" y="214" fontSize="9" fill="#4f46e5" fontWeight="600">Miami</text>

                  {/* Miami Beach */}
                  <circle cx="244" cy="195" r="3" fill="#8b5cf6" opacity="0.8"/>
                  <text x="248" y="199" fontSize="7" fill="#7c3aed">Miami Beach</text>

                  {/* 15-mile radius ring */}
                  <circle cx="220" cy="175" r="52" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5,3" opacity="0.6"/>
                  <text x="275" y="133" fontSize="7" fill="#ef4444" opacity="0.8">15mi</text>

                  {/* 30-mile radius ring */}
                  <circle cx="220" cy="175" r="95" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="4,5" opacity="0.35"/>
                  <text x="316" y="90" fontSize="7" fill="#f97316" opacity="0.6">30mi</text>

                  {/* Legend */}
                  <rect x="8" y="8" width="130" height="62" rx="6" fill="white" opacity="0.85"/>
                  <circle cx="18" cy="22" r="5" fill="#ef4444"/>
                  <text x="28" y="26" fontSize="8" fill="#374151">Venue (Wynwood)</text>
                  <circle cx="18" cy="37" r="3" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3,2"/>
                  <text x="28" y="41" fontSize="8" fill="#374151">15mi radius</text>
                  <circle cx="18" cy="52" r="3" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="2,3"/>
                  <text x="28" y="56" fontSize="8" fill="#374151">30mi radius</text>
                  <line x1="10" y1="63" x2="25" y2="63" stroke="#fbbf24" strokeWidth="2" strokeDasharray="4,2"/>
                  <text x="28" y="67" fontSize="8" fill="#374151">I-95 corridor</text>
                </svg>
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
                  <div className="text-xs text-gray-500">Red dot = Shift Arcade Wynwood. Inner ring = 15mi primary target. Outer ring = 30mi extended reach.</div>
                </div>
              </div>

              {/* Targeting summary from draft */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="text-xs font-bold text-blue-900 mb-2">🎯 Configured Targeting</div>
                <div className="text-xs text-blue-800 space-y-1">
                  <div><span className="font-medium">Age Range:</span> {form.ageMin}–{form.ageMax}</div>
                  <div><span className="font-medium">Interests:</span> Formula One, Racing Games, eSports, Nightlife, Date Night</div>
                  <div><span className="font-medium">Platforms:</span> Facebook + Instagram (Feed, Stories, Reels)</div>
                  <div><span className="font-medium">Attribution:</span> 7-day click, 1-day view</div>
                  <div><span className="font-medium">Bid:</span> {form.bid_strategy.replace(/_/g, " ").toLowerCase()}</div>
                </div>
              </div>
            </div>
          )}

          {/* MEDIA + AI section */}
          {activeSection === "media" && (
            <div className="space-y-4">
              {/* Media guidance */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <div className="text-xs font-bold text-purple-900 mb-2">🎬 Recommended Media for {form.objective.replace("OUTCOME_", "")}</div>
                <div className="text-xs text-purple-800 space-y-1.5">
                  <div><span className="font-medium">Format:</span> {guidance.recommended}</div>
                  <div><span className="font-medium">Ratio:</span> {guidance.ratio}</div>
                  <div><span className="font-medium">Duration:</span> {guidance.duration}</div>
                  <div><span className="font-medium">Hook:</span> {guidance.hook}</div>
                  <div><span className="font-medium">💡 Tip:</span> {guidance.tip}</div>
                </div>
              </div>

              {/* Upload */}
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-red-300 hover:bg-red-50/30 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                {mediaPreview ? (
                  <div>
                    <img src={mediaPreview} alt="preview" className="max-h-48 mx-auto rounded-xl mb-2 object-contain" />
                    <p className="text-xs text-gray-500">{mediaFile?.name} — <span className="text-red-600 underline">Change</span></p>
                  </div>
                ) : (
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Upload Creative</p>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, MP4 — 9:16 or 1:1 recommended</p>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleMedia} />
              </div>

              {/* Claude AI recommendation */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-gray-700">🤖 Claude AI Creative Advisor</div>
                  <button
                    onClick={getAiRecommendation}
                    disabled={loadingAi}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
                  >
                    {loadingAi ? (
                      <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Analyzing…</>
                    ) : (
                      "✨ Get Recommendations"
                    )}
                  </button>
                </div>
                {aiRec ? (
                  <div className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{aiRec}</div>
                ) : (
                  <p className="text-xs text-gray-400">Click "Get Recommendations" to have Claude analyze your campaign setup and suggest the best creative approach, copy improvements, and optimization tips.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
