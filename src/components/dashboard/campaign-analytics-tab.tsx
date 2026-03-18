"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis, ReferenceLine, CartesianGrid,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────

interface CampaignInsight {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  reach: number;
  ctr: number;
  cpc: number;
  cpm: number;
  frequency: number;
  conversions: number;
  cpa: number;
  roas: number;
  performance_score: number;
}

type DatePreset = "today" | "last_7d" | "last_14d" | "last_30d" | "last_month" | "last_quarter" | "last_year" | "custom";
type SortDir = "asc" | "desc";
type SortCol = "spend" | "conversions" | "cpa" | "ctr" | "cpc" | "cpm" | "reach" | "impressions" | "performance_score";

// ─── Constants ───────────────────────────────────────────────────────────────

const DATE_OPTIONS: { label: string; value: DatePreset }[] = [
  { label: "Today",     value: "today" },
  { label: "7 days",    value: "last_7d" },
  { label: "30 days",   value: "last_30d" },
  { label: "Month",     value: "last_month" },
  { label: "Quarter",   value: "last_quarter" },
  { label: "12 months", value: "last_year" },
  { label: "Custom",    value: "custom" },
];

// Industry benchmarks for Meta ads (entertainment / booking vertical)
const BENCHMARKS = {
  ctr: { good: 2.0, ok: 1.0, label: "Aim for >2%" },
  cpc: { good: 0.70, ok: 1.20, label: "Aim for <$0.70" },
  cpa: { good: 10, ok: 20, label: "Aim for <$10" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt  = (n: number, dec = 0) => n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
const fmtUSD = (n: number) => `$${fmt(n, 2)}`;

function shortName(name: string, max = 26): string {
  const cleaned = name
    .replace(/^(CAPI|SHIFT ARCADE)\s*\|\s*/i, "")
    .replace(/\s*\|\s*(Feeds?\s*\+\s*Stories?|Feed|Stories?|COLD|WARM|RETARGETING)/gi, "")
    .trim();
  return cleaned.length > max ? cleaned.slice(0, max) + "…" : cleaned;
}

function scoreColor(score: number) {
  if (score >= 75) return { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", bar: "#10b981" };
  if (score >= 55) return { text: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200",   dot: "bg-amber-500",   bar: "#f59e0b" };
  return                  { text: "text-red-500",     bg: "bg-red-50",     border: "border-red-200",     dot: "bg-red-500",     bar: "#ef4444" };
}

function improvementTip(c: CampaignInsight): { text: string; color: string } {
  if (c.performance_score >= 80) return { text: "🚀 Scale budget", color: "text-emerald-600" };
  if (c.ctr < BENCHMARKS.ctr.ok)  return { text: "🎨 Refresh creative — CTR low", color: "text-orange-500" };
  if (c.cpc > BENCHMARKS.cpc.ok)  return { text: "🎯 Narrow audience — CPC high", color: "text-orange-500" };
  if (c.cpa > BENCHMARKS.cpa.ok && c.conversions > 0)
                                   return { text: "💰 Reduce CPA — above target", color: "text-red-500" };
  if (c.impressions > 0 && c.conversions === 0)
                                   return { text: "⚠️ Zero conversions — check pixel", color: "text-red-500" };
  return { text: "📊 Monitor & optimise", color: "text-blue-500" };
}

// ─── KPI Cards ───────────────────────────────────────────────────────────────

function KpiCards({ insights }: { insights: CampaignInsight[] }) {
  const totalSpend       = insights.reduce((s, r) => s + r.spend, 0);
  const totalConversions = insights.reduce((s, r) => s + r.conversions, 0);
  const totalImpressions = insights.reduce((s, r) => s + r.impressions, 0);
  const totalClicks      = insights.reduce((s, r) => s + r.clicks, 0);
  const avgCPC = totalClicks      > 0 ? totalSpend / totalClicks       : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCPA = totalConversions > 0 ? totalSpend / totalConversions   : 0;
  const avgScore = insights.length > 0 ? insights.reduce((s, r) => s + r.performance_score, 0) / insights.length : 0;

  const cards = [
    {
      label: "Total Spend",
      value: fmtUSD(totalSpend),
      sub: `${insights.length} campaigns`,
      icon: "💸",
      hint: null,
    },
    {
      label: "Conversions",
      value: fmt(totalConversions),
      sub: avgCPA > 0 ? `${fmtUSD(avgCPA)} avg CPA · aim <$10` : "No conversions tracked",
      icon: "🎯",
      hint: avgCPA > BENCHMARKS.cpa.ok ? "above target" : avgCPA > 0 ? "on target" : null,
      hintGood: avgCPA > 0 && avgCPA <= BENCHMARKS.cpa.good,
    },
    {
      label: "CTR",
      value: `${fmt(avgCTR, 2)}%`,
      sub: `${fmt(totalClicks)} total clicks · aim >2%`,
      icon: "👆",
      hint: avgCTR >= BENCHMARKS.ctr.good ? "great" : avgCTR >= BENCHMARKS.ctr.ok ? "ok" : "needs work",
      hintGood: avgCTR >= BENCHMARKS.ctr.good,
    },
    {
      label: "Avg CPC",
      value: fmtUSD(avgCPC),
      sub: `Cost per click · aim <$0.70`,
      icon: "💰",
      hint: avgCPC <= BENCHMARKS.cpc.good ? "great" : avgCPC <= BENCHMARKS.cpc.ok ? "ok" : "high",
      hintGood: avgCPC <= BENCHMARKS.cpc.good,
    },
    {
      label: "Portfolio Score",
      value: Math.round(avgScore).toString(),
      sub: `Avg across ${insights.length} campaigns`,
      icon: "📊",
      hint: avgScore >= 75 ? "healthy" : avgScore >= 55 ? "ok" : "needs work",
      hintGood: avgScore >= 75,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {cards.map((k) => (
        <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg">{k.icon}</span>
            {k.hint && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                k.hintGood ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
              }`}>
                {k.hint}
              </span>
            )}
          </div>
          <div className="text-xl font-black text-gray-900 leading-none mb-1">{k.value}</div>
          <div className="text-[10px] text-gray-400 leading-snug">{k.sub}</div>
          <div className="text-[9px] font-semibold text-gray-300 uppercase tracking-wide mt-2">{k.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Horizontal Bar Chart ────────────────────────────────────────────────────

type ChartMetric = "spend" | "conversions" | "ctr" | "cpc";

const CHART_TABS: { key: ChartMetric; label: string }[] = [
  { key: "spend",       label: "Spend ($)" },
  { key: "conversions", label: "Conversions" },
  { key: "ctr",         label: "CTR %" },
  { key: "cpc",         label: "CPC ($)" },
];

function HBarTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { fullName: string; spend: number; conversions: number; ctr: number; cpc: number; score: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 text-xs max-w-[240px]">
      <p className="font-semibold text-gray-800 mb-2 leading-tight">{d.fullName}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-6"><span className="text-gray-400">Spend</span><span className="font-bold">{fmtUSD(d.spend)}</span></div>
        <div className="flex justify-between gap-6"><span className="text-gray-400">Conversions</span><span className="font-bold">{fmt(d.conversions)}</span></div>
        <div className="flex justify-between gap-6"><span className="text-gray-400">CTR</span><span className="font-bold">{fmt(d.ctr, 2)}%</span></div>
        <div className="flex justify-between gap-6"><span className="text-gray-400">CPC</span><span className="font-bold">{fmtUSD(d.cpc)}</span></div>
      </div>
    </div>
  );
}

function TopCampaignsChart({ insights, onCampaignClick }: { insights: CampaignInsight[]; onCampaignClick: (id: string, name: string) => void }) {
  const [metric, setMetric] = useState<ChartMetric>("spend");

  const top10 = [...insights]
    .sort((a, b) => b.spend - a.spend)
    .slice(0, 10)
    .map((c) => ({
      name: shortName(c.campaign_name, 24),
      fullName: c.campaign_name,
      id: c.campaign_id,
      spend: c.spend,
      conversions: c.conversions,
      ctr: c.ctr,
      cpc: c.cpc,
      score: c.performance_score,
    }))
    .reverse(); // bottom-up so top spender appears at top

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Top Campaigns</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">Colour = performance score · click to drill in</p>
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-0.5">
          {CHART_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setMetric(t.key)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                metric === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(220, top10.length * 34)}>
        <BarChart data={top10} layout="vertical" margin={{ top: 0, right: 60, left: 0, bottom: 0 }}>
          <XAxis type="number" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={180}
            tick={{ fontSize: 11, fill: "#374151" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<HBarTooltip />} cursor={{ fill: "#f9fafb" }} />
          <Bar
            dataKey={metric}
            radius={[0, 6, 6, 0]}
            cursor="pointer"
            onClick={(d: { id: string; fullName: string }) => onCampaignClick(d.id, d.fullName)}
            label={{ position: "right", fontSize: 10, fill: "#6b7280", formatter: (v: number) =>
              metric === "spend" ? fmtUSD(v) :
              metric === "ctr"   ? `${fmt(v, 1)}%` :
              metric === "cpc"   ? fmtUSD(v) :
              fmt(v)
            }}
          >
            {top10.map((entry, idx) => (
              <Cell key={idx} fill={scoreColor(entry.score).bar} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-3">
        {[
          { color: "bg-emerald-500", label: "High performer (≥75)" },
          { color: "bg-amber-500",   label: "Average (55–74)" },
          { color: "bg-red-500",     label: "Needs attention (<55)" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
            <span className="text-[10px] text-gray-400">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CPC vs CTR Efficiency Map ────────────────────────────────────────────────

function EfficiencyMap({ insights, onCampaignClick }: { insights: CampaignInsight[]; onCampaignClick: (id: string, name: string) => void }) {
  const data = insights
    .filter((c) => c.spend > 0 && c.impressions > 0)
    .map((c) => ({ x: c.cpc, y: c.ctr, z: c.spend, name: shortName(c.campaign_name, 20), id: c.campaign_id, score: c.performance_score }));

  if (data.length < 2) return null;

  const avgCPC = data.reduce((s, d) => s + d.x, 0) / data.length;
  const avgCTR = data.reduce((s, d) => s + d.y, 0) / data.length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h4 className="text-sm font-bold text-gray-900">Efficiency Map — CPC vs CTR</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">Each bubble = one campaign. Bigger bubble = more spend.</p>
        </div>
        {/* Legend quadrants */}
        <div className="flex flex-col gap-1 text-right">
          <span className="text-[10px] text-emerald-600 font-semibold">↙ Sweet Spot</span>
          <span className="text-[10px] text-gray-400">low CPC + high CTR</span>
        </div>
      </div>

      {/* Quadrant labels */}
      <div className="relative">
        <div className="absolute inset-0 pointer-events-none z-10 flex">
          <div className="flex flex-col w-1/2">
            <div className="flex-1 flex items-start justify-start pl-14 pt-2">
              <span className="text-[9px] font-semibold text-amber-400 bg-amber-50 px-1.5 py-0.5 rounded">Expensive &amp; weak</span>
            </div>
            <div className="flex-1 flex items-end justify-start pl-14 pb-6">
              <span className="text-[9px] font-semibold text-red-400 bg-red-50 px-1.5 py-0.5 rounded">Cheap but ignored</span>
            </div>
          </div>
          <div className="flex flex-col w-1/2">
            <div className="flex-1 flex items-start justify-end pr-14 pt-2">
              <span className="text-[9px] font-semibold text-blue-400 bg-blue-50 px-1.5 py-0.5 rounded">Pricey but effective</span>
            </div>
            <div className="flex-1 flex items-end justify-end pr-14 pb-6">
              <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">✦ Sweet spot</span>
            </div>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="x" name="CPC ($)" type="number"
              tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
              label={{ value: "CPC ($) — lower is better →", position: "insideBottom", offset: -12, fontSize: 10, fill: "#9ca3af" }}
            />
            <YAxis
              dataKey="y" name="CTR (%)" type="number"
              tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={false} tickLine={false}
              label={{ value: "CTR % — higher is better ↑", angle: -90, position: "insideLeft", offset: 10, fontSize: 10, fill: "#9ca3af" }}
            />
            <ZAxis dataKey="z" range={[40, 320]} name="Spend" />
            {/* Crosshairs at averages */}
            <ReferenceLine x={avgCPC} stroke="#e5e7eb" strokeDasharray="4 2" />
            <ReferenceLine y={avgCTR} stroke="#e5e7eb" strokeDasharray="4 2" />
            <Tooltip
              cursor={false}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as { name: string; x: number; y: number; z: number };
                return (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2.5 text-xs">
                    <p className="font-semibold text-gray-800 mb-1.5 max-w-[160px]">{d.name}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">CPC</span>
                        <span className={`font-bold ${d.x <= BENCHMARKS.cpc.good ? "text-emerald-600" : d.x <= BENCHMARKS.cpc.ok ? "text-amber-500" : "text-red-500"}`}>
                          {fmtUSD(d.x)} {d.x <= BENCHMARKS.cpc.good ? "✓" : d.x > BENCHMARKS.cpc.ok ? "↑" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">CTR</span>
                        <span className={`font-bold ${d.y >= BENCHMARKS.ctr.good ? "text-emerald-600" : d.y >= BENCHMARKS.ctr.ok ? "text-amber-500" : "text-red-500"}`}>
                          {fmt(d.y, 2)}% {d.y >= BENCHMARKS.ctr.good ? "✓" : d.y < BENCHMARKS.ctr.ok ? "↓" : ""}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-400">Spend</span>
                        <span className="font-bold">{fmtUSD(d.z)}</span>
                      </div>
                    </div>
                    <p className="mt-1.5 text-[10px] text-gray-300">Click to open campaign</p>
                  </div>
                );
              }}
            />
            <Scatter
              data={data}
              cursor="pointer"
              onClick={(d: { id: string; name: string }) => onCampaignClick(d.id, d.name)}
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={scoreColor(entry.score).bar} fillOpacity={0.75} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Benchmark legend */}
      <div className="flex flex-wrap gap-4 mt-1 pt-3 border-t border-gray-50">
        <div className="text-[10px] text-gray-400">
          <span className="font-semibold text-gray-600">CPC benchmark: </span>
          <span className="text-emerald-600 font-medium">great &lt;$0.70</span>
          {" · "}
          <span className="text-amber-500 font-medium">ok $0.70–$1.20</span>
          {" · "}
          <span className="text-red-500 font-medium">high &gt;$1.20</span>
        </div>
        <div className="text-[10px] text-gray-400">
          <span className="font-semibold text-gray-600">CTR benchmark: </span>
          <span className="text-emerald-600 font-medium">great &gt;2%</span>
          {" · "}
          <span className="text-amber-500 font-medium">ok 1–2%</span>
          {" · "}
          <span className="text-red-500 font-medium">low &lt;1%</span>
        </div>
        <div className="text-[10px] text-gray-400">Dashed lines = account average</div>
      </div>
    </div>
  );
}

// ─── Sortable Campaign Table ──────────────────────────────────────────────────

// Score is rendered as a special manual column — NOT in COLUMNS array
const COLUMNS: { key: SortCol; label: string; hint: string }[] = [
  { key: "spend",       label: "Spend",  hint: "Total money spent on this campaign" },
  { key: "conversions", label: "Conv.",  hint: "Completed bookings or actions tracked by your pixel" },
  { key: "cpa",         label: "CPA",   hint: "Cost per conversion — aim for under $10" },
  { key: "ctr",         label: "CTR",   hint: "Click-through rate — aim for over 2%" },
  { key: "cpc",         label: "CPC",   hint: "Cost per click — aim for under $0.70" },
  { key: "cpm",         label: "CPM",   hint: "Cost per 1,000 impressions — measures audience efficiency" },
  { key: "reach",       label: "Reach", hint: "Unique people who saw your ad at least once" },
  { key: "impressions", label: "Impr.", hint: "Total number of times your ad was shown" },
];

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) return <span className="text-gray-300 ml-0.5">↕</span>;
  return <span className="text-red-500 ml-0.5">{dir === "desc" ? "↓" : "↑"}</span>;
}

function CampaignTable({ insights, onCampaignClick }: { insights: CampaignInsight[]; onCampaignClick: (id: string, name: string) => void }) {
  const [sortCol, setSortCol] = useState<SortCol>("spend");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [hoveredHint, setHoveredHint] = useState<string | null>(null);

  function toggleSort(col: SortCol) {
    if (sortCol === col) {
      setSortDir((d) => d === "desc" ? "asc" : "desc");
    } else {
      setSortCol(col);
      // Lower = better for these
      setSortDir(col === "cpc" || col === "cpm" || col === "cpa" ? "asc" : "desc");
    }
  }

  const filtered = insights.filter((c) =>
    c.campaign_name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const va = a[sortCol] ?? 0;
    const vb = b[sortCol] ?? 0;
    return sortDir === "desc" ? vb - va : va - vb;
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div>
          <h4 className="text-sm font-bold text-gray-900">All Campaigns</h4>
          <p className="text-[11px] text-gray-400 mt-0.5">{filtered.length} of {insights.length} · click any column to sort</p>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
          </svg>
          <input
            type="text"
            placeholder="Filter campaigns…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:bg-white focus:border-transparent w-44 transition-all"
          />
        </div>
      </div>

      {/* Hint bar */}
      {hoveredHint && (
        <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 text-[11px] text-blue-600 font-medium">
          ℹ️ {hoveredHint}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/60">
              <th className="text-left py-3 px-5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Campaign</th>
              <th className="text-center py-3 px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">What to do</th>
              <th
                className={`text-right py-3 px-3 text-[11px] font-semibold uppercase tracking-wide cursor-pointer select-none ${sortCol === "performance_score" ? "text-red-500" : "text-gray-400 hover:text-gray-600"}`}
                onClick={() => toggleSort("performance_score")}
                onMouseEnter={() => setHoveredHint("Combined performance score 0–100. Green ≥75, Yellow 55–74, Red <55.")}
                onMouseLeave={() => setHoveredHint(null)}
              >
                Score<SortIcon active={sortCol === "performance_score"} dir={sortDir} />
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className={`text-right py-3 px-3 text-[11px] font-semibold uppercase tracking-wide cursor-pointer select-none transition-colors ${
                    sortCol === col.key ? "text-red-500" : "text-gray-400 hover:text-gray-600"
                  }`}
                  onClick={() => toggleSort(col.key)}
                  onMouseEnter={() => setHoveredHint(col.hint)}
                  onMouseLeave={() => setHoveredHint(null)}
                >
                  {col.label}<SortIcon active={sortCol === col.key} dir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, idx) => {
              const sc = scoreColor(c.performance_score);
              const tip = improvementTip(c);
              return (
                <tr
                  key={c.campaign_id}
                  className={`border-b border-gray-50 hover:bg-gray-50/80 cursor-pointer transition-colors ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}
                  onClick={() => onCampaignClick(c.campaign_id, c.campaign_name)}
                >
                  {/* Campaign name */}
                  <td className="py-3 px-5 max-w-[280px]">
                    <div className="flex items-start gap-2">
                      <span className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${sc.dot}`} />
                      <div>
                        <div className="font-medium text-gray-800 truncate max-w-[250px]" title={c.campaign_name}>
                          {shortName(c.campaign_name, 38)}
                        </div>
                        <div className="text-gray-400 mt-0.5">{fmt(c.impressions)} impr · {fmt(c.clicks)} clicks</div>
                      </div>
                    </div>
                  </td>
                  {/* Improvement tip */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className={`text-[10px] font-medium ${tip.color}`}>{tip.text}</span>
                  </td>
                  {/* Score */}
                  <td className="py-3 px-3 text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold border ${sc.bg} ${sc.border} ${sc.text}`}>
                      {c.performance_score}
                    </span>
                  </td>
                  {/* Spend */}
                  <td className="py-3 px-3 text-right font-semibold text-gray-900">{fmtUSD(c.spend)}</td>
                  {/* Conv */}
                  <td className="py-3 px-3 text-right font-semibold text-emerald-600">{c.conversions > 0 ? fmt(c.conversions) : <span className="text-gray-300">—</span>}</td>
                  {/* CPA */}
                  <td className={`py-3 px-3 text-right font-medium ${c.cpa > 0 && c.cpa > BENCHMARKS.cpa.ok ? "text-red-400" : c.cpa > 0 && c.cpa <= BENCHMARKS.cpa.good ? "text-emerald-600" : "text-gray-500"}`}>
                    {c.cpa > 0 ? fmtUSD(c.cpa) : <span className="text-gray-300">—</span>}
                  </td>
                  {/* CTR */}
                  <td className={`py-3 px-3 text-right font-medium ${c.ctr >= BENCHMARKS.ctr.good ? "text-emerald-600" : c.ctr >= BENCHMARKS.ctr.ok ? "text-amber-500" : "text-red-400"}`}>
                    {c.ctr > 0 ? `${fmt(c.ctr, 2)}%` : <span className="text-gray-300">—</span>}
                  </td>
                  {/* CPC */}
                  <td className={`py-3 px-3 text-right font-medium ${c.cpc <= BENCHMARKS.cpc.good ? "text-emerald-600" : c.cpc <= BENCHMARKS.cpc.ok ? "text-amber-500" : "text-red-400"}`}>
                    {c.cpc > 0 ? fmtUSD(c.cpc) : <span className="text-gray-300">—</span>}
                  </td>
                  {/* CPM */}
                  <td className="py-3 px-3 text-right text-gray-500">{c.cpm > 0 ? fmtUSD(c.cpm) : <span className="text-gray-300">—</span>}</td>
                  {/* Reach */}
                  <td className="py-3 px-3 text-right text-gray-500">{fmt(c.reach)}</td>
                  {/* Impressions */}
                  <td className="py-3 px-3 text-right text-gray-400">{fmt(c.impressions)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {sorted.length === 0 && (
          <div className="py-10 text-center text-sm text-gray-400">No campaigns match &ldquo;{search}&rdquo;</div>
        )}
      </div>
    </div>
  );
}

// ─── Date Controls ────────────────────────────────────────────────────────────

function DateControls({ datePreset, setDatePreset, customSince, setCustomSince, customUntil, setCustomUntil, onApply }: {
  datePreset: DatePreset;
  setDatePreset: (v: DatePreset) => void;
  customSince: string;
  setCustomSince: (v: string) => void;
  customUntil: string;
  setCustomUntil: (v: string) => void;
  onApply: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex bg-gray-100 rounded-xl p-0.5">
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setDatePreset(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              datePreset === opt.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {datePreset === "custom" && (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
          <input type="date" value={customSince} onChange={(e) => setCustomSince(e.target.value)}
            className="text-xs border-none outline-none bg-transparent text-gray-700" />
          <span className="text-xs text-gray-300">→</span>
          <input type="date" value={customUntil} onChange={(e) => setCustomUntil(e.target.value)}
            className="text-xs border-none outline-none bg-transparent text-gray-700" />
          <button onClick={onApply}
            className="ml-1 px-2.5 py-1 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-700 transition-colors">
            Apply
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface Props {
  token: string;
  clientId: string;
  onCampaignClick: (id: string, name: string) => void;
}

export default function CampaignAnalyticsTab({ token, clientId, onCampaignClick }: Props) {
  const [insights,      setInsights]     = useState<CampaignInsight[]>([]);
  const [loading,       setLoading]      = useState(false);
  const [error,         setError]        = useState<string | null>(null);
  const [datePreset,    setDatePreset]   = useState<DatePreset>("last_30d");
  const [customSince,   setCustomSince]  = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); });
  const [customUntil,   setCustomUntil]  = useState(() => new Date().toISOString().slice(0, 10));
  const [customApplied, setCustomApplied] = useState(false);

  useEffect(() => {
    if (!token || !clientId) return;
    if (datePreset === "custom" && !customApplied) return;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ client_id: clientId, date_preset: datePreset });
    if (datePreset === "custom") { params.set("since", customSince); params.set("until", customUntil); }
    fetch(`/api/meta/insights?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((json: { data?: CampaignInsight[]; error?: string }) => {
        if (json.error) setError(json.error);
        else setInsights(json.data ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => { setLoading(false); setCustomApplied(false); });
  }, [token, clientId, datePreset, customApplied]);

  const dateBar = (
    <DateControls
      datePreset={datePreset}
      setDatePreset={(v) => { setDatePreset(v); setCustomApplied(false); }}
      customSince={customSince}
      setCustomSince={setCustomSince}
      customUntil={customUntil}
      setCustomUntil={setCustomUntil}
      onApply={() => setCustomApplied(true)}
    />
  );

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="h-5 w-40 bg-gray-100 rounded-lg animate-pulse" />
          {dateBar}
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`h-${i === 0 ? "24" : "40"} bg-gray-100 rounded-2xl animate-pulse`} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">{dateBar}</div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
          <div className="font-semibold mb-1">⚠️ Could not load campaign insights</div>
          <p className="text-xs">{error}</p>
          <p className="mt-2 text-xs text-amber-600">Token needs <code>ads_read</code> permission on this ad account.</p>
        </div>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900">Campaign Performance</h3>
          {dateBar}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center text-gray-400 text-sm">
          No campaign data found for this period.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-gray-900">Campaign Performance</h3>
        {dateBar}
      </div>

      {/* KPI summary */}
      <KpiCards insights={insights} />

      {/* Bar chart */}
      <TopCampaignsChart insights={insights} onCampaignClick={onCampaignClick} />

      {/* Efficiency map */}
      <EfficiencyMap insights={insights} onCampaignClick={onCampaignClick} />

      {/* Full table */}
      <CampaignTable insights={insights} onCampaignClick={onCampaignClick} />
    </div>
  );
}
