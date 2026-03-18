"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdSet {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  daily_budget?: string;
  lifetime_budget?: string;
  optimization_goal: string;
  billing_event: string;
  bid_amount?: string;
  start_time?: string;
  end_time?: string;
  targeting?: {
    age_min?: number;
    age_max?: number;
    geo_locations?: { cities?: { name: string }[]; regions?: { name: string }[]; countries?: string[] };
    flexible_spec?: Array<{ interests?: { name: string }[] }>;
  };
  promoted_object?: { pixel_id?: string; custom_event_type?: string };
}

interface Ad {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  adset_id: string;
  creative?: { id: string };
}

interface Creative {
  id: string;
  name: string;
  body?: string;
  title?: string;
  image_url?: string;
  thumbnail_url?: string;
  object_type?: string;
  link_url?: string;
  call_to_action_type?: string;
  object_story_spec?: {
    link_data?: { message?: string; name?: string; link?: string; call_to_action?: { type?: string } };
    video_data?: { message?: string; title?: string; call_to_action?: { type?: string } };
  };
}

interface InsightRow {
  campaign_id: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  cpa: number;
  performance_score: number;
}

// ---------------------------------------------------------------------------
// Constants
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

const CTAS = ["BOOK_NOW", "LEARN_MORE", "SIGN_UP", "CONTACT_US", "GET_OFFER", "SHOP_NOW", "SUBSCRIBE", "GET_QUOTE", "WATCH_MORE"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmtBudget(daily?: string, lifetime?: string) {
  if (daily) return `$${(parseFloat(daily) / 100).toFixed(0)}/day`;
  if (lifetime) return `$${(parseFloat(lifetime) / 100).toFixed(0)} total`;
  return "—";
}

function fmt(n: number, dec = 0) {
  return n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function statusPill(s: string) {
  const base = "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border";
  if (s === "ACTIVE") return `${base} bg-green-50 text-green-700 border-green-200`;
  if (s === "PAUSED" || s === "CAMPAIGN_PAUSED") return `${base} bg-yellow-50 text-yellow-700 border-yellow-200`;
  return `${base} bg-gray-100 text-gray-500 border-gray-200`;
}

function extractCreativeText(c: Creative): { body: string; title: string; cta: string; link: string } {
  // Try object_story_spec first (most accurate for video/link ads)
  const link_data = c.object_story_spec?.link_data;
  const video_data = c.object_story_spec?.video_data;
  return {
    body: link_data?.message ?? video_data?.message ?? c.body ?? "",
    title: link_data?.name ?? video_data?.title ?? c.title ?? "",
    cta: link_data?.call_to_action?.type ?? video_data?.call_to_action?.type ?? c.call_to_action_type ?? "LEARN_MORE",
    link: link_data?.link ?? c.link_url ?? "",
  };
}

// ---------------------------------------------------------------------------
// Performance Projection (same as Draft Editor — industry benchmarks)
// ---------------------------------------------------------------------------

function PerformanceProjection({ budget, objective }: { budget: number; objective: string }) {
  const CPM: Record<string, number> = { OUTCOME_SALES: 12, OUTCOME_LEADS: 10, OUTCOME_TRAFFIC: 8, OUTCOME_AWARENESS: 6, OUTCOME_ENGAGEMENT: 7 };
  const CTR: Record<string, number> = { OUTCOME_SALES: 1.8, OUTCOME_LEADS: 1.5, OUTCOME_TRAFFIC: 2.2, OUTCOME_AWARENESS: 1.0, OUTCOME_ENGAGEMENT: 2.5 };
  const CVR: Record<string, number> = { OUTCOME_SALES: 3.5, OUTCOME_LEADS: 8.0, OUTCOME_TRAFFIC: 0, OUTCOME_AWARENESS: 0, OUTCOME_ENGAGEMENT: 0 };
  const cpm = CPM[objective] ?? 10;
  const ctr = CTR[objective] ?? 1.5;
  const cvr = CVR[objective] ?? 0;
  const monthly = budget * 30;
  const impressions = Math.round((monthly / cpm) * 1000);
  const clicks = Math.round(impressions * (ctr / 100));
  const conversions = Math.round(clicks * (cvr / 100));
  const cpa = conversions > 0 ? monthly / conversions : 0;
  const data = [
    { name: "Impr/k", value: Math.round(impressions / 1000), color: "#3b82f6" },
    { name: "Clicks", value: clicks, color: "#8b5cf6" },
    ...(conversions > 0 ? [{ name: "Conv", value: conversions, color: "#16a34a" }] : []),
  ];
  return (
    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-bold text-blue-900">📊 Projected Monthly Performance</h4>
        <span className="text-[10px] text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Industry benchmarks</span>
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
          <div className="text-lg font-black text-green-700">{conversions > 0 ? conversions : `${ctr}%`}</div>
          <div className="text-[10px] text-gray-500">{conversions > 0 ? `Conv (~$${cpa.toFixed(0)} CPA)` : "Est. CTR"}</div>
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ad Phone Preview
// ---------------------------------------------------------------------------

function AdPhonePreview({ body, title, cta, link, thumb }: { body: string; title: string; cta: string; link: string; thumb?: string }) {
  return (
    <div className="mx-auto w-52 rounded-2xl border border-gray-300 bg-white shadow-lg overflow-hidden">
      <div className="bg-gray-900 h-4 flex items-center justify-center">
        <div className="w-10 h-1 bg-gray-600 rounded-full" />
      </div>
      <div className="px-2.5 py-2 flex items-center gap-1.5 border-b border-gray-100">
        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex-shrink-0" />
        <div>
          <div className="text-[8px] font-bold text-gray-800">Karbon Agency</div>
          <div className="text-[7px] text-gray-400">Sponsored · 🌐</div>
        </div>
      </div>
      <div className="px-2.5 py-1.5">
        <p className="text-[8px] text-gray-800 line-clamp-3 leading-relaxed">{body || "Your ad body text here…"}</p>
      </div>
      <div className="relative h-24 bg-gradient-to-br from-gray-100 to-gray-200">
        {thumb ? (
          <Image src={thumb} alt="creative" fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}
      </div>
      <div className="px-2.5 py-1.5 border-t border-gray-100 flex items-center justify-between">
        <div className="text-[7px] text-gray-400 truncate">{link ? new URL(link.startsWith("http") ? link : `https://${link}`).hostname : "yoursite.com"}</div>
        <div className="text-[7px] font-bold text-white bg-blue-600 px-1.5 py-0.5 rounded">
          {cta.replace(/_/g, " ")}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Actual KPI row
// ---------------------------------------------------------------------------

function ActualKpis({ insight }: { insight: InsightRow | null }) {
  if (!insight || insight.spend === 0) {
    return (
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 text-center">
        <div className="text-sm text-gray-400">No performance data yet for this period.</div>
        <div className="text-xs text-gray-400 mt-1">Activate the campaign and check back after 24h.</div>
      </div>
    );
  }
  const kpis = [
    { label: "Spend", value: `$${fmt(insight.spend, 2)}`, good: true },
    { label: "Impressions", value: fmt(insight.impressions), good: true },
    { label: "Clicks", value: fmt(insight.clicks), good: true },
    { label: "CTR", value: `${fmt(insight.ctr, 2)}%`, good: insight.ctr >= 1 },
    { label: "CPC", value: `$${fmt(insight.cpc, 2)}`, good: insight.cpc < 1 },
    { label: "Conversions", value: fmt(insight.conversions), good: true },
    { label: "CPA", value: insight.cpa > 0 ? `$${fmt(insight.cpa, 2)}` : "—", good: insight.cpa < 10 || insight.cpa === 0 },
  ];
  return (
    <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
      {kpis.map((k) => (
        <div key={k.label} className={`rounded-xl px-2 py-2 text-center border ${k.good ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}>
          <div className="text-[10px] text-gray-400 mb-0.5">{k.label}</div>
          <div className="text-xs font-bold text-gray-900">{k.value}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

type Section = "campaign" | "creative" | "adsets" | "performance";

interface Props {
  token: string;
  clientId: string;
  campaignId: string;
  campaignName: string;
  campaignStatus: string;
  campaignObjective?: string;
  campaignBudgetDaily?: string;
  campaignBidStrategy?: string;
  onClose: () => void;
}

export default function CampaignDetailPanel({
  token,
  clientId,
  campaignId,
  campaignName,
  campaignStatus,
  campaignObjective = "OUTCOME_SALES",
  campaignBudgetDaily,
  campaignBidStrategy,
  onClose,
}: Props) {
  const [section, setSection] = useState<Section>("campaign");

  // Editable campaign fields
  const [name, setName] = useState(campaignName);
  const [objective, setObjective] = useState(campaignObjective || "OUTCOME_SALES");
  const [budgetDollars, setBudgetDollars] = useState(
    campaignBudgetDaily ? Math.round(parseFloat(campaignBudgetDaily) / 100) : 100
  );
  const [bidStrategy, setBidStrategy] = useState(campaignBidStrategy ?? "LOWEST_COST_WITHOUT_CAP");
  const [liveStatus, setLiveStatus] = useState(campaignStatus);

  // Date range for performance tab
  type DatePreset = "today" | "last_7d" | "last_30d" | "last_month" | "last_quarter" | "last_year";
  const DATE_PRESETS: { key: DatePreset; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "last_7d", label: "7d" },
    { key: "last_30d", label: "30d" },
    { key: "last_month", label: "Last Month" },
    { key: "last_quarter", label: "Quarter" },
    { key: "last_year", label: "12 Months" },
  ];
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30d");
  const [loadingInsight, setLoadingInsight] = useState(false);

  // Meta data
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [creatives, setCreatives] = useState<Record<string, Creative>>({});
  const [insight, setInsight] = useState<InsightRow | null>(null);
  const [loading, setLoading] = useState(true);

  // Creative editor state (for the first ad)
  const [editBody, setEditBody] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCta, setEditCta] = useState("LEARN_MORE");
  const [creativeThumb, setCreativeThumb] = useState<string | undefined>(undefined);
  const [creativeLink, setCreativeLink] = useState("");

  // AI rotation
  const [aiVariations, setAiVariations] = useState<Array<{ label: string; headline: string; primaryText: string }> | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Save states
  const [savingCampaign, setSavingCampaign] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!campaignId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/meta/adsets?client_id=${clientId}&campaign_id=${campaignId}`, { headers }),
      fetch(`/api/meta/insights?client_id=${clientId}&campaign_id=${campaignId}&date_preset=${datePreset}`, { headers }),
    ])
      .then(([r1, r2]) => Promise.all([r1.json(), r2.json()]))
      .then(async ([setsJson, insJson]: [{ data?: AdSet[] }, { data?: InsightRow[] }]) => {
        const sets = setsJson.data ?? [];
        setAdSets(sets);

        const rows = insJson.data ?? [];
        if (rows.length > 0) {
          const rolled = rows.reduce(
            (acc, r) => ({ ...acc, spend: acc.spend + r.spend, impressions: acc.impressions + r.impressions, clicks: acc.clicks + r.clicks, conversions: acc.conversions + r.conversions }),
            { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, campaign_id: campaignId, performance_score: 0 }
          );
          rolled.ctr = rolled.impressions > 0 ? (rolled.clicks / rolled.impressions) * 100 : 0;
          rolled.cpc = rolled.clicks > 0 ? rolled.spend / rolled.clicks : 0;
          rolled.cpa = rolled.conversions > 0 ? rolled.spend / rolled.conversions : 0;
          setInsight(rolled as InsightRow);
        }

        // Load ads (first 4 ad sets, limit 3 ads each for speed)
        const allAds: Ad[] = [];
        for (const adset of sets.slice(0, 4)) {
          const r = await fetch(`/api/meta/ads?client_id=${clientId}&adset_id=${adset.id}`, { headers });
          const j = await r.json() as { data?: Ad[] };
          allAds.push(...(j.data ?? []).slice(0, 3));
        }
        setAds(allAds);

        // Load creatives for first 6 ads
        const cmap: Record<string, Creative> = {};
        for (const ad of allAds.slice(0, 6)) {
          if (!ad.creative?.id) continue;
          const r = await fetch(`/api/meta/creatives?client_id=${clientId}&creative_id=${ad.creative.id}`, { headers });
          const j = await r.json() as { data?: Creative };
          if (j.data) cmap[ad.creative.id] = j.data;
        }
        setCreatives(cmap);

        // Pre-fill creative editor from first ad
        const firstAd = allAds[0];
        if (firstAd?.creative?.id && cmap[firstAd.creative.id]) {
          const c = cmap[firstAd.creative.id];
          const extracted = extractCreativeText(c);
          setEditBody(extracted.body);
          setEditTitle(extracted.title);
          setEditCta(extracted.cta);
          setCreativeLink(extracted.link);
          setCreativeThumb(c.thumbnail_url ?? c.image_url);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, clientId, token]);

  // ── Re-fetch insights when date range changes (after initial load) ─────────

  useEffect(() => {
    if (loading) return; // don't double-fetch on mount
    setLoadingInsight(true);
    setInsight(null);
    fetch(`/api/meta/insights?client_id=${clientId}&campaign_id=${campaignId}&date_preset=${datePreset}`, { headers })
      .then((r) => r.json())
      .then((insJson: { data?: InsightRow[] }) => {
        const rows = insJson.data ?? [];
        if (rows.length > 0) {
          const rolled = rows.reduce(
            (acc, r) => ({ ...acc, spend: acc.spend + r.spend, impressions: acc.impressions + r.impressions, clicks: acc.clicks + r.clicks, conversions: acc.conversions + r.conversions }),
            { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, campaign_id: campaignId, performance_score: 0 }
          );
          rolled.ctr = rolled.impressions > 0 ? (rolled.clicks / rolled.impressions) * 100 : 0;
          rolled.cpc = rolled.clicks > 0 ? rolled.spend / rolled.clicks : 0;
          rolled.cpa = rolled.conversions > 0 ? rolled.spend / rolled.conversions : 0;
          setInsight(rolled as InsightRow);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingInsight(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [datePreset]);

  // ── Save handlers ──────────────────────────────────────────────────────────

  async function handleSaveCampaign() {
    setSavingCampaign(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/meta/campaigns/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          client_id: clientId,
          campaign_id: campaignId,
          name,
          daily_budget: Math.round(budgetDollars * 100),
          bid_strategy: bidStrategy,
        }),
      });
      const json = await res.json() as { error?: string };
      if (json.error) setSaveMsg({ ok: false, text: json.error });
      else setSaveMsg({ ok: true, text: "Campaign settings saved ✓" });
    } catch {
      setSaveMsg({ ok: false, text: "Network error" });
    } finally {
      setSavingCampaign(false);
    }
  }

  async function handleToggleStatus() {
    const newStatus = liveStatus === "ACTIVE" ? "PAUSED" : "ACTIVE";
    setSavingStatus(true);
    try {
      const res = await fetch("/api/meta/campaigns/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ client_id: clientId, campaign_id: campaignId, status: newStatus }),
      });
      const json = await res.json() as { error?: string };
      if (!json.error) {
        setLiveStatus(newStatus);
        setSaveMsg({ ok: true, text: `Campaign ${newStatus === "ACTIVE" ? "activated 🚀" : "paused ⏸"}` });
      } else {
        setSaveMsg({ ok: false, text: json.error });
      }
    } catch {
      setSaveMsg({ ok: false, text: "Network error" });
    } finally {
      setSavingStatus(false);
    }
  }

  async function handleSaveCopy() {
    const firstAd = ads[0];
    if (!firstAd?.creative?.id) return;
    setSavingCampaign(true);
    try {
      await fetch("/api/meta/creatives/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ client_id: clientId, creative_id: firstAd.creative.id, body: editBody, title: editTitle }),
      });
      setSaveMsg({ ok: true, text: "Creative copy updated ✓" });
    } catch {
      setSaveMsg({ ok: false, text: "Network error" });
    } finally {
      setSavingCampaign(false);
    }
  }

  async function handleGetAiVariations() {
    setLoadingAi(true);
    setAiVariations(null);
    try {
      const res = await fetch("/api/meta/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          client_id: clientId,
          messages: [{
            role: "user",
            content: `Generate 3 different ad creative variations for this campaign:
Campaign: "${name}"
Objective: ${objective}
Budget: $${budgetDollars}/day
Current headline: "${editTitle}"
Current body text: "${editBody}"

Return EXACTLY this JSON (no extra text):
[
  {"label":"🔥 Urgency","headline":"<max 40 chars>","primaryText":"<max 125 chars>"},
  {"label":"💡 Curiosity","headline":"<max 40 chars>","primaryText":"<max 125 chars>"},
  {"label":"🏆 Social proof","headline":"<max 40 chars>","primaryText":"<max 125 chars>"}
]

Make them specific to Shift Arcade Miami (sim racing venue in Wynwood). Each should have a completely different angle.`,
          }],
        }),
      });
      const json = await res.json() as { reply?: string };
      const match = (json.reply ?? "").match(/\[[\s\S]*\]/);
      if (match) setAiVariations(JSON.parse(match[0]) as Array<{ label: string; headline: string; primaryText: string }>);
    } catch {
      // silently fail
    } finally {
      setLoadingAi(false);
    }
  }

  // ── Sections config ────────────────────────────────────────────────────────

  const SECTIONS: { id: Section; label: string }[] = [
    { id: "campaign", label: "📋 Campaign" },
    { id: "creative", label: "✍️ Creative" },
    { id: "adsets", label: "🎯 Ad Sets" },
    { id: "performance", label: "📊 Performance" },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="min-w-0 flex-1">
            <div className="text-[11px] text-gray-400">{OBJECTIVES.find((o) => o.value === objective)?.label} · {fmtBudget(String(budgetDollars * 100))}</div>
            <h2 className="text-sm font-bold text-gray-900 truncate">{name}</h2>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {/* Activate / Pause toggle */}
            <button
              onClick={handleToggleStatus}
              disabled={savingStatus}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl transition-colors disabled:opacity-50 shadow-sm ${
                liveStatus === "ACTIVE"
                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {savingStatus ? "…" : liveStatus === "ACTIVE" ? "⏸ Pause" : "🚀 Activate"}
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Save message */}
        {saveMsg && (
          <div className={`px-6 py-2 text-xs font-medium border-b ${saveMsg.ok ? "bg-green-50 text-green-800 border-green-100" : "bg-red-50 text-red-800 border-red-100"}`}>
            {saveMsg.text}
          </div>
        )}

        {/* ── Section tabs ── */}
        <div className="flex border-b border-gray-100 px-6 bg-white overflow-x-auto">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`py-2.5 px-3 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
                section === s.id ? "border-red-500 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}</div>
          ) : (
            <>
              {/* ── 📋 CAMPAIGN ── */}
              {section === "campaign" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Campaign Name</label>
                    <input value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Objective</label>
                      <select value={objective} onChange={(e) => setObjective(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                        {OBJECTIVES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Bid Strategy</label>
                      <select value={bidStrategy} onChange={(e) => setBidStrategy(e.target.value)}
                        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                        {BID_STRATEGIES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Daily Budget: <span className="text-red-600 font-bold">${budgetDollars}/day</span>
                    </label>
                    <input type="range" min={5} max={1000} step={5} value={budgetDollars}
                      onChange={(e) => setBudgetDollars(parseInt(e.target.value))}
                      className="w-full accent-red-600" />
                    <div className="flex justify-between text-xs text-gray-400 mt-0.5"><span>$5/day</span><span>$1,000/day</span></div>
                  </div>

                  <PerformanceProjection budget={budgetDollars} objective={objective} />

                  <button onClick={handleSaveCampaign} disabled={savingCampaign}
                    className="w-full py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                    {savingCampaign ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Saving…</> : "💾 Save Campaign Settings"}
                  </button>
                </div>
              )}

              {/* ── ✍️ CREATIVE ── */}
              {section === "creative" && (
                <div className="space-y-4">
                  {/* AI rotation */}
                  <div className="flex items-center justify-between bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                    <div>
                      <div className="text-xs font-bold text-purple-800">🔄 AI Creative Rotation</div>
                      <div className="text-xs text-purple-600 mt-0.5">Generate 3 angles — click any to apply</div>
                    </div>
                    <button onClick={handleGetAiVariations} disabled={loadingAi}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 shrink-0">
                      {loadingAi ? <><div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" /> Generating…</> : <>🔄 Generate</>}
                    </button>
                  </div>

                  {/* Variations picker */}
                  {aiVariations && (
                    <div className="space-y-2">
                      {aiVariations.map((v, i) => (
                        <button key={i} onClick={() => { setEditTitle(v.headline); setEditBody(v.primaryText); setAiVariations(null); }}
                          className="w-full text-left border border-purple-200 bg-white hover:bg-purple-50 rounded-xl px-4 py-3 transition-colors group">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-purple-700">{v.label}</span>
                            <span className="text-xs text-purple-400 group-hover:text-purple-600">Tap to apply →</span>
                          </div>
                          <div className="text-xs font-semibold text-gray-900">{v.headline}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-2">{v.primaryText}</div>
                        </button>
                      ))}
                      <button onClick={() => setAiVariations(null)} className="text-xs text-gray-400 hover:text-gray-600 w-full text-center py-1">✕ Dismiss</button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Edit fields */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Headline <span className="text-gray-400 font-normal">({editTitle.length}/40)</span></label>
                        <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} maxLength={40}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500" placeholder="Headline text" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Body Text <span className="text-gray-400 font-normal">({editBody.length}/125 recommended)</span></label>
                        <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={5}
                          className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Primary ad text" />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Call to Action</label>
                          <select value={editCta} onChange={(e) => setEditCta(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 bg-white">
                            {CTAS.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Destination URL</label>
                          <input value={creativeLink} onChange={(e) => setCreativeLink(e.target.value)}
                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500 font-mono text-xs" placeholder="https://…" />
                        </div>
                      </div>
                      <button onClick={handleSaveCopy} disabled={savingCampaign}
                        className="w-full py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                        {savingCampaign ? "Saving…" : "💾 Save Copy Changes"}
                      </button>
                    </div>

                    {/* Phone preview */}
                    <div>
                      <div className="text-xs font-semibold text-gray-500 mb-3">📱 Live Preview</div>
                      <AdPhonePreview body={editBody} title={editTitle} cta={editCta} link={creativeLink} thumb={creativeThumb} />
                      {ads.length > 1 && (
                        <div className="mt-3 text-xs text-gray-400">{ads.length} ads in this campaign</div>
                      )}
                    </div>
                  </div>

                  {/* Creative thumbnails strip */}
                  {ads.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 mb-2">All creatives</div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {ads.map((ad) => {
                          const c = ad.creative?.id ? creatives[ad.creative.id] : null;
                          const thumb = c?.thumbnail_url ?? c?.image_url;
                          return (
                            <button key={ad.id} onClick={() => {
                              if (c) {
                                const ex = extractCreativeText(c);
                                setEditBody(ex.body); setEditTitle(ex.title); setEditCta(ex.cta); setCreativeLink(ex.link);
                                setCreativeThumb(c.thumbnail_url ?? c.image_url);
                              }
                            }}
                              className="flex-shrink-0 w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-gray-100 hover:border-red-400 transition-colors">
                              {thumb ? <Image src={thumb} alt={ad.name} width={56} height={56} className="object-cover w-full h-full" unoptimized /> :
                                <div className="w-full h-full flex items-center justify-center text-gray-300 text-[8px] text-center px-1">{ad.name.slice(0, 12)}</div>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── 🎯 AD SETS ── */}
              {section === "adsets" && (
                <div className="space-y-3">
                  {adSets.length === 0 ? (
                    <div className="text-sm text-gray-400 text-center py-8">No ad sets found.</div>
                  ) : adSets.map((as) => {
                    const ageMin = as.targeting?.age_min;
                    const ageMax = as.targeting?.age_max;
                    const cities = as.targeting?.geo_locations?.cities?.map((c) => c.name).join(", ");
                    const interests = as.targeting?.flexible_spec?.[0]?.interests?.map((i) => i.name).join(", ");
                    const adSetAds = ads.filter((a) => a.adset_id === as.id);
                    return (
                      <div key={as.id} className="rounded-xl border border-gray-200 overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${as.effective_status === "ACTIVE" ? "bg-green-500" : "bg-yellow-400"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-gray-800 truncate">{as.name}</div>
                            <div className="text-[11px] text-gray-400">{fmtBudget(as.daily_budget, as.lifetime_budget)} · {as.optimization_goal.replace(/_/g, " ")} · {as.billing_event}</div>
                          </div>
                          <span className={statusPill(as.effective_status)}>{as.effective_status}</span>
                        </div>
                        <div className="px-4 py-3 grid grid-cols-2 gap-3 text-xs">
                          {(ageMin || ageMax) && (
                            <div><span className="text-gray-400">Age:</span> <span className="font-medium text-gray-700">{ageMin ?? "?"} – {ageMax ?? "?"}</span></div>
                          )}
                          {cities && (
                            <div className="col-span-2"><span className="text-gray-400">Locations:</span> <span className="font-medium text-gray-700">{cities}</span></div>
                          )}
                          {interests && (
                            <div className="col-span-2"><span className="text-gray-400">Interests:</span> <span className="font-medium text-gray-700">{interests}</span></div>
                          )}
                          {as.promoted_object?.pixel_id && (
                            <div className="col-span-2"><span className="text-gray-400">Pixel:</span> <span className="font-medium text-gray-700">{as.promoted_object.pixel_id} → {as.promoted_object.custom_event_type ?? "Standard"}</span></div>
                          )}
                          <div><span className="text-gray-400">Ads:</span> <span className="font-medium text-gray-700">{adSetAds.length}</span></div>
                          {as.start_time && (
                            <div><span className="text-gray-400">Started:</span> <span className="font-medium text-gray-700">{new Date(as.start_time).toLocaleDateString()}</span></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── 📊 PERFORMANCE ── */}
              {section === "performance" && (
                <div className="space-y-4">
                  {/* Date range pills */}
                  <div className="flex gap-1.5 flex-wrap">
                    {DATE_PRESETS.map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setDatePreset(p.key)}
                        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                          datePreset === p.key
                            ? "bg-red-600 text-white border-red-600"
                            : "bg-white text-gray-600 border-gray-200 hover:border-red-300 hover:text-red-600"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                      {DATE_PRESETS.find((p) => p.key === datePreset)?.label} — Actual
                    </div>
                    {loadingInsight ? (
                      <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
                        {[...Array(7)].map((_, i) => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
                      </div>
                    ) : (
                      <ActualKpis insight={insight} />
                    )}
                  </div>

                  {insight && insight.spend > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">AI Recommendations</div>
                      {[
                        insight.ctr < 0.5 && { icon: "🖼", title: "Low CTR", body: `CTR is ${fmt(insight.ctr, 2)}%. Refresh the creative or narrow the audience.`, priority: "high" },
                        insight.ctr >= 2 && { icon: "🚀", title: "Strong CTR — scale it", body: `CTR of ${fmt(insight.ctr, 2)}% is excellent. Increase budget by 20%.`, priority: "medium" },
                        insight.cpc > 2 && { icon: "💸", title: "High CPC", body: `$${fmt(insight.cpc, 2)} per click. Try broader audience or Lowest Cost bid strategy.`, priority: "high" },
                        insight.conversions === 0 && insight.spend > 50 && { icon: "🎯", title: "No conversions", body: "Check that your pixel is firing on the confirmation page.", priority: "high" },
                        insight.cpa > 50 && { icon: "📉", title: "High CPA", body: `$${fmt(insight.cpa, 2)} per conversion. Consider switching to Lead objective.`, priority: "medium" },
                      ].filter(Boolean).map((rec, i) => rec && (
                        <div key={i} className={`flex gap-3 rounded-xl px-4 py-3 border ${rec.priority === "high" ? "bg-red-50 border-red-100" : "bg-amber-50 border-amber-100"}`}>
                          <span className="text-base flex-shrink-0">{rec.icon}</span>
                          <div><div className="text-xs font-bold text-gray-900">{rec.title}</div><div className="text-xs text-gray-600 mt-0.5">{rec.body}</div></div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Projected at Current Budget</div>
                    <PerformanceProjection budget={budgetDollars} objective={objective} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
