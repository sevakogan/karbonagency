"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Campaign {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  bid_strategy?: string;
  special_ad_categories?: string[];
  start_time?: string;
  stop_time?: string;
}

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
  targeting?: Record<string, unknown>;
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
}

interface InsightRow {
  campaign_id: string;
  adset_id?: string;
  adset_name?: string;
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
// Helpers
// ---------------------------------------------------------------------------

function statusPill(s: string) {
  const base = "inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border";
  if (s === "ACTIVE") return `${base} bg-green-50 text-green-700 border-green-200`;
  if (s === "PAUSED") return `${base} bg-yellow-50 text-yellow-700 border-yellow-200`;
  return `${base} bg-gray-100 text-gray-500 border-gray-200`;
}

function fmtBudget(daily?: string, lifetime?: string): string {
  if (daily) return `$${(parseFloat(daily) / 100).toFixed(2)}/day`;
  if (lifetime) return `$${(parseFloat(lifetime) / 100).toFixed(2)} total`;
  return "—";
}

function fmt(n: number, dec = 0) {
  return n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

function objectiveLabel(o: string) {
  const map: Record<string, string> = {
    OUTCOME_LEADS: "Leads",
    OUTCOME_SALES: "Sales",
    OUTCOME_AWARENESS: "Awareness",
    OUTCOME_TRAFFIC: "Traffic",
    OUTCOME_ENGAGEMENT: "Engagement",
    OUTCOME_APP_PROMOTION: "App Installs",
  };
  return map[o] ?? o;
}

function bidStrategyLabel(b?: string) {
  if (!b) return "Lowest Cost";
  const map: Record<string, string> = {
    LOWEST_COST_WITHOUT_CAP: "Lowest Cost",
    LOWEST_COST_WITH_BID_CAP: "Bid Cap",
    COST_CAP: "Cost Cap",
    LOWEST_COST_WITH_MIN_ROAS: "Min ROAS",
  };
  return map[b] ?? b;
}

// ---------------------------------------------------------------------------
// Recommendation engine
// ---------------------------------------------------------------------------

interface Recommendation {
  icon: string;
  title: string;
  body: string;
  priority: "high" | "medium" | "low";
}

function buildRecommendations(insight: InsightRow | null, campaign: Campaign): Recommendation[] {
  const recs: Recommendation[] = [];
  if (!insight) {
    recs.push({ icon: "📊", title: "No performance data yet", body: "Run the campaign for at least 3 days before optimizing. Meta needs time to exit the learning phase.", priority: "low" });
    return recs;
  }

  if (insight.spend === 0) {
    recs.push({ icon: "⚡", title: "Campaign not spending", body: campaign.status === "PAUSED" ? "Campaign is paused. Activate it to start delivery." : "Check your ad account payment method and audience size.", priority: "high" });
  }

  if (insight.ctr > 0 && insight.ctr < 0.5) {
    recs.push({ icon: "🖼", title: "Low click-through rate", body: `CTR is ${fmt(insight.ctr, 2)}% — below the 1% benchmark. Refresh the creative or tighten the audience targeting.`, priority: "high" });
  } else if (insight.ctr >= 2) {
    recs.push({ icon: "🚀", title: "Strong CTR — consider scaling", body: `CTR of ${fmt(insight.ctr, 2)}% is excellent. Consider increasing the daily budget by 20% to scale.`, priority: "medium" });
  }

  if (insight.cpc > 2.5) {
    recs.push({ icon: "💸", title: "High cost per click", body: `CPC is $${fmt(insight.cpc, 2)}. Try switching bid strategy to Lowest Cost or broadening the audience.`, priority: "high" });
  } else if (insight.cpc > 0 && insight.cpc < 0.5) {
    recs.push({ icon: "✅", title: "Efficient CPC", body: `CPC of $${fmt(insight.cpc, 2)} is well below benchmark. This ad set is performing efficiently.`, priority: "low" });
  }

  if (insight.conversions === 0 && insight.spend > 50) {
    recs.push({ icon: "🎯", title: "No conversions yet", body: "Check that your pixel is firing on the thank-you or confirmation page. Verify conversion event in Events Manager.", priority: "high" });
  } else if (insight.cpa > 50) {
    recs.push({ icon: "📉", title: "High cost per conversion", body: `CPA of $${fmt(insight.cpa, 2)} is high. Consider narrowing the audience or switching to a Leads objective.`, priority: "medium" });
  }

  if (insight.impressions > 10000 && insight.ctr < 1) {
    recs.push({ icon: "🔄", title: "Audience may have ad fatigue", body: "High impressions with low CTR suggests the audience has seen this ad many times. Rotate creative or expand the audience.", priority: "medium" });
  }

  if (recs.length === 0) {
    recs.push({ icon: "👍", title: "Campaign looks healthy", body: "Performance is within normal benchmarks. Continue monitoring and refresh creative every 2–3 weeks.", priority: "low" });
  }

  return recs;
}

// ---------------------------------------------------------------------------
// KPI Cards
// ---------------------------------------------------------------------------

function KpiRow({ insight }: { insight: InsightRow | null }) {
  const kpis = [
    { label: "Spend", value: insight ? `$${fmt(insight.spend, 2)}` : "—" },
    { label: "Impressions", value: insight ? fmt(insight.impressions) : "—" },
    { label: "Clicks", value: insight ? fmt(insight.clicks) : "—" },
    { label: "CTR", value: insight ? `${fmt(insight.ctr, 2)}%` : "—" },
    { label: "CPC", value: insight ? `$${fmt(insight.cpc, 2)}` : "—" },
    { label: "Conversions", value: insight ? fmt(insight.conversions) : "—" },
    { label: "CPA", value: insight && insight.cpa > 0 ? `$${fmt(insight.cpa, 2)}` : "—" },
  ];
  return (
    <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
      {kpis.map((k) => (
        <div key={k.label} className="bg-gray-50 rounded-xl px-3 py-2 text-center border border-gray-100">
          <div className="text-[11px] text-gray-400 mb-0.5">{k.label}</div>
          <div className="text-sm font-bold text-gray-900">{k.value}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ad Preview Card (phone mockup)
// ---------------------------------------------------------------------------

function AdPreviewCard({ creative, ad }: { creative: Creative | null; ad: Ad }) {
  const thumb = creative?.thumbnail_url ?? creative?.image_url;
  const body = creative?.body ?? "Ad copy not loaded";
  const title = creative?.title ?? ad.name;
  const cta = creative?.call_to_action_type ?? "LEARN_MORE";

  return (
    <div className="mx-auto w-56 rounded-2xl border border-gray-300 bg-white shadow-lg overflow-hidden">
      {/* Phone status bar */}
      <div className="bg-gray-900 h-5 flex items-center justify-center">
        <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
      </div>
      {/* Facebook-style header */}
      <div className="px-2.5 py-2 flex items-center gap-2 border-b border-gray-100">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-bold text-gray-800 truncate">Karbon Agency</div>
          <div className="text-[8px] text-gray-400">Sponsored · <svg className="w-2 h-2 inline" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/></svg></div>
        </div>
      </div>
      {/* Copy */}
      <div className="px-2.5 pt-1.5 pb-1">
        <p className="text-[9px] text-gray-800 line-clamp-3 leading-relaxed">{body}</p>
      </div>
      {/* Image */}
      <div className="relative h-28 bg-gradient-to-br from-gray-100 to-gray-200">
        {thumb ? (
          <Image src={thumb} alt={title} fill className="object-cover" unoptimized />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-300">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}
      </div>
      {/* CTA */}
      <div className="px-2.5 py-2 border-t border-gray-100 flex items-center justify-between">
        <div className="text-[9px] text-gray-500 truncate">{creative?.link_url ? new URL(creative.link_url).hostname : "yoursite.com"}</div>
        <button className="bg-blue-600 text-white text-[8px] font-bold px-2 py-0.5 rounded">
          {cta.replace(/_/g, " ")}
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Copy Editor
// ---------------------------------------------------------------------------

function CopyEditor({
  creative,
  onSave,
  saving,
}: {
  creative: Creative | null;
  onSave: (body: string, title: string) => void;
  saving: boolean;
}) {
  const [body, setBody] = useState(creative?.body ?? "");
  const [title, setTitle] = useState(creative?.title ?? "");
  const changed = body !== (creative?.body ?? "") || title !== (creative?.title ?? "");

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Headline</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={255}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
          placeholder="Headline text"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1">Body copy</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
          maxLength={2000}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          placeholder="Ad body text"
        />
        <div className="text-right text-[10px] text-gray-400 mt-0.5">{body.length}/2000</div>
      </div>
      {changed && (
        <button
          onClick={() => onSave(body, title)}
          disabled={saving}
          className="w-full py-2 bg-red-600 text-white text-sm font-semibold rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Saving…</>
          ) : "Save copy changes →"}
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings Editor
// ---------------------------------------------------------------------------

function SettingsEditor({
  campaign,
  adSets,
  token,
  clientId,
  onUpdated,
}: {
  campaign: Campaign;
  adSets: AdSet[];
  token: string;
  clientId: string;
  onUpdated: () => void;
}) {
  const [dailyBudget, setDailyBudget] = useState(
    campaign.daily_budget ? String(parseFloat(campaign.daily_budget) / 100) : ""
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSaveBudget() {
    setSaving(true);
    try {
      const res = await fetch("/api/meta/campaigns/update", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client_id: clientId,
          campaign_id: campaign.id,
          daily_budget: Math.round(parseFloat(dailyBudget) * 100),
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        onUpdated();
      }
    } finally {
      setSaving(false);
    }
  }

  const firstAdSet = adSets[0];

  return (
    <div className="space-y-4">
      {/* Budget */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Daily Budget</div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
            <input
              type="number"
              step="1"
              min="1"
              value={dailyBudget}
              onChange={(e) => setDailyBudget(e.target.value)}
              className="w-full pl-7 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            onClick={handleSaveBudget}
            disabled={saving || !dailyBudget}
            className={`px-4 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 ${
              saved ? "bg-green-600 text-white" : "bg-red-600 text-white hover:bg-red-700"
            }`}
          >
            {saved ? "✓ Saved" : saving ? "Saving…" : "Update"}
          </button>
        </div>
      </div>

      {/* Bid strategy + objective */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Bid Strategy</div>
          <div className="text-sm font-bold text-gray-900">{bidStrategyLabel(campaign.bid_strategy)}</div>
          <div className="text-[11px] text-gray-400 mt-1">
            {campaign.bid_strategy === "LOWEST_COST_WITH_BID_CAP" && "Meta won't bid above your cap"}
            {campaign.bid_strategy === "COST_CAP" && "Average cost stays near your cap"}
            {(!campaign.bid_strategy || campaign.bid_strategy === "LOWEST_COST_WITHOUT_CAP") && "Meta optimises for best results"}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Objective</div>
          <div className="text-sm font-bold text-gray-900">{objectiveLabel(campaign.objective)}</div>
          {firstAdSet && (
            <div className="text-[11px] text-gray-400 mt-1">Optimising for: {firstAdSet.optimization_goal.replace(/_/g, " ")}</div>
          )}
        </div>
      </div>

      {/* Conversion tracking */}
      {firstAdSet?.promoted_object && (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2">Conversion Tracking</div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="text-xs font-semibold text-gray-800">
                Event: {firstAdSet.promoted_object.custom_event_type?.replace(/_/g, " ") ?? "Standard"}
              </div>
              {firstAdSet.promoted_object.pixel_id && (
                <div className="text-[11px] text-gray-500">Pixel ID: {firstAdSet.promoted_object.pixel_id}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ad Set budgets */}
      {adSets.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ad Sets ({adSets.length})</div>
          </div>
          <div className="divide-y divide-gray-100">
            {adSets.map((as) => (
              <div key={as.id} className="flex items-center gap-3 px-4 py-3">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${as.effective_status === "ACTIVE" ? "bg-green-500" : "bg-yellow-400"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 truncate">{as.name}</div>
                  <div className="text-[11px] text-gray-400">{fmtBudget(as.daily_budget, as.lifetime_budget)} · {as.billing_event}</div>
                </div>
                <span className={statusPill(as.effective_status)}>{as.effective_status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

type PanelTab = "overview" | "creative" | "settings";

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
  campaignObjective = "",
  campaignBudgetDaily,
  campaignBidStrategy,
  onClose,
}: Props) {
  const [tab, setTab] = useState<PanelTab>("overview");
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [creatives, setCreatives] = useState<Record<string, Creative>>({});
  const [insights, setInsights] = useState<InsightRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingCopy, setSavingCopy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const campaign: Campaign = {
    id: campaignId,
    name: campaignName,
    status: campaignStatus,
    effective_status: campaignStatus,
    objective: campaignObjective,
    daily_budget: campaignBudgetDaily,
    bid_strategy: campaignBidStrategy,
  };

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!campaignId) return;
    setLoading(true);

    Promise.all([
      fetch(`/api/meta/adsets?client_id=${clientId}&campaign_id=${campaignId}`, { headers }),
      fetch(`/api/meta/insights?client_id=${clientId}&campaign_id=${campaignId}&date_preset=last_30d`, { headers }),
    ])
      .then(([r1, r2]) => Promise.all([r1.json(), r2.json()]))
      .then(async ([setsJson, insJson]: [{ data?: AdSet[] }, { data?: InsightRow[] }]) => {
        const sets = setsJson.data ?? [];
        setAdSets(sets);

        // Roll up insights to campaign level
        const rows = insJson.data ?? [];
        if (rows.length > 0) {
          const rolled = rows.reduce(
            (acc, r) => ({
              ...acc,
              spend: acc.spend + r.spend,
              impressions: acc.impressions + r.impressions,
              clicks: acc.clicks + r.clicks,
              conversions: acc.conversions + r.conversions,
            }),
            { spend: 0, impressions: 0, clicks: 0, conversions: 0, ctr: 0, cpc: 0, cpa: 0, campaign_id: campaignId, performance_score: 0 }
          );
          rolled.ctr = rolled.impressions > 0 ? (rolled.clicks / rolled.impressions) * 100 : 0;
          rolled.cpc = rolled.clicks > 0 ? rolled.spend / rolled.clicks : 0;
          rolled.cpa = rolled.conversions > 0 ? rolled.spend / rolled.conversions : 0;
          setInsights(rolled as InsightRow);
        }

        // Fetch all ads for all ad sets
        const allAds: Ad[] = [];
        for (const adset of sets.slice(0, 3)) { // limit to first 3 ad sets
          const r = await fetch(`/api/meta/ads?client_id=${clientId}&adset_id=${adset.id}`, { headers });
          const j = await r.json() as { data?: Ad[] };
          allAds.push(...(j.data ?? []));
        }
        setAds(allAds);

        // Fetch creatives for first ad per ad set (preview)
        const creativeMap: Record<string, Creative> = {};
        for (const ad of allAds.slice(0, 6)) {
          if (!ad.creative?.id) continue;
          const r = await fetch(`/api/meta/creatives?client_id=${clientId}&creative_id=${ad.creative.id}`, { headers });
          const j = await r.json() as { data?: Creative };
          if (j.data) creativeMap[ad.creative.id] = j.data;
        }
        setCreatives(creativeMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, clientId, token, refreshKey]);

  // Get first creative for preview/editor
  const firstAd = ads[0] ?? null;
  const firstCreative = firstAd?.creative?.id ? creatives[firstAd.creative.id] ?? null : null;

  const recommendations = buildRecommendations(insights, campaign);

  async function handleSaveCopy(body: string, title: string) {
    if (!firstAd?.creative?.id) return;
    setSavingCopy(true);
    try {
      await fetch("/api/meta/creatives/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          client_id: clientId,
          creative_id: firstAd.creative.id,
          body,
          title,
        }),
      });
      setCreatives((prev) => ({
        ...prev,
        [firstAd.creative!.id]: { ...prev[firstAd.creative!.id], body, title },
      }));
    } finally {
      setSavingCopy(false);
    }
  }

  const TABS: { key: PanelTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "creative", label: "Creative & Copy" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-5xl max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${campaignStatus === "ACTIVE" ? "bg-green-500" : "bg-yellow-400"}`} />
            <div className="min-w-0">
              <div className="text-[11px] text-gray-400">{objectiveLabel(campaignObjective)} · {fmtBudget(campaignBudgetDaily)}</div>
              <h2 className="text-sm font-bold text-gray-900 truncate">{campaignName}</h2>
            </div>
            <span className={statusPill(campaignStatus)}>{campaignStatus}</span>
          </div>
          <button onClick={onClose} className="ml-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Tabs ── */}
        <div className="flex border-b border-gray-100 px-6 bg-white">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`py-2.5 px-1 mr-6 text-sm font-medium border-b-2 transition-colors ${
                tab === t.key ? "border-red-600 text-red-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {tab === "overview" && (
                <div className="p-6 space-y-5">
                  <KpiRow insight={insights} />

                  {/* Recommendations */}
                  <div>
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Recommendations</div>
                    <div className="space-y-2">
                      {recommendations.map((rec, i) => (
                        <div key={i} className={`flex gap-3 rounded-xl px-4 py-3 border ${
                          rec.priority === "high" ? "bg-red-50 border-red-100" :
                          rec.priority === "medium" ? "bg-amber-50 border-amber-100" :
                          "bg-gray-50 border-gray-100"
                        }`}>
                          <span className="text-lg flex-shrink-0">{rec.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-gray-900">{rec.title}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{rec.body}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ad Sets summary */}
                  {adSets.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Ad Sets · {adSets.length}</div>
                      <div className="space-y-2">
                        {adSets.map((as) => (
                          <div key={as.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${as.effective_status === "ACTIVE" ? "bg-green-500" : "bg-yellow-400"}`} />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-semibold text-gray-800 truncate">{as.name}</div>
                              <div className="text-[11px] text-gray-400">
                                {fmtBudget(as.daily_budget, as.lifetime_budget)} · {as.optimization_goal.replace(/_/g, " ")} · {as.billing_event}
                              </div>
                            </div>
                            <span className={statusPill(as.effective_status)}>{as.effective_status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CREATIVE & COPY TAB */}
              {tab === "creative" && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: preview */}
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Ad Preview</div>
                      {firstAd ? (
                        <AdPreviewCard creative={firstCreative} ad={firstAd} />
                      ) : (
                        <div className="text-sm text-gray-400 text-center py-12">No ads in this campaign yet</div>
                      )}

                      {/* All creatives strip */}
                      {ads.length > 1 && (
                        <div className="mt-4">
                          <div className="text-xs text-gray-400 mb-2">{ads.length} ads total</div>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {ads.map((ad) => {
                              const c = ad.creative?.id ? creatives[ad.creative.id] : null;
                              const thumb = c?.thumbnail_url ?? c?.image_url;
                              return (
                                <div key={ad.id} className="flex-shrink-0 w-12 h-12 rounded-lg border border-gray-200 overflow-hidden bg-gray-100">
                                  {thumb ? <Image src={thumb} alt={ad.name} width={48} height={48} className="object-cover w-full h-full" unoptimized /> :
                                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-[8px]">No img</div>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: copy editor */}
                    <div>
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Edit Copy</div>
                      <CopyEditor
                        creative={firstCreative}
                        onSave={handleSaveCopy}
                        saving={savingCopy}
                      />
                      {!firstCreative && (
                        <p className="text-xs text-gray-400 mt-3">Creative data not available — copy editing requires ads with loaded creatives.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* SETTINGS TAB */}
              {tab === "settings" && (
                <div className="p-6">
                  <SettingsEditor
                    campaign={campaign}
                    adSets={adSets}
                    token={token}
                    clientId={clientId}
                    onUpdated={() => setRefreshKey((k) => k + 1)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
