"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

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
  start_time?: string;
  end_time?: string;
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
}

interface InsightRow {
  campaign_id: string;
  adset_id: string;
  adset_name: string;
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
  const base = "inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full border";
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

// ---------------------------------------------------------------------------
// Creative card
// ---------------------------------------------------------------------------

function CreativeCard({ creative }: { creative: Creative }) {
  const thumb = creative.thumbnail_url ?? creative.image_url;
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      {thumb ? (
        <div className="relative h-32 bg-gray-100">
          <Image src={thumb} alt={creative.name} fill className="object-cover" unoptimized />
        </div>
      ) : (
        <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
        </div>
      )}
      <div className="p-2">
        {creative.title && <div className="text-xs font-semibold text-gray-800 truncate">{creative.title}</div>}
        {creative.body && <div className="text-[11px] text-gray-500 line-clamp-2 mt-0.5">{creative.body}</div>}
        {creative.object_type && (
          <div className="text-[10px] text-gray-400 mt-1 font-mono">{creative.object_type}</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

interface Props {
  token: string;
  clientId: string;
  campaignId: string;
  campaignName: string;
  onClose: () => void;
}

export default function CampaignDetailPanel({ token, clientId, campaignId, campaignName, onClose }: Props) {
  const [adSets, setAdSets] = useState<AdSet[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [creatives, setCreatives] = useState<Record<string, Creative>>({});
  const [insights, setInsights] = useState<InsightRow[]>([]);
  const [loadingAdSets, setLoadingAdSets] = useState(true);
  const [expandedAdSet, setExpandedAdSet] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  // Fetch ad sets + insights for this campaign
  useEffect(() => {
    if (!campaignId) return;
    setLoadingAdSets(true);

    Promise.all([
      fetch(`/api/meta/adsets?client_id=${clientId}&campaign_id=${campaignId}`, { headers }),
      fetch(`/api/meta/insights?client_id=${clientId}&campaign_id=${campaignId}&date_preset=last_30d`, { headers }),
    ])
      .then(([r1, r2]) => Promise.all([r1.json(), r2.json()]))
      .then(([setsJson, insJson]: [{ data?: AdSet[] }, { data?: InsightRow[] }]) => {
        setAdSets(setsJson.data ?? []);
        setInsights(insJson.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoadingAdSets(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, clientId, token]);

  // Fetch ads when ad set expands
  const loadAdsForAdSet = async (adSetId: string) => {
    if (expandedAdSet === adSetId) {
      setExpandedAdSet(null);
      return;
    }
    setExpandedAdSet(adSetId);

    const res = await fetch(`/api/meta/ads?client_id=${clientId}&adset_id=${adSetId}`, { headers });
    const json = await res.json() as { data?: Ad[] };
    const newAds = json.data ?? [];
    setAds((prev) => {
      const filtered = prev.filter((a) => a.adset_id !== adSetId);
      return [...filtered, ...newAds];
    });

    // Fetch creatives for each ad
    const adCreativeIds = newAds.filter((a) => a.creative?.id).map((a) => a.creative!.id);
    for (const cid of adCreativeIds) {
      if (creatives[cid]) continue;
      fetch(`/api/meta/creatives?client_id=${clientId}&creative_id=${cid}`, { headers })
        .then((r) => r.json())
        .then((j: { data?: Creative }) => {
          if (j.data) setCreatives((prev) => ({ ...prev, [cid]: j.data! }));
        })
        .catch(console.error);
    }
  };

  const insightByAdSet = (adSetId: string) =>
    insights.find((i) => i.adset_id === adSetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-400 mb-0.5">Campaign Detail</div>
            <h2 className="text-sm font-bold text-gray-900 truncate">{campaignName}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
          {loadingAdSets ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : adSets.length === 0 ? (
            <div className="text-center text-gray-400 text-sm py-8">No ad sets found for this campaign.</div>
          ) : (
            adSets.map((adSet) => {
              const ins = insightByAdSet(adSet.id);
              const isExpanded = expandedAdSet === adSet.id;
              const adSetAds = ads.filter((a) => a.adset_id === adSet.id);

              return (
                <div key={adSet.id} className="rounded-xl border border-gray-200 overflow-hidden">
                  {/* Ad set header row */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => loadAdsForAdSet(adSet.id)}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${adSet.effective_status === "ACTIVE" ? "bg-green-500" : "bg-yellow-400"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{adSet.name}</div>
                      <div className="text-xs text-gray-400">
                        {fmtBudget(adSet.daily_budget, adSet.lifetime_budget)} · {adSet.optimization_goal}
                      </div>
                    </div>

                    {/* Insight pills */}
                    {ins && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {ins.spend > 0 && (
                          <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-lg">
                            ${fmt(ins.spend, 2)}
                          </span>
                        )}
                        {ins.conversions > 0 && (
                          <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100">
                            {fmt(ins.conversions)} conv
                          </span>
                        )}
                        {ins.ctr > 0 && (
                          <span className="text-xs text-gray-500">
                            {fmt(ins.ctr, 2)}% CTR
                          </span>
                        )}
                      </div>
                    )}

                    <span className={statusPill(adSet.effective_status)}>
                      {adSet.effective_status}
                    </span>

                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>

                  {/* Expanded ad set: ads + creatives */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50 px-4 py-4">
                      {adSetAds.length === 0 ? (
                        <div className="text-xs text-gray-400 text-center py-3 animate-pulse">Loading ads…</div>
                      ) : (
                        <div>
                          <div className="text-xs font-semibold text-gray-500 mb-3">
                            {adSetAds.length} ad{adSetAds.length !== 1 ? "s" : ""} in this ad set
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {adSetAds.map((ad) => {
                              const creative = ad.creative?.id ? creatives[ad.creative.id] : null;
                              return (
                                <div key={ad.id}>
                                  {creative ? (
                                    <CreativeCard creative={creative} />
                                  ) : (
                                    <div className="rounded-xl border border-gray-200 bg-white p-3">
                                      <div className="h-24 bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-red-500 rounded-full animate-spin" />
                                      </div>
                                      <div className="text-xs font-medium text-gray-700 truncate">{ad.name}</div>
                                      <span className={statusPill(ad.effective_status)}>
                                        {ad.effective_status}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Targeting summary */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                          <div className="font-medium text-gray-700 mb-0.5">Billing</div>
                          {adSet.billing_event}
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                          <div className="font-medium text-gray-700 mb-0.5">Goal</div>
                          {adSet.optimization_goal}
                        </div>
                        {adSet.start_time && (
                          <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                            <div className="font-medium text-gray-700 mb-0.5">Started</div>
                            {new Date(adSet.start_time).toLocaleDateString()}
                          </div>
                        )}
                        {adSet.end_time && (
                          <div className="bg-white rounded-lg border border-gray-200 px-3 py-2">
                            <div className="font-medium text-gray-700 mb-0.5">Ends</div>
                            {new Date(adSet.end_time).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
