"use client";

/**
 * CompetitorsTab — Competitor intelligence using Meta Ad Library.
 * - Auto-loads 10 AI-identified competitors for Shift Arcade Miami
 * - Manual search by keyword / city / company name
 * - Shows their active Meta ads + AI strategic analysis
 */

import { useState, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AdData {
  id: string;
  page_name?: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_delivery_start_time?: string;
  impressions?: { lower_bound: string; upper_bound: string };
  spend?: { lower_bound: string; upper_bound: string };
  ad_snapshot_url?: string;
}

interface Competitor {
  name: string;
  category: string;
  location: string;
  searchTerms: string[];
  ads: AdData[];
  isAdvertising: boolean;
  adCount: number;
}

interface CompetitorData {
  competitors: Competitor[];
  insights: string;
  note?: string | null;
}

interface Props {
  token: string | null;
  clientId: string | null;
}

// ---------------------------------------------------------------------------
// Ad snippet card
// ---------------------------------------------------------------------------
function AdCard({ ad }: { ad: AdData }) {
  const body = ad.ad_creative_bodies?.[0] || ad.ad_creative_link_captions?.[0] || "No ad copy available";
  const truncated = body.length > 120 ? body.slice(0, 120) + "…" : body;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 text-xs">
      <div className="font-medium text-gray-900 mb-1 truncate">{ad.page_name || "Unknown Page"}</div>
      <div className="text-gray-600 leading-relaxed mb-2">{truncated}</div>
      <div className="flex items-center justify-between text-gray-400">
        <span>📅 {ad.ad_delivery_start_time ? new Date(ad.ad_delivery_start_time).toLocaleDateString() : "Unknown"}</span>
        {ad.impressions && (
          <span>👁 {parseInt(ad.impressions.lower_bound || "0").toLocaleString()}+ impressions</span>
        )}
      </div>
      {ad.ad_snapshot_url && (
        <a
          href={ad.ad_snapshot_url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-blue-600 hover:underline"
        >
          View ad →
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Competitor card
// ---------------------------------------------------------------------------
function CompetitorCard({ competitor }: { competitor: Competitor }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
      >
        {/* Brand icon */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {competitor.name.slice(0, 2).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-sm truncate">{competitor.name}</div>
          <div className="text-xs text-gray-500">{competitor.category} · {competitor.location}</div>
        </div>

        {/* Meta ads badge */}
        <div className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold ${
          competitor.isAdvertising
            ? "bg-red-100 text-red-700"
            : "bg-gray-100 text-gray-500"
        }`}>
          {competitor.isAdvertising ? `🔴 ${competitor.adCount} ads live` : "⚪ No Meta ads"}
        </div>

        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-3">
          {competitor.isAdvertising && competitor.ads.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-700">Active Meta Ads:</p>
              {competitor.ads.slice(0, 3).map((ad, i) => (
                <AdCard key={ad.id || i} ad={ad} />
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">
              {competitor.isAdvertising
                ? "Ad data loaded — no preview available"
                : "Not currently running Meta ads. They may be missing the digital channel — opportunity for Shift Arcade!"}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs">
            <div className="font-semibold text-blue-800 mb-1">🎯 Shift Arcade Advantage vs. {competitor.name.split(" ")[0]}</div>
            <div className="text-blue-700">
              {competitor.category.includes("Racing")
                ? "Direct competitor — differentiate on premium experience, pro F1 simulators, and Wynwood lifestyle positioning"
                : competitor.category.includes("Entertainment")
                ? "Indirect competitor for leisure budget — out-target them by focusing on racing/F1 interest audiences they can't reach"
                : "Adjacent — target racing interest audiences that general entertainment brands ignore"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export default function CompetitorsTab({ token, clientId }: Props) {
  const [data, setData] = useState<CompetitorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    query: string;
    adCount: number;
    isAdvertising: boolean;
    ads: AdData[];
    aiContext: string;
    note?: string | null;
  } | null>(null);

  // Auto-load on mount
  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetch("/api/meta/competitors", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d: { data?: CompetitorData; error?: string }) => {
        if (d.data) setData(d.data);
        else setError(d.error || "Failed to load competitors");
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !token) return;
    setSearchLoading(true);
    setSearchResult(null);
    try {
      const res = await fetch("/api/meta/competitors", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: searchQuery }),
      });
      const d = await res.json() as { data?: typeof searchResult; error?: string };
      if (d.data) setSearchResult(d.data);
      else setError(d.error || "Search failed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-1">🏆 Competitor Intelligence</h3>
        <p className="text-gray-400 text-sm">
          See which competitors are running Meta ads, what they're saying, and how to outcompete them.
          Powered by Meta Ad Library + Claude AI analysis.
        </p>
      </div>

      {/* Manual search */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">🔍 Search Any Competitor</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Company name, keyword, or city (e.g. 'sim racing Miami', 'F1 Arcade', 'go-karts Doral')"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || searchLoading}
            className="px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-700 disabled:bg-gray-200 transition-colors flex items-center gap-2"
          >
            {searchLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : "Search"}
          </button>
        </div>

        {/* Search result */}
        {searchResult && (
          <div className="mt-4 border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-3 bg-gray-50 flex items-center justify-between">
              <div>
                <span className="font-semibold text-sm text-gray-900">"{searchResult.query}"</span>
                <span className={`ml-3 text-xs px-2 py-0.5 rounded-full ${
                  searchResult.isAdvertising ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {searchResult.isAdvertising ? `🔴 ${searchResult.adCount} Meta ads found` : "⚪ No ads found"}
                </span>
              </div>
            </div>
            {searchResult.aiContext && (
              <div className="p-3 bg-blue-50 border-t border-blue-100">
                <p className="text-xs text-blue-800 leading-relaxed">🤖 {searchResult.aiContext}</p>
              </div>
            )}
            {searchResult.ads.slice(0, 3).map((ad, i) => (
              <div key={i} className="p-3 border-t border-gray-100">
                <AdCard ad={ad} />
              </div>
            ))}
            {searchResult.note && (
              <div className="p-3 border-t border-amber-100 bg-amber-50 text-xs text-amber-700">
                ⚠️ {searchResult.note}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI strategic insights */}
      {data?.insights && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-xs font-bold">AI</div>
            <span className="font-semibold text-purple-900 text-sm">Strategic Competitive Analysis</span>
          </div>
          <div className="text-sm text-purple-800 leading-relaxed whitespace-pre-line">{data.insights}</div>
        </div>
      )}

      {/* Ad Library note */}
      {data?.note && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
          ⚠️ {data.note}
        </div>
      )}

      {/* Competitor list */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading competitor intelligence…</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
          ⚠️ {error}
        </div>
      )}

      {data && !loading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">10 Auto-Identified Competitors</p>
            <span className="text-xs text-gray-400">
              {data.competitors.filter((c) => c.isAdvertising).length} / {data.competitors.length} running Meta ads
            </span>
          </div>

          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-700">{data.competitors.filter((c) => c.isAdvertising).length}</div>
              <div className="text-xs text-red-600">Running Meta Ads</div>
            </div>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-gray-700">{data.competitors.filter((c) => !c.isAdvertising).length}</div>
              <div className="text-xs text-gray-500">Not Advertising</div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-green-700">{data.competitors.filter((c) => !c.isAdvertising).length}</div>
              <div className="text-xs text-green-600">Gap Opportunities</div>
            </div>
          </div>

          {data.competitors.map((c, i) => (
            <CompetitorCard key={i} competitor={c} />
          ))}
        </div>
      )}
    </div>
  );
}
