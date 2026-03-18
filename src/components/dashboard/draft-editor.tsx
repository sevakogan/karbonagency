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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Locations</label>
                <input value={form.locations} onChange={(e) => set("locations", e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <p className="text-xs text-gray-400 mt-1">Geo radius is configured in the ad set targeting. Use the draft notes above to describe targeting intent.</p>
              </div>

              {/* Targeting summary from draft */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="text-xs font-bold text-blue-900 mb-2">🎯 Configured Targeting</div>
                <div className="text-xs text-blue-800 space-y-1">
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
