"use client";

import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ScatterChart, Scatter, ZAxis, Legend, Cell,
} from "recharts";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

type SortKey = "spend" | "conversions" | "ctr" | "cpc" | "cpm" | "performance_score";
type DatePreset = "today" | "last_7d" | "last_14d" | "last_30d" | "last_month" | "last_quarter" | "last_year" | "custom";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATE_OPTIONS: { label: string; value: DatePreset }[] = [
  { label: "Today",      value: "today" },
  { label: "7 days",     value: "last_7d" },
  { label: "30 days",    value: "last_30d" },
  { label: "Last month", value: "last_month" },
  { label: "Quarter",    value: "last_quarter" },
  { label: "12 months",  value: "last_year" },
  { label: "Custom",     value: "custom" },
];

function scoreColor(score: number): string {
  if (score >= 75) return "text-green-600";
  if (score >= 55) return "text-yellow-600";
  return "text-red-500";
}

function scoreBg(score: number): string {
  if (score >= 75) return "bg-green-50 border-green-200";
  if (score >= 55) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

function scoreBadge(score: number): string {
  if (score >= 75) return "🟢";
  if (score >= 55) return "🟡";
  return "🔴";
}

function fmt(n: number, dec = 0) {
  return n.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtUSD(n: number) { return `$${fmt(n, 2)}`; }
function shortName(name: string, max = 22): string {
  // Strip common prefixes like "CAPI | MIAMI | COLD |" to show just the key part
  const cleaned = name.replace(/^(CAPI|SHIFT ARCADE)\s*\|\s*/i, "")
    .replace(/\s*\|\s*(Feeds?\s*\+\s*Stories?|Feed|Stories?|COLD|WARM|RETARGETING)/gi, "")
    .trim();
  return cleaned.length > max ? cleaned.slice(0, max) + "…" : cleaned;
}

// Custom tooltip for bar chart
function CustomBarTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-gray-800 mb-1 max-w-[200px]">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="text-gray-500">{p.name}</span>
          <span className="font-bold text-gray-900">
            {p.name.includes("Spend") || p.name.includes("CPC") || p.name.includes("CPM") || p.name.includes("CPA")
              ? fmtUSD(p.value)
              : p.name.includes("CTR")
              ? `${fmt(p.value, 2)}%`
              : fmt(p.value, p.value < 10 ? 2 : 0)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Summary Row
// ---------------------------------------------------------------------------

function KpiRow({ insights }: { insights: CampaignInsight[] }) {
  const totalSpend = insights.reduce((s, r) => s + r.spend, 0);
  const totalConversions = insights.reduce((s, r) => s + r.conversions, 0);
  const totalImpressions = insights.reduce((s, r) => s + r.impressions, 0);
  const totalClicks = insights.reduce((s, r) => s + r.clicks, 0);
  const avgCPC = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const avgCPA = totalConversions > 0 ? totalSpend / totalConversions : 0;

  const kpis = [
    { label: "Total Spend", value: fmtUSD(totalSpend), sub: `${insights.length} campaigns` },
    { label: "Conversions", value: fmt(totalConversions), sub: `$${fmt(avgCPA, 2)} avg CPA` },
    { label: "Impressions", value: fmt(totalImpressions), sub: `${fmt(totalClicks)} clicks` },
    { label: "Avg CTR", value: `${fmt(avgCTR, 2)}%`, sub: `$${fmt(avgCPC, 2)} CPC` },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {kpis.map((k) => (
        <div key={k.label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm">
          <div className="text-xs text-gray-500 mb-0.5">{k.label}</div>
          <div className="text-xl font-black text-gray-900">{k.value}</div>
          <div className="text-xs text-gray-400">{k.sub}</div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface Props {
  token: string;
  clientId: string;
  onCampaignClick: (id: string, name: string) => void;
}

export default function CampaignAnalyticsTab({ token, clientId, onCampaignClick }: Props) {
  const [insights, setInsights] = useState<CampaignInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>("last_30d");
  const [customSince, setCustomSince] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate() - 30);
    return d.toISOString().slice(0, 10);
  });
  const [customUntil, setCustomUntil] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [customApplied, setCustomApplied] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("spend");
  const [chartMetric, setChartMetric] = useState<"spend" | "conversions" | "ctr" | "cpc">("spend");

  useEffect(() => {
    if (!token || !clientId) return;
    if (datePreset === "custom" && !customApplied) return; // wait for user to click Apply
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ client_id: clientId, date_preset: datePreset });
    if (datePreset === "custom") {
      params.set("since", customSince);
      params.set("until", customUntil);
    }
    fetch(`/api/meta/insights?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json: { data?: CampaignInsight[]; error?: string }) => {
        if (json.error) setError(json.error);
        else setInsights(json.data ?? []);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => { setLoading(false); setCustomApplied(false); });
  }, [token, clientId, datePreset, customApplied]);

  const sorted = [...insights].sort((a, b) => {
    if (sortKey === "cpc" || sortKey === "cpm") return a[sortKey] - b[sortKey]; // lower = better
    return b[sortKey] - a[sortKey]; // higher = better
  });

  const top10 = sorted.slice(0, 10);

  const chartData = top10.map((c) => ({
    name: shortName(c.campaign_name, 18),
    fullName: c.campaign_name,
    id: c.campaign_id,
    spend: c.spend,
    conversions: c.conversions,
    ctr: c.ctr,
    cpc: c.cpc,
    score: c.performance_score,
  }));

  const metricLabel: Record<string, string> = {
    spend: "Spend ($)", conversions: "Conversions", ctr: "CTR (%)", cpc: "CPC ($)",
  };

  // Scatter data: CPC vs CTR, bubble = spend
  const scatterData = insights
    .filter((c) => c.spend > 0 && c.impressions > 0)
    .map((c) => ({ x: c.cpc, y: c.ctr, z: c.spend, name: shortName(c.campaign_name), id: c.campaign_id }));

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
        <div className="font-semibold mb-1">⚠️ Could not load campaign insights</div>
        <p>{error}</p>
        <p className="mt-2 text-xs text-amber-600">The access token needs <code>ads_read</code> permission and access to this ad account&apos;s insights.</p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-400 text-sm">
        No campaign data found for this period.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-gray-900">Campaign Performance Comparison</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {DATE_OPTIONS.map((opt, i) => (
              <button
                key={opt.value}
                onClick={() => { setDatePreset(opt.value); setCustomApplied(false); }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  datePreset === opt.value ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50"
                } ${i > 0 ? "border-l border-gray-200" : ""}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {datePreset === "custom" && (
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm">
              <input
                type="date"
                value={customSince}
                onChange={(e) => setCustomSince(e.target.value)}
                className="text-xs border-none outline-none bg-transparent text-gray-700"
              />
              <span className="text-xs text-gray-400">→</span>
              <input
                type="date"
                value={customUntil}
                onChange={(e) => setCustomUntil(e.target.value)}
                className="text-xs border-none outline-none bg-transparent text-gray-700"
              />
              <button
                onClick={() => setCustomApplied(true)}
                className="ml-1 px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Apply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* KPI row */}
      <KpiRow insights={insights} />

      {/* Bar chart */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold text-gray-700">Top 10 Campaigns</h4>
          <div className="flex gap-1">
            {(["spend", "conversions", "ctr", "cpc"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setChartMetric(m)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                  chartMetric === m
                    ? "bg-red-100 text-red-700"
                    : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                {metricLabel[m]}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: "#6b7280" }}
              angle={-35}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} />
            <Tooltip content={<CustomBarTooltip />} />
            <Bar
              dataKey={chartMetric}
              name={metricLabel[chartMetric]}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(d: { id: string; fullName: string }) => onCampaignClick(d.id, d.fullName)}
            >
              {chartData.map((entry, idx) => (
                <Cell
                  key={idx}
                  fill={entry.score >= 75 ? "#16a34a" : entry.score >= 55 ? "#d97706" : "#dc2626"}
                  fillOpacity={0.85}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-xs text-gray-400 mt-1 text-center">
          🟢 High performer · 🟡 Average · 🔴 Needs attention — Click a bar to drill into that campaign
        </p>
      </div>

      {/* CPC vs CTR scatter */}
      {scatterData.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-1">CPC vs CTR — Efficiency Map</h4>
          <p className="text-xs text-gray-400 mb-3">Bottom-right = ideal (high CTR, low CPC). Bubble size = spend.</p>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="x" name="CPC ($)" tick={{ fontSize: 10 }} label={{ value: "CPC ($)", position: "insideBottom", offset: -2, fontSize: 10 }} />
              <YAxis dataKey="y" name="CTR (%)" tick={{ fontSize: 10 }} label={{ value: "CTR (%)", angle: -90, position: "insideLeft", fontSize: 10 }} />
              <ZAxis dataKey="z" range={[40, 300]} name="Spend ($)" />
              <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const d = payload[0]?.payload as { name: string; x: number; y: number; z: number };
                return (
                  <div className="bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-xs">
                    <p className="font-semibold max-w-[160px]">{d.name}</p>
                    <p>CPC: ${d.x.toFixed(2)}</p>
                    <p>CTR: {d.y.toFixed(2)}%</p>
                    <p>Spend: ${d.z.toFixed(2)}</p>
                  </div>
                );
              }} />
              <Scatter
                data={scatterData}
                fill="#dc2626"
                fillOpacity={0.7}
                onClick={(d: { id: string; name: string }) => onCampaignClick(d.id, d.name)}
                cursor="pointer"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Full sortable table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h4 className="text-sm font-semibold text-gray-700">All Campaigns ({insights.length})</h4>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            Sort by:
            {(["spend", "conversions", "ctr", "cpc", "performance_score"] as SortKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setSortKey(k)}
                className={`px-2 py-1 rounded-md transition-colors ${sortKey === k ? "bg-red-50 text-red-600 font-medium" : "hover:bg-gray-50"}`}
              >
                {k === "performance_score" ? "Score" : k.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50 text-gray-500 uppercase tracking-wide">
                <th className="text-left py-2.5 px-4 font-medium">Campaign</th>
                <th className="text-right py-2.5 px-3 font-medium">Score</th>
                <th className="text-right py-2.5 px-3 font-medium">Spend</th>
                <th className="text-right py-2.5 px-3 font-medium">Conversions</th>
                <th className="text-right py-2.5 px-3 font-medium">CPA</th>
                <th className="text-right py-2.5 px-3 font-medium">CTR</th>
                <th className="text-right py-2.5 px-3 font-medium">CPC</th>
                <th className="text-right py-2.5 px-3 font-medium">CPM</th>
                <th className="text-right py-2.5 px-3 font-medium">Reach</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr
                  key={c.campaign_id}
                  className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => onCampaignClick(c.campaign_id, c.campaign_name)}
                >
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-gray-800 max-w-[280px] truncate" title={c.campaign_name}>
                      {c.campaign_name}
                    </div>
                    <div className="text-gray-400">{c.impressions.toLocaleString()} impr · {c.clicks.toLocaleString()} clicks</div>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs font-bold ${scoreBg(c.performance_score)} ${scoreColor(c.performance_score)}`}>
                      {scoreBadge(c.performance_score)} {c.performance_score}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-semibold text-gray-900">{fmtUSD(c.spend)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-green-700">{fmt(c.conversions)}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{c.cpa > 0 ? fmtUSD(c.cpa) : "—"}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{c.ctr > 0 ? `${fmt(c.ctr, 2)}%` : "—"}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{c.cpc > 0 ? fmtUSD(c.cpc) : "—"}</td>
                  <td className="py-2.5 px-3 text-right text-gray-600">{c.cpm > 0 ? fmtUSD(c.cpm) : "—"}</td>
                  <td className="py-2.5 px-3 text-right text-gray-500">{fmt(c.reach)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
