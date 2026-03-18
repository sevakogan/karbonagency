"use client";

/**
 * AdPreviewTab — Visual ad mockups, creative upload + AI analysis,
 * geo targeting maps, and recharts metrics dashboard.
 */

import { useState, useRef, useCallback } from "react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { SHIFT_ARCADE_DRAFT_CAMPAIGNS } from "@/lib/meta-api-write";
import type { ShiftArcadeDraftCampaign } from "@/lib/meta-api-write";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AdView = "fb_feed" | "ig_feed" | "ig_story";
type UploadState = "idle" | "uploading" | "done" | "error";
type AnalysisState = "idle" | "analyzing" | "done" | "error";

interface UploadedAsset {
  id: string;
  name: string;
  previewUrl: string;
  metaHash?: string;
  metaUrl?: string;
  type: "image" | "video";
  analysis?: string;
}

interface Props {
  token: string | null;
  clientId: string | null;
}

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
const CHART_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6"];
const PRIORITY_COLORS = ["#22c55e", "#3b82f6", "#8b5cf6", "#f97316", "#ef4444"];

// ---------------------------------------------------------------------------
// Geo targeting city map (SVG approximation for Miami metro area)
// ---------------------------------------------------------------------------
const GEO_POSITIONS: Record<string, { x: number; y: number; label: string }> = {
  "2421836": { x: 150, y: 180, label: "North Miami Beach" },
  "2403700": { x: 150, y: 80, label: "Fort Lauderdale" },
  miami: { x: 150, y: 220, label: "Miami / Wynwood" },
};

function GeoMapPreview({ campaign }: { campaign: ShiftArcadeDraftCampaign }) {
  const cities = campaign.adSet.targeting?.geo_locations?.cities || [];
  const hasRadius = cities.some((c) => (c as unknown as { radius?: number }).radius);
  const radius = cities[0] ? ((cities[0] as unknown as { radius?: number }).radius || 15) : 15;
  const cityKey = cities[0]?.key || "miami";
  const pos = GEO_POSITIONS[cityKey] || { x: 150, y: 200, label: "Miami" };
  const radiusPx = Math.min(80, radius * 4);

  return (
    <div className="relative">
      <svg viewBox="0 0 300 300" className="w-full rounded-xl bg-gradient-to-b from-blue-50 to-green-50 border border-gray-200">
        {/* Grid */}
        {[50, 100, 150, 200, 250].map((v) => (
          <line key={`h${v}`} x1="0" y1={v} x2="300" y2={v} stroke="#e5e7eb" strokeWidth="0.5" />
        ))}
        {[50, 100, 150, 200, 250].map((v) => (
          <line key={`v${v}`} x1={v} y1="0" x2={v} y2="300" stroke="#e5e7eb" strokeWidth="0.5" />
        ))}

        {/* Ocean */}
        <rect x="220" y="0" width="80" height="300" fill="#bfdbfe" opacity="0.4" rx="4" />
        <text x="240" y="150" fontSize="10" fill="#93c5fd" transform="rotate(90, 240, 150)">ATLANTIC OCEAN</text>

        {/* Wynwood star (home base) */}
        <circle cx="145" cy="215" r="6" fill="#ef4444" />
        <text x="130" y="235" fontSize="9" fill="#ef4444" fontWeight="bold">WYNWOOD</text>

        {/* Campaign targeting radius */}
        <circle
          cx={pos.x}
          cy={pos.y}
          r={radiusPx}
          fill="#3b82f6"
          fillOpacity="0.15"
          stroke="#3b82f6"
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />
        <circle cx={pos.x} cy={pos.y} r="5" fill="#3b82f6" />
        <text x={pos.x + 8} y={pos.y - 8} fontSize="9" fill="#1d4ed8" fontWeight="bold">{pos.label}</text>
        <text x={pos.x + 8} y={pos.y + 4} fontSize="8" fill="#3b82f6">{radius}mi radius</text>

        {/* Labels */}
        <text x="10" y="295" fontSize="8" fill="#9ca3af">Miami-Dade & Broward County</text>
      </svg>
      <div className="mt-2 flex gap-2 flex-wrap">
        {cities.map((city, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs border border-blue-200">
            📍 {(city as unknown as { name?: string }).name || `City ${city.key}`}
            {hasRadius && ` · ${(city as unknown as { radius?: number }).radius || radius}mi`}
          </span>
        ))}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full text-xs border border-purple-200">
          👤 Ages {campaign.adSet.targeting?.age_min}–{campaign.adSet.targeting?.age_max}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Facebook Feed Ad Mockup
// ---------------------------------------------------------------------------
function FbFeedMockup({ draft, asset }: { draft: ShiftArcadeDraftCampaign; asset?: UploadedAsset }) {
  const cs = draft.creativeSpec;
  const truncated = cs.primaryText.length > 125 ? cs.primaryText.slice(0, 125) + "…" : cs.primaryText;

  return (
    <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden shadow-sm max-w-sm mx-auto font-sans">
      {/* Profile bar */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">SA</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-900 truncate">Shift Arcade Miami</div>
          <div className="text-xs text-gray-400 flex items-center gap-1">Sponsored · <span className="text-blue-500">🌐</span></div>
        </div>
        <div className="text-gray-400 text-lg">···</div>
      </div>

      {/* Primary text */}
      <div className="px-3 py-2 text-sm text-gray-800 leading-relaxed">{truncated}</div>

      {/* Image / video */}
      {asset ? (
        asset.type === "image" ? (
          <img src={asset.previewUrl} alt="Ad creative" className="w-full aspect-square object-cover" />
        ) : (
          <video src={asset.previewUrl} className="w-full aspect-square object-cover" controls muted />
        )
      ) : (
        <div className="w-full aspect-square bg-gradient-to-br from-gray-900 via-red-900 to-orange-800 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.03) 20px, rgba(255,255,255,0.03) 40px)" }} />
          <div className="text-5xl mb-2">🏎️</div>
          <div className="text-white font-bold text-center px-4 text-sm">{cs.creativeConceptTitle}</div>
          <div className="text-orange-300 text-xs mt-1">Add your creative →</div>
        </div>
      )}

      {/* Headline + CTA */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-2">
          <div className="text-sm font-semibold text-gray-900 truncate">{cs.headline}</div>
          <div className="text-xs text-gray-500 truncate">{cs.description}</div>
        </div>
        <button className="flex-shrink-0 bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
          {cs.callToAction.replace(/_/g, " ")}
        </button>
      </div>

      {/* Engagement bar */}
      <div className="px-3 py-2 flex justify-between text-xs text-gray-400 border-t border-gray-100">
        <span>👍 Like</span>
        <span>💬 Comment</span>
        <span>↗️ Share</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Instagram Feed Mockup
// ---------------------------------------------------------------------------
function IgFeedMockup({ draft, asset }: { draft: ShiftArcadeDraftCampaign; asset?: UploadedAsset }) {
  const cs = draft.creativeSpec;

  return (
    <div className="bg-white rounded-2xl border border-gray-300 overflow-hidden shadow-sm max-w-sm mx-auto font-sans">
      {/* IG Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white text-xs font-bold ring-2 ring-pink-400 ring-offset-1">SA</div>
          <div>
            <div className="text-xs font-semibold text-gray-900">shiftarcade.miami</div>
            <div className="text-[10px] text-gray-400">Sponsored</div>
          </div>
        </div>
        <span className="text-gray-400 text-sm">···</span>
      </div>

      {/* Image 1:1 */}
      {asset ? (
        asset.type === "image" ? (
          <img src={asset.previewUrl} alt="Ad creative" className="w-full aspect-square object-cover" />
        ) : (
          <video src={asset.previewUrl} className="w-full aspect-square object-cover" controls muted />
        )
      ) : (
        <div className="w-full aspect-square bg-gradient-to-br from-gray-900 via-red-900 to-orange-800 flex flex-col items-center justify-center relative">
          <div className="text-5xl mb-2">🏎️</div>
          <div className="text-white font-bold text-center px-4 text-sm">{cs.creativeConceptTitle}</div>
        </div>
      )}

      {/* IG Actions */}
      <div className="px-3 pt-2 pb-1 flex items-center gap-3 text-xl">
        <span>🤍</span><span>💬</span><span>↗️</span>
        <span className="ml-auto">🔖</span>
      </div>

      {/* Caption */}
      <div className="px-3 pb-2">
        <div className="text-xs font-semibold text-gray-900">shiftarcade.miami</div>
        <div className="text-xs text-gray-700 mt-0.5 leading-relaxed">
          {cs.primaryText.slice(0, 100)}{cs.primaryText.length > 100 ? "…" : ""}
        </div>
        <div className="mt-1.5">
          <button className="w-full bg-gradient-to-r from-pink-500 to-orange-400 text-white text-xs font-bold py-1.5 rounded-lg">
            {cs.callToAction.replace(/_/g, " ")} →
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stories Mockup (9:16)
// ---------------------------------------------------------------------------
function StoriesMockup({ draft, asset }: { draft: ShiftArcadeDraftCampaign; asset?: UploadedAsset }) {
  const cs = draft.creativeSpec;

  return (
    <div className="bg-black rounded-2xl overflow-hidden shadow-xl max-w-[200px] mx-auto relative" style={{ aspectRatio: "9/16" }}>
      {/* Progress bar */}
      <div className="absolute top-2 left-2 right-2 flex gap-1 z-10">
        <div className="flex-1 h-0.5 bg-white rounded-full opacity-50" />
        <div className="flex-1 h-0.5 bg-white rounded-full" />
      </div>

      {/* Profile */}
      <div className="absolute top-5 left-2 right-2 flex items-center gap-2 z-10">
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center text-white text-[8px] font-bold ring-1 ring-pink-400">SA</div>
        <div className="text-white text-[10px] font-semibold">shiftarcade.miami</div>
        <div className="text-white text-[8px] bg-white/20 px-1.5 rounded ml-1">Sponsored</div>
      </div>

      {/* Background */}
      {asset ? (
        asset.type === "image" ? (
          <img src={asset.previewUrl} alt="Story" className="w-full h-full object-cover" />
        ) : (
          <video src={asset.previewUrl} className="w-full h-full object-cover" autoPlay muted loop />
        )
      ) : (
        <div className="w-full h-full bg-gradient-to-b from-gray-900 via-red-900 to-orange-900 flex flex-col items-center justify-center">
          <div className="text-4xl mb-2">🏎️</div>
          <div className="text-white font-bold text-center px-3 text-xs">{cs.headline}</div>
        </div>
      )}

      {/* Bottom overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 z-10">
        <div className="text-white text-[10px] font-bold text-center mb-1">{cs.headline}</div>
        <button className="w-full bg-white text-black text-[10px] font-bold py-1 rounded-full">
          {cs.callToAction.replace(/_/g, " ")} →
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Creative Upload + AI Analysis card
// ---------------------------------------------------------------------------
function CreativeUploadCard({
  draft,
  token,
  clientId,
  assets,
  onAssetAdded,
}: {
  draft: ShiftArcadeDraftCampaign;
  token: string;
  clientId: string;
  assets: UploadedAsset[];
  onAssetAdded: (asset: UploadedAsset) => void;
}) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [analysisState, setAnalysisState] = useState<AnalysisState>("idle");
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisDraftId, setAnalysisDraftId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(async (file: File) => {
    setUploadState("uploading");
    const previewUrl = URL.createObjectURL(file);
    const type = file.type.startsWith("video") ? "video" : "image";
    const id = `${Date.now()}-${file.name}`;

    try {
      // Try uploading to Meta; fall back to local preview if it fails
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/meta/upload?client_id=${clientId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json() as {
        data?: { hash: string; url: string; name: string };
        error?: string;
      };

      onAssetAdded({
        id,
        name: file.name,
        previewUrl,
        metaHash: data.data?.hash,
        metaUrl: data.data?.url,
        type,
      });
      setUploadState("done");
    } catch {
      // Still show locally even if Meta upload fails
      onAssetAdded({ id, name: file.name, previewUrl, type });
      setUploadState("done");
    }
  }, [token, clientId, onAssetAdded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  const analyzeAsset = async (asset: UploadedAsset) => {
    setAnalysisState("analyzing");
    setAnalysisDraftId(draft.id);
    try {
      // Convert to base64 for analysis
      const response = await fetch(asset.previewUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.readAsDataURL(blob);
      });

      const res = await fetch("/api/meta/analyze-creative", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: blob.type,
          campaignContext: {
            name: draft.name,
            objective: draft.campaign.objective,
            headline: draft.creativeSpec.headline,
            primaryText: draft.creativeSpec.primaryText,
            callToAction: draft.creativeSpec.callToAction,
            targetAudience: `${draft.adSet.targeting?.age_min}–${draft.adSet.targeting?.age_max}, Miami area, racing/entertainment fans`,
          },
        }),
      });

      const data = await res.json() as { data?: { analysis: string }; error?: string };
      if (data.data?.analysis) {
        setAnalysis(data.data.analysis);
        setAnalysisState("done");
      } else {
        setAnalysis(`Error: ${data.error || "Analysis failed"}`);
        setAnalysisState("error");
      }
    } catch (err) {
      setAnalysis(err instanceof Error ? err.message : "Analysis failed");
      setAnalysisState("error");
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        />
        {uploadState === "uploading" ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-blue-600">Uploading to Meta…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="text-3xl">📸</div>
            <p className="text-sm font-medium text-gray-700">Drop image or video here</p>
            <p className="text-xs text-gray-400">JPG, PNG, MP4 • Feed: 1080×1080 • Stories: 1080×1920</p>
          </div>
        )}
      </div>

      {/* Uploaded assets */}
      {assets.length > 0 && (
        <div className="space-y-2">
          {assets.map((asset) => (
            <div key={asset.id} className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-3 bg-gray-50">
                {asset.type === "image" ? (
                  <img src={asset.previewUrl} className="w-12 h-12 object-cover rounded-lg" alt={asset.name} />
                ) : (
                  <div className="w-12 h-12 bg-gray-800 rounded-lg flex items-center justify-center text-2xl">🎬</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{asset.name}</p>
                  {asset.metaHash && (
                    <p className="text-xs text-green-600">✓ Uploaded to Meta · Hash: {asset.metaHash.slice(0, 8)}…</p>
                  )}
                  {!asset.metaHash && <p className="text-xs text-amber-600">Local preview only</p>}
                </div>
                {asset.type === "image" && (
                  <button
                    onClick={() => analyzeAsset(asset)}
                    disabled={analysisState === "analyzing" && analysisDraftId === draft.id}
                    className="flex-shrink-0 px-3 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {analysisState === "analyzing" && analysisDraftId === draft.id ? (
                      <span className="flex items-center gap-1"><span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />Analyzing…</span>
                    ) : "🤖 AI Review"}
                  </button>
                )}
              </div>

              {/* AI Analysis result */}
              {analysis && analysisState !== "idle" && analysisDraftId === draft.id && (
                <div className="p-3 bg-purple-50 border-t border-purple-100 max-h-64 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-purple-800">🤖 AI Creative Analysis</span>
                    {analysisState === "done" && <span className="text-xs text-green-600">✓ Complete</span>}
                  </div>
                  <div className="text-xs text-purple-900 leading-relaxed whitespace-pre-wrap">{analysis}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Creative brief */}
      <div className="border border-amber-200 bg-amber-50 rounded-xl p-3 text-xs">
        <div className="font-semibold text-amber-800 mb-1.5">📋 Creative Brief: What to upload</div>
        <div className="space-y-1 text-amber-700">
          <div><span className="font-medium">Concept:</span> {draft.creativeSpec.creativeConceptTitle}</div>
          <div><span className="font-medium">Format:</span> Feed (1080×1080 or 1080×1350) · Stories (1080×1920)</div>
          <div><span className="font-medium">Must show:</span> Racing simulator cockpit, brand logo, booking CTA</div>
          <div className="mt-1.5 pt-1.5 border-t border-amber-200">
            <span className="font-medium">Video Script: </span>
            <span className="italic">{draft.creativeSpec.creativeConceptScript.slice(0, 150)}…</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metrics Dashboard (recharts)
// ---------------------------------------------------------------------------
function MetricsDashboard() {
  const budgetData = SHIFT_ARCADE_DRAFT_CAMPAIGNS.map((d) => ({
    name: d.name.replace(/[🏆🎯🔄🧪🎬]/g, "").trim().split("—")[0].trim(),
    budget: d.campaign.daily_budget / 100,
    cpp: parseFloat(d.estimatedCPP.split("-")[0].replace("$", "")),
  }));

  const reachData = SHIFT_ARCADE_DRAFT_CAMPAIGNS.map((d, i) => {
    const r = d.estimatedReach.replace(/,/g, "").replace("/week", "").split("-");
    const mid = Math.round((parseInt(r[0]) + parseInt(r[1] || r[0])) / 2);
    return {
      name: d.name.replace(/[🏆🎯🔄🧪🎬]/g, "").trim().split("—")[0].trim().slice(0, 20),
      reach: Math.round(mid / 1000),
      fill: PRIORITY_COLORS[i],
    };
  });

  const pieData = SHIFT_ARCADE_DRAFT_CAMPAIGNS.map((d, i) => ({
    name: d.name.replace(/[🏆🎯🔄🧪🎬]/g, "").trim().split("—")[0].trim(),
    value: d.campaign.daily_budget / 100,
    fill: CHART_COLORS[i],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-gray-900">$45</div>
          <div className="text-xs text-gray-500 mt-1">Total daily budget (all 5)</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-green-600">$5–8</div>
          <div className="text-xs text-gray-500 mt-1">Est. cost per booking</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-blue-600">~300k</div>
          <div className="text-xs text-gray-500 mt-1">Potential reach/week</div>
        </div>
      </div>

      {/* Budget allocation pie */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">💰 Budget Allocation ($45/day total)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `$${value}`}>
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `$${v}/day`} />
            <Legend formatter={(value) => value.slice(0, 25)} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Estimated reach */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">📡 Estimated Reach per Week (thousands)</h4>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={reachData} layout="vertical" margin={{ left: 10, right: 20 }}>
            <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}k`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
            <Tooltip formatter={(v) => `~${v},000 people`} />
            <Bar dataKey="reach" radius={[0, 4, 4, 0]}>
              {reachData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* CPP comparison */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 text-sm mb-3">🎯 Estimated Cost Per Purchase (lower = better)</h4>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={budgetData}>
            <XAxis dataKey="name" tick={{ fontSize: 9 }} tickFormatter={(v) => v.slice(0, 12)} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v) => `$${v}`} />
            <Bar dataKey="cpp" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export default function AdPreviewTab({ token, clientId }: Props) {
  const [selectedDraftId, setSelectedDraftId] = useState<string>(SHIFT_ARCADE_DRAFT_CAMPAIGNS[0].id);
  const [adView, setAdView] = useState<AdView>("fb_feed");
  const [activeSection, setActiveSection] = useState<"previews" | "metrics">("previews");
  // Map draft_id → list of uploaded assets
  const [assetsByDraft, setAssetsByDraft] = useState<Record<string, UploadedAsset[]>>({});

  const selectedDraft = SHIFT_ARCADE_DRAFT_CAMPAIGNS.find((d) => d.id === selectedDraftId)!;
  const currentAssets = assetsByDraft[selectedDraftId] || [];
  const activeAsset = currentAssets[0]; // show first uploaded asset in mockup

  const addAsset = (asset: UploadedAsset) => {
    setAssetsByDraft((prev) => ({
      ...prev,
      [selectedDraftId]: [...(prev[selectedDraftId] || []), asset],
    }));
  };

  return (
    <div className="space-y-4">
      {/* Section switcher */}
      <div className="flex gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveSection("previews")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeSection === "previews" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
        >
          🖼️ Ad Previews + Creatives
        </button>
        <button
          onClick={() => setActiveSection("metrics")}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeSection === "metrics" ? "bg-gray-900 text-white" : "text-gray-600 hover:bg-gray-100"}`}
        >
          📊 Campaign Metrics Dashboard
        </button>
      </div>

      {activeSection === "metrics" && <MetricsDashboard />}

      {activeSection === "previews" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: campaign selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Select Campaign</p>
            {SHIFT_ARCADE_DRAFT_CAMPAIGNS.map((d, i) => (
              <button
                key={d.id}
                onClick={() => setSelectedDraftId(d.id)}
                className={`w-full text-left px-3 py-2.5 rounded-xl border text-sm transition-all ${selectedDraftId === d.id ? "border-gray-900 bg-gray-900 text-white" : "border-gray-200 hover:border-gray-300 bg-white"}`}
              >
                <div className="font-medium truncate">{d.name.split("—")[0].trim()}</div>
                <div className={`text-xs mt-0.5 flex items-center gap-1.5 ${selectedDraftId === d.id ? "text-gray-300" : "text-gray-400"}`}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ background: PRIORITY_COLORS[i] }} />
                  {d.estimatedCPP} CPP · {d.estimatedReach.split("/")[0]}
                  {(assetsByDraft[d.id] || []).length > 0 && (
                    <span className={`ml-auto ${selectedDraftId === d.id ? "text-green-300" : "text-green-600"}`}>
                      📸 {(assetsByDraft[d.id] || []).length}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Center: ad mockup */}
          <div className="space-y-3">
            {/* Platform switcher */}
            <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
              {(["fb_feed", "ig_feed", "ig_story"] as AdView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setAdView(v)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${adView === v ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                >
                  {v === "fb_feed" ? "📘 FB Feed" : v === "ig_feed" ? "📸 IG Feed" : "📱 Stories"}
                </button>
              ))}
            </div>

            {adView === "fb_feed" && <FbFeedMockup draft={selectedDraft} asset={activeAsset} />}
            {adView === "ig_feed" && <IgFeedMockup draft={selectedDraft} asset={activeAsset} />}
            {adView === "ig_story" && <StoriesMockup draft={selectedDraft} asset={activeAsset} />}

            {/* Campaign key stats */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs space-y-1">
              <div className="flex justify-between"><span className="text-gray-500">Budget</span><span className="font-semibold">${selectedDraft.campaign.daily_budget / 100}/day</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Est. reach</span><span className="font-semibold">{selectedDraft.estimatedReach}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Est. CPP</span><span className="font-semibold text-green-700">{selectedDraft.estimatedCPP}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Priority</span><span className="font-semibold">#{selectedDraft.priority} of 5</span></div>
            </div>
          </div>

          {/* Right: creative upload + geo map */}
          <div className="space-y-4">
            {/* Upload */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Creative Assets</p>
              {token && clientId ? (
                <CreativeUploadCard
                  draft={selectedDraft}
                  token={token}
                  clientId={clientId}
                  assets={currentAssets}
                  onAssetAdded={addAsset}
                />
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                  Sign in to upload creatives
                </div>
              )}
            </div>

            {/* Geo map */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">📍 Targeting Area</p>
              <GeoMapPreview campaign={selectedDraft} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
