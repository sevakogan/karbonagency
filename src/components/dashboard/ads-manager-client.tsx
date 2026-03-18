"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { SHIFT_ARCADE_DRAFT_CAMPAIGNS } from "@/lib/meta-api-write";
import type {
  MetaCampaign,
  MetaAdSet,
  MetaCustomAudience,
  ShiftArcadeDraftCampaign,
} from "@/lib/meta-api-write";
import AdPreviewTab from "@/components/dashboard/ad-preview-tab";
import { AiAssistantTab, FloatingChatBubble } from "@/components/dashboard/meta-chat-widget";
import CompetitorsTab from "@/components/dashboard/competitors-tab";
import CampaignAnalyticsTab from "@/components/dashboard/campaign-analytics-tab";
import CampaignDetailPanel from "@/components/dashboard/campaign-detail-panel";
import DraftEditor from "@/components/dashboard/draft-editor";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = "campaigns" | "analytics" | "drafts" | "audiences" | "adsets" | "guide" | "previews" | "ai_assistant" | "competitors";

interface ApiError {
  error: string;
}

interface LoadState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useMetaApi<T>(
  endpoint: string,
  token: string | null,
  clientId: string | null
): LoadState<T> & { refetch: () => void } {
  const [state, setState] = useState<LoadState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetch_ = useCallback(() => {
    if (!token || !clientId) return;
    setState((s) => ({ ...s, loading: true, error: null }));

    fetch(`${endpoint}?client_id=${clientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        const json = (await res.json()) as { data: T } | ApiError;
        if ("error" in json) {
          setState({ data: null, loading: false, error: json.error });
        } else {
          setState({ data: json.data, loading: false, error: null });
        }
      })
      .catch((err: Error) => {
        setState({ data: null, loading: false, error: err.message });
      });
  }, [endpoint, token, clientId]);

  useEffect(() => {
    fetch_();
  }, [fetch_]);

  return { ...state, refetch: fetch_ };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(n: number | string | undefined, decimals = 0): string {
  if (n === undefined || n === null || n === "") return "—";
  const num = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(num)) return "—";
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function fmtBudget(cents: string | undefined): string {
  if (!cents) return "—";
  return `$${fmt(parseFloat(cents) / 100, 2)}/day`;
}

function statusColor(status: string): string {
  switch (status) {
    case "ACTIVE": return "bg-green-100 text-green-800";
    case "PAUSED": return "bg-yellow-100 text-yellow-800";
    case "DELETED": return "bg-red-100 text-red-800";
    case "ARCHIVED": return "bg-gray-100 text-gray-600";
    default: return "bg-gray-100 text-gray-600";
  }
}

function objectiveLabel(obj: string): string {
  const map: Record<string, string> = {
    OUTCOME_SALES: "Conversions",
    OUTCOME_LEADS: "Leads",
    OUTCOME_TRAFFIC: "Traffic",
    OUTCOME_AWARENESS: "Awareness",
    OUTCOME_ENGAGEMENT: "Engagement",
    OUTCOME_APP_PROMOTION: "App Installs",
  };
  return map[obj] ?? obj;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
        active
          ? "bg-white border border-gray-200 border-b-white text-gray-900"
          : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColor(status)}`}>
      {status}
    </span>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <span className="ml-3 text-sm text-gray-500">Loading from Meta API…</span>
    </div>
  );
}

function EmptyState({ message, icon = "📋" }: { message: string; icon?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <span className="text-4xl mb-3">{icon}</span>
      <p className="text-gray-500 text-sm max-w-sm">{message}</p>
    </div>
  );
}

function ErrorAlert({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
      <span className="text-red-500 text-lg">⚠️</span>
      <div className="flex-1">
        <p className="text-sm text-red-700">{message}</p>
      </div>
      <button onClick={onDismiss} className="text-red-400 hover:text-red-600">×</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Learning Phase Bar
// ---------------------------------------------------------------------------

function LearningPhaseBar({ effectiveStatus }: { effectiveStatus?: string }) {
  const isLearning = effectiveStatus === "LEARNING" || effectiveStatus === "LEARNING_LIMITED";
  const isLimited = effectiveStatus === "LEARNING_LIMITED";
  const isGraduated = effectiveStatus === "ACTIVE" || effectiveStatus === "ACTIVE_LIMITED";

  if (!effectiveStatus || effectiveStatus === "PAUSED" || effectiveStatus === "DELETED" || effectiveStatus === "ARCHIVED") {
    return null;
  }

  return (
    <div className="mt-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className={`text-xs font-medium ${isLearning ? (isLimited ? "text-orange-600" : "text-yellow-700") : "text-green-600"}`}>
          {isLimited ? "⚡ Learning Limited" : isLearning ? "🎓 Learning Phase" : "✅ Graduated"}
        </span>
        {isLearning && (
          <span className="text-xs text-gray-400">Don't pause!</span>
        )}
      </div>
      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
        {isLearning ? (
          <div
            className={`h-full rounded-full animate-pulse ${isLimited ? "bg-orange-400 w-2/3" : "bg-yellow-400 w-1/2"}`}
            style={{ animation: "learningSlide 2s ease-in-out infinite" }}
          />
        ) : (
          <div className="h-full w-full bg-green-500 rounded-full" />
        )}
      </div>
      <style>{`
        @keyframes learningSlide {
          0% { width: 20%; }
          50% { width: 70%; }
          100% { width: 20%; }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// CAPI Strength Widget
// ---------------------------------------------------------------------------

interface CapiHealthData {
  score: number;
  maxScore?: number;
  label?: string;
  score_label?: string;
  pixel_id?: string | null;
  pixel_name?: string;
  last_fired?: string | null;
  owner_business?: string | null;
  period?: string;
  total_events_found?: number;
  api_note?: string | null;
  diag_error?: string | null;
  stats_error?: string | null;
  events?: Array<{ name: string; browser: boolean; server: boolean }>;
  breakdown?: Array<{ event: string; browser: number; server: number; redundancy: number; status: string }>;
  recommendations: string[];
}

function CapiStrengthWidget({ token, clientId }: { token: string; clientId: string }) {
  const [health, setHealth] = useState<CapiHealthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/meta/pixel-health?client_id=${clientId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json: { data?: CapiHealthData }) => {
        if (json.data) setHealth(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, clientId]);

  const score = health?.score ?? 0;
  const maxScore = health?.maxScore ?? 10;
  const pct = (score / maxScore) * 100;
  const scoreColor = score >= 8 ? "text-green-600" : score >= 5 ? "text-yellow-600" : "text-red-600";
  const barColor = score >= 8 ? "bg-green-500" : score >= 5 ? "bg-yellow-400" : "bg-red-400";
  const scoreLabel = health?.score_label ?? health?.label ?? (score === 0 ? "Not configured" : "");

  // Normalize breakdown → events array for display
  const eventRows = health?.breakdown?.map((b) => ({
    name: b.event,
    browser: b.browser > 0,
    server: b.server > 0,
  })) ?? health?.events ?? [];

  const noPixel = health && !health.pixel_id;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">📡</span>
          <div>
            <div className="text-xs font-semibold text-gray-700">CAPI Strength</div>
            <div className="text-xs text-gray-400">
              {health?.pixel_name ?? "Pixel + Server-Side Events"}
            </div>
          </div>
        </div>
        <div className="text-right">
          {loading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          ) : (
            <span className={`text-2xl font-bold ${scoreColor}`}>
              {score}<span className="text-sm text-gray-400">/{maxScore}</span>
            </span>
          )}
        </div>
      </div>

      {!loading && health && (
        <>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden mb-1">
            <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs font-medium ${scoreColor}`}>{scoreLabel}</span>
            {!noPixel && (
              <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline">
                {expanded ? "Less ↑" : "Details ↓"}
              </button>
            )}
          </div>

          {noPixel && (
            <p className="text-xs text-orange-600 mt-1.5 bg-orange-50 rounded px-2 py-1">
              ⚠️ No Pixel ID configured. Run the Supabase SQL to add pixel ID <strong>1165380555705221</strong>.
            </p>
          )}

          {/* API permission / diagnostic note */}
          {!noPixel && health.api_note && (
            <p className="text-xs text-amber-700 mt-1.5 bg-amber-50 border border-amber-200 rounded px-2 py-1.5 leading-relaxed">
              {health.api_note}
            </p>
          )}

          {/* Period label */}
          {!noPixel && !health.api_note && (
            <p className="text-[10px] text-gray-400 mt-1">
              Scanning last 180 days · {health.total_events_found ?? 0} events found
            </p>
          )}

          {expanded && !noPixel && (
            <div className="mt-3 space-y-2">
              {eventRows.length > 0 && (
                <>
                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div className="text-xs text-gray-400">Event</div>
                    <div className="text-xs text-gray-400">Browser</div>
                    <div className="text-xs text-gray-400">Server (CAPI)</div>
                  </div>
                  {eventRows.map((ev) => (
                    <div key={ev.name} className="grid grid-cols-3 gap-1 text-center text-xs">
                      <div className="text-gray-600 truncate">{ev.name}</div>
                      <div>{ev.browser ? "✅" : "❌"}</div>
                      <div>{ev.server ? "✅" : "❌"}</div>
                    </div>
                  ))}
                </>
              )}
              {health.recommendations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="text-xs font-medium text-gray-700 mb-1">How to reach 10/10:</div>
                  {health.recommendations.slice(0, 3).map((r, i) => (
                    <div key={i} className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1 mb-1">
                      {r.replace(/\*\*/g, "")}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!loading && !health && (
        <p className="text-xs text-orange-600 mt-1 bg-orange-50 rounded px-2 py-1">
          ⚠️ Run this SQL in Supabase to activate:<br />
          <code className="font-mono text-xs">ALTER TABLE clients ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT;<br />
          UPDATE clients SET meta_pixel_id = &apos;1165380555705221&apos; WHERE meta_ad_account_id IN (&apos;1957083288453810&apos;, &apos;act_1957083288453810&apos;);</code>
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Per-campaign CAPI event mapping
// ---------------------------------------------------------------------------

function objectiveToEvent(objective: string): string {
  const map: Record<string, string> = {
    OUTCOME_SALES: "Purchase",
    OUTCOME_LEADS: "Lead",
    OUTCOME_TRAFFIC: "PageView",
    OUTCOME_AWARENESS: "PageView",
    OUTCOME_ENGAGEMENT: "ViewContent",
    OUTCOME_APP_PROMOTION: "Purchase",
  };
  return map[objective] ?? "Purchase";
}

function CampaignCapiBadge({
  objective,
  pixelHealth,
}: {
  objective: string;
  pixelHealth: CapiHealthData | null;
}) {
  if (!pixelHealth) return null;
  const eventName = objectiveToEvent(objective);

  // Support both breakdown (API format) and events (legacy format)
  const br = pixelHealth.breakdown?.find((b) => b.event === eventName);
  const ev = pixelHealth.events?.find((e) => e.name === eventName);

  const hasServer = br ? br.server > 0 : (ev?.server ?? false);
  const hasBrowser = br ? br.browser > 0 : (ev?.browser ?? false);

  if (!br && !ev) return null;

  if (hasServer && hasBrowser) {
    return (
      <span className="ml-2 inline-flex items-center gap-0.5 text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded" title={`CAPI: ${eventName} tracked browser + server`}>
        📡 CAPI ✅
      </span>
    );
  }
  if (hasBrowser && !hasServer) {
    return (
      <span className="ml-2 inline-flex items-center gap-0.5 text-xs bg-orange-50 text-orange-700 border border-orange-200 px-1.5 py-0.5 rounded" title={`CAPI: ${eventName} browser only — add server-side`}>
        📡 Browser only ⚠️
      </span>
    );
  }
  return (
    <span className="ml-2 inline-flex items-center gap-0.5 text-xs bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded" title={`CAPI: ${eventName} not tracked`}>
      📡 No tracking ❌
    </span>
  );
}

// ---------------------------------------------------------------------------
// Campaign Row
// ---------------------------------------------------------------------------

function CampaignRow({
  campaign,
  token,
  clientId,
  onToggle,
  pixelHealth,
  onViewDetail,
}: {
  campaign: MetaCampaign;
  token: string;
  clientId: string;
  onToggle: () => void;
  pixelHealth: CapiHealthData | null;
  onViewDetail?: () => void;
}) {
  const [toggling, setToggling] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isActive = campaign.status === "ACTIVE" || campaign.effective_status === "ACTIVE";

  async function handleToggle() {
    setToggling(true);
    const newStatus = isActive ? "PAUSED" : "ACTIVE";

    try {
      const res = await fetch(
        `/api/meta/campaigns?client_id=${clientId}&campaign_id=${campaign.id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "toggle", status: newStatus }),
        }
      );
      const json = (await res.json()) as { data?: unknown; error?: string };

      if (json.error) {
        setToastMsg(`Error: ${json.error}`);
      } else {
        setToastMsg(`Campaign ${newStatus === "ACTIVE" ? "activated" : "paused"}`);
        onToggle();
      }
    } catch (err) {
      setToastMsg(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setToggling(false);
      setTimeout(() => setToastMsg(null), 3000);
    }
  }

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="py-3 px-4">
        <div className="flex items-center gap-1 flex-wrap">
          <div className="font-medium text-sm text-gray-900 max-w-xs truncate" title={campaign.name}>
            {campaign.name}
          </div>
          <CampaignCapiBadge objective={campaign.objective} pixelHealth={pixelHealth} />
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{campaign.id}</div>
        <LearningPhaseBar effectiveStatus={campaign.effective_status} />
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={campaign.status} />
        {toastMsg && (
          <span className="ml-2 text-xs text-blue-600">{toastMsg}</span>
        )}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {objectiveLabel(campaign.objective)}
      </td>
      <td className="py-3 px-4 text-sm text-gray-600">
        {campaign.daily_budget
          ? fmtBudget(campaign.daily_budget)
          : campaign.lifetime_budget
          ? `$${fmt(parseFloat(campaign.lifetime_budget) / 100, 2)} lifetime`
          : "—"}
      </td>
      <td className="py-3 px-4 text-sm text-gray-400">
        {campaign.created_time ? new Date(campaign.created_time).toLocaleDateString() : "—"}
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggle}
            disabled={toggling || campaign.status === "DELETED"}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 ${
              isActive ? "bg-green-500" : "bg-gray-300"
            }`}
            title={isActive ? "Click to pause" : "Click to activate"}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                isActive ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          {onViewDetail && (
            <button
              onClick={onViewDetail}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline whitespace-nowrap"
              title="View ad sets, creatives & details"
            >
              Details →
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Draft Card
// ---------------------------------------------------------------------------

function DraftCard({
  draft,
  token,
  clientId,
  onLaunch,
  onEdit,
}: {
  draft: ShiftArcadeDraftCampaign;
  token: string;
  clientId: string;
  onLaunch: (campaignId: string, adSetId: string) => void;
  onEdit?: () => void;
}) {
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const priorityColors = ["", "bg-yellow-400", "bg-blue-500", "bg-purple-500", "bg-orange-400", "bg-teal-500"];

  async function handleLaunchDraft() {
    if (!confirm(`Push "${draft.name}" to Meta as a PAUSED draft?\n\nNothing will run — it stays PAUSED until you manually activate it in Meta Ads Manager or toggle it here.`)) {
      return;
    }

    setLaunching(true);
    setLaunchError(null);

    try {
      const res = await fetch(`/api/meta/drafts?client_id=${clientId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ draft_id: draft.id }),
      });

      const json = (await res.json()) as {
        data?: { campaign_id: string; adset_id: string };
        error?: string;
        message?: string;
      };

      if (json.error) {
        setLaunchError(json.error);
      } else if (json.data) {
        setLaunched(true);
        onLaunch(json.data.campaign_id, json.data.adset_id);
      }
    } catch (err) {
      setLaunchError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLaunching(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      {/* Priority ribbon */}
      <div className={`h-1.5 rounded-t-xl ${priorityColors[draft.priority] ?? "bg-gray-300"}`} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                Priority #{draft.priority}
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {draft.estimatedCPP}/purchase est.
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">
              {draft.name}
            </h3>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              {draft.description}
            </p>
          </div>

          {/* Budget pill */}
          <div className="flex-shrink-0 text-right">
            <div className="text-lg font-bold text-gray-900">
              ${(draft.campaign.daily_budget ?? 0) / 100}/day
            </div>
            <div className="text-xs text-gray-400">
              {draft.estimatedReach.split("/")[0]}/wk reach
            </div>
          </div>
        </div>

        {/* Key stats row */}
        <div className="flex gap-4 mt-3 py-3 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-400">Objective</div>
            <div className="text-sm font-medium">{objectiveLabel(draft.campaign.objective)}</div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Status</div>
            <div className="text-sm font-medium">
              <StatusBadge status="PAUSED" />
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-400">Bid Strategy</div>
            <div className="text-sm font-medium">
              {draft.campaign.bid_strategy?.replace("LOWEST_COST_", "").replace("_", " ") ?? "Auto"}
            </div>
          </div>
        </div>

        {/* Creative spec preview */}
        <div className="mt-3 bg-blue-50 rounded-lg p-3 border border-blue-100">
          <div className="text-xs font-semibold text-blue-700 mb-1">💡 {draft.creativeSpec.creativeConceptTitle}</div>
          <div className="text-xs text-blue-600 font-medium">&ldquo;{draft.creativeSpec.headline}&rdquo;</div>
          <div className="text-xs text-blue-500 mt-1 line-clamp-2">{draft.creativeSpec.primaryText}</div>
          <div className="mt-1.5 flex gap-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              CTA: {draft.creativeSpec.callToAction.replace("_", " ")}
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              UTM tracked ✓
            </span>
          </div>
        </div>

        {/* Expandable notes */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="mt-3 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
        >
          {showDetails ? "▲" : "▼"} {showDetails ? "Hide" : "Show"} strategy notes
        </button>

        {showDetails && (
          <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="font-medium text-gray-700 mb-1">📋 Strategy Notes</div>
            <p>{draft.notes}</p>
            <div className="mt-2 font-medium text-gray-700">🎬 Creative Direction</div>
            <p className="mt-0.5">{draft.creativeSpec.creativeConceptScript}</p>
            <div className="mt-2 font-medium text-gray-700">🔗 Link</div>
            <p className="mt-0.5 text-blue-600 break-all">{draft.creativeSpec.linkUrl}</p>
          </div>
        )}

        {/* Error */}
        {launchError && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
            {launchError}
          </div>
        )}

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex-shrink-0 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              ✏️ Edit
            </button>
          )}
          {launched ? (
            <div className="flex-1 flex items-center gap-2 text-green-600 text-sm font-medium">
              <span>✅</span>
              <span>Pushed to Meta as PAUSED draft! Check Campaigns tab.</span>
            </div>
          ) : (
            <button
              onClick={handleLaunchDraft}
              disabled={launching}
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {launching ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Creating in Meta…
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Push to Meta (stays PAUSED)
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Audiences Tab
// ---------------------------------------------------------------------------

function AudiencesTab({
  token,
  clientId,
}: {
  token: string;
  clientId: string;
}) {
  const { data: audiences, loading, error, refetch } = useMetaApi<MetaCustomAudience[]>(
    "/api/meta/audiences",
    token,
    clientId
  );

  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState<{
    type: "website" | "engagement" | "lookalike";
    name: string;
    retention_days: string;
  }>({ type: "website", name: "", retention_days: "30" });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);
  const [aiRecommending, setAiRecommending] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null);

  async function handleAiRecommend() {
    setAiRecommending(true);
    setAiRecommendation(null);
    try {
      const res = await fetch("/api/meta/chat", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          messages: [{
            role: "user",
            content: `I currently have ${audiences?.length ?? 0} custom audiences. ${
              audiences?.length
                ? `They are: ${audiences.map((a) => `${a.name} (${a.subtype}, ${a.retention_days ?? "?"}d)`).join(", ")}.`
                : "No audiences yet."
            } Based on Shift Arcade Miami's business (premium sim racing, Wynwood, $45/day budget), recommend the exact audiences I should create next, what order to create them in, and why each one matters for my Meta ad results. Be specific about retention windows, subtypes, and expected impact.`,
          }],
        }),
      });
      const json = await res.json() as { data?: { message?: string }; error?: string };
      if (json.data?.message) {
        setAiRecommendation(json.data.message);
      } else if (json.error) {
        setAiRecommendation(`Error: ${json.error}`);
      }
    } catch (err) {
      setAiRecommendation(`Error: ${err instanceof Error ? err.message : "Unknown"}`);
    } finally {
      setAiRecommending(false);
    }
  }

  async function handleCreateWebsiteAudience() {
    if (!createForm.name) {
      setCreateError("Name is required");
      return;
    }

    setCreating(true);
    setCreateError(null);

    const body =
      createForm.type === "website"
        ? {
            name: createForm.name,
            subtype: "WEBSITE",
            retention_days: parseInt(createForm.retention_days),
            prefill: true,
          }
        : {
            name: createForm.name,
            subtype: "ENGAGEMENT",
          };

    try {
      const res = await fetch(`/api/meta/audiences?client_id=${clientId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const json = (await res.json()) as { data?: { id: string }; error?: string };

      if (json.error) {
        setCreateError(json.error);
      } else {
        setCreateSuccess(`Audience created! ID: ${json.data?.id}`);
        setCreateForm({ type: "website", name: "", retention_days: "30" });
        refetch();
      }
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Recommended audiences for Shift Arcade */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-semibold text-amber-800 text-sm">🎯 Recommended Audiences for Shift Arcade Miami</h3>
          <button
            onClick={handleAiRecommend}
            disabled={aiRecommending}
            className="flex-shrink-0 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
          >
            {aiRecommending ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Thinking…
              </>
            ) : (
              <>🤖 Recommend using AI</>
            )}
          </button>
        </div>
        <div className="space-y-1 text-xs text-amber-700">
          <div>✅ <strong>Website Visitors 30 days</strong> — Everyone who visited shiftarcade.miami (retargeting)</div>
          <div>✅ <strong>Website Visitors 60 days</strong> — Wider retargeting net</div>
          <div>✅ <strong>Purchasers (pixel)</strong> — Past bookers for lookalike seed</div>
          <div>✅ <strong>Facebook Page Engagers 180d</strong> — Page likers, commenters</div>
          <div>✅ <strong>Instagram Engagers 180d</strong> — IG followers who engaged</div>
          <div>⏳ <strong>1% Lookalike — Purchasers</strong> — Requires 100+ purchase events first</div>
        </div>
        {aiRecommendation && (
          <div className="mt-3 bg-white border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-purple-700">🤖 Claude AI Recommendation</span>
            </div>
            <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{aiRecommendation}</div>
          </div>
        )}
      </div>

      {/* Create form */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h3 className="font-semibold text-gray-900 text-sm mb-4">Create Custom Audience</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Audience Type</label>
            <select
              value={createForm.type}
              onChange={(e) => setCreateForm((f) => ({ ...f, type: e.target.value as "website" | "engagement" | "lookalike" }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="website">Website Visitors (Pixel)</option>
              <option value="engagement">Page/IG Engagers</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Audience Name</label>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Website Visitors 30d"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {createForm.type === "website" && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Retention Window (days)</label>
              <select
                value={createForm.retention_days}
                onChange={(e) => setCreateForm((f) => ({ ...f, retention_days: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
                <option value="180">180 days</option>
              </select>
            </div>
          )}
        </div>

        {createError && (
          <div className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{createError}</div>
        )}
        {createSuccess && (
          <div className="mt-3 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg p-2">{createSuccess}</div>
        )}

        <button
          onClick={handleCreateWebsiteAudience}
          disabled={creating}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {creating ? "Creating…" : "Create Audience"}
        </button>
      </div>

      {/* List */}
      {loading && <LoadingSpinner />}
      {error && (
        <ErrorAlert message={error} onDismiss={() => {}} />
      )}
      {!loading && !error && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-gray-900">
              Custom Audiences ({audiences?.length ?? 0})
            </h3>
            <button onClick={refetch} className="text-xs text-blue-600 hover:underline">Refresh</button>
          </div>

          {!audiences?.length ? (
            <EmptyState
              icon="👥"
              message="No custom audiences found. Create your first audience above to start retargeting visitors and building lookalike audiences."
            />
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Type</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Size (lower)</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Retention</th>
                  <th className="text-left px-4 py-2 text-xs font-medium text-gray-500">Created</th>
                </tr>
              </thead>
              <tbody>
                {audiences.map((aud) => (
                  <tr key={aud.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 max-w-xs truncate">{aud.name}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{aud.subtype}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {aud.approximate_count_lower_bound
                        ? fmt(aud.approximate_count_lower_bound)
                        : "< 1,000"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {aud.retention_days ? `${aud.retention_days}d` : "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">
                      {new Date(aud.time_created).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Guide Tab
// ---------------------------------------------------------------------------

function GuideTab() {
  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
        <h3 className="font-bold text-blue-900 text-lg mb-1">🏁 Shift Arcade Miami — Ads Playbook</h3>
        <p className="text-sm text-blue-700">Based on historical performance data and Meta Marketing API research. Follow this sequence for best results.</p>
      </div>

      {[
        {
          step: "1",
          title: "Start with North Miami Beach — $10/day",
          color: "bg-yellow-50 border-yellow-200",
          titleColor: "text-yellow-800",
          points: [
            "Historical BEST performer at $5.03/purchase",
            "Go to Drafts tab → Push 'North Miami Beach Conversions' to Meta",
            "Upload creative (driver's POV video works best — see creative brief in draft)",
            "Create ad creative and ad via API or Meta Ads Manager",
            "Run for 14 days MINIMUM before evaluating — learning phase needs data",
            "🚫 Do NOT pause during learning phase — resets all optimization data",
          ],
        },
        {
          step: "2",
          title: "Build Retargeting Audiences ASAP",
          color: "bg-green-50 border-green-200",
          titleColor: "text-green-800",
          points: [
            "Go to Audiences tab → Create 'Website Visitors 30d' audience",
            "Also create 'Website Visitors 60d' for wider net",
            "These audiences fill automatically from your pixel — takes 1-7 days",
            "Once you have 1,000+ visitors: launch the Retargeting draft campaign",
            "Retargeting CPP is typically 3-5x cheaper than cold audiences",
          ],
        },
        {
          step: "3",
          title: "Retest CAPI Campaigns (Fort Lauderdale)",
          color: "bg-purple-50 border-purple-200",
          titleColor: "text-purple-800",
          points: [
            "CAPI campaigns were paused MID-LEARNING — not failures!",
            "Server-side tracking (CAPI) eliminates iOS 14 attribution gaps",
            "Run Fort Lauderdale CAPI retest at $8/day for minimum 2 weeks",
            "Verify your Conversions API is configured at shiftarcade.miami before launching",
            "Compare CAPI vs pixel-only cost per purchase after 30 days",
          ],
        },
        {
          step: "4",
          title: "Build Lookalike Audiences (After 100 Purchases)",
          color: "bg-teal-50 border-teal-200",
          titleColor: "text-teal-800",
          points: [
            "Wait until pixel has 100+ purchase events (takes 1-3 months at $10/day)",
            "Create 1% Lookalike from purchasers — Meta's AI finds similar people",
            "Launch Lookalike campaign at $10/day — this is your scale engine",
            "Expand to 2% and 3% lookalikes as budget grows",
          ],
        },
        {
          step: "5",
          title: "Scale with Advantage+ (After 50+ Purchases)",
          color: "bg-orange-50 border-orange-200",
          titleColor: "text-orange-800",
          points: [
            "Advantage+ campaigns let Meta's AI handle all targeting automatically",
            "No manual audience setup — Meta finds buyers across South Florida",
            "Start at $20/day after other campaigns have collected pixel data",
            "Expected CPP: $6-10 at scale with mature pixel",
            "This is your long-term scale campaign — can grow to $100+/day",
          ],
        },
      ].map((section) => (
        <div key={section.step} className={`border rounded-xl p-5 ${section.color}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gray-200 text-sm font-bold text-gray-700">
              {section.step}
            </span>
            <h3 className={`font-semibold text-sm ${section.titleColor}`}>{section.title}</h3>
          </div>
          <ul className="space-y-1.5">
            {section.points.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="mt-0.5 text-gray-400 flex-shrink-0">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
        <h3 className="font-semibold text-red-800 text-sm mb-2">🚫 Never Do These Things</h3>
        <div className="space-y-1 text-xs text-red-700">
          <div>❌ <strong>Pause campaigns during learning phase</strong> (first 7-14 days) — resets optimization data</div>
          <div>❌ <strong>Change budget by more than 20%</strong> in one edit — Meta treats this as a restart</div>
          <div>❌ <strong>Run too many ad sets against the same audience</strong> — causes audience overlap and higher CPMs</div>
          <div>❌ <strong>Skip UTM parameters</strong> — makes ROI tracking impossible in Google Analytics</div>
          <div>❌ <strong>Run all cities simultaneously at $10/day total</strong> — dilutes learning. One geo per campaign at launch.</div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Version Footer
// ---------------------------------------------------------------------------

const BUILD_VERSION = "v2.3";
const BUILD_DATE = "Mar 18, 2026";

function VersionFooter() {
  const [loadedAt] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  });

  return (
    <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100">
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">{BUILD_VERSION}</span>
        <span>·</span>
        <span>Updated {BUILD_DATE}</span>
        <span>·</span>
        <span>Loaded at {loadedAt}</span>
        <span>·</span>
        <span className="text-gray-300">Meta Marketing API v25.0 · Claude Sonnet 4.6</span>
      </div>
      <div className="text-xs text-gray-300">Shift Arcade Miami</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdsManagerClient({ initialClientId }: { initialClientId?: string } = {}) {
  const { session } = useAuth();
  const token = session?.access_token ?? null;

  const [activeTab, setActiveTab] = useState<Tab>("campaigns");
  const [clientId, setClientId] = useState<string | null>(initialClientId ?? null);
  const [metaAdAccountId, setMetaAdAccountId] = useState<string | null>(null);
  const [launchNotifications, setLaunchNotifications] = useState<string[]>([]);
  const [pixelHealth, setPixelHealth] = useState<CapiHealthData | null>(null);
  // Campaign detail panel
  const [detailCampaign, setDetailCampaign] = useState<{ id: string; name: string } | null>(null);
  // Draft editor
  const [editingDraft, setEditingDraft] = useState<ShiftArcadeDraftCampaign | null>(null);

  // Get clientId from session / profile, then fetch meta_ad_account_id.
  // If initialClientId is provided (e.g. from the agency overview), skip profile lookup.
  // Admin fallback: if profile has no client_id, auto-pick the first client.
  useEffect(() => {
    if (!session?.user) return;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl || !token) return;

    const headers = {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      Authorization: `Bearer ${token}`,
    };

    const resolveClientId = (cid: string) => {
      setClientId(cid);
      // Also fetch meta_ad_account_id for the Open Meta deep-link
      fetch(`${supabaseUrl}/rest/v1/clients?id=eq.${cid}&select=meta_ad_account_id`, { headers })
        .then((r) => r.json())
        .then((clientData: unknown) => {
          const clientRows = clientData as Array<{ meta_ad_account_id: string | null }>;
          const accountId = clientRows[0]?.meta_ad_account_id;
          if (accountId) setMetaAdAccountId(accountId);
        })
        .catch(console.error);
      // Fetch pixel health for per-campaign CAPI badges
      if (token) {
        fetch(`/api/meta/pixel-health?client_id=${cid}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((r) => r.json())
          .then((json: { data?: CapiHealthData }) => {
            if (json.data) setPixelHealth(json.data);
          })
          .catch(console.error);
      }
    };

    // If initialClientId was passed (agency overview → client page), use it directly
    if (initialClientId) {
      resolveClientId(initialClientId);
      return;
    }

    fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${session.user.id}&select=client_id,role`, { headers })
      .then((r) => r.json())
      .then((data: unknown) => {
        const rows = data as Array<{ client_id: string | null; role: string | null }>;
        const cid = rows[0]?.client_id;
        if (cid) {
          resolveClientId(cid);
        } else {
          // Admin with no client_id — auto-pick the first client that has a Meta ad account
          fetch(`${supabaseUrl}/rest/v1/clients?select=id,meta_ad_account_id&meta_ad_account_id=not.is.null&limit=1`, { headers })
            .then((r) => r.json())
            .then((clientData: unknown) => {
              const clientRows = clientData as Array<{ id: string; meta_ad_account_id: string | null }>;
              if (clientRows[0]?.id) resolveClientId(clientRows[0].id);
            })
            .catch(console.error);
        }
      })
      .catch(console.error);
  }, [session, token, initialClientId]);

  const {
    data: campaigns,
    loading: campaignsLoading,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useMetaApi<MetaCampaign[]>("/api/meta/campaigns", token, clientId);

  const {
    data: adSets,
    loading: adSetsLoading,
    error: adSetsError,
    refetch: refetchAdSets,
  } = useMetaApi<MetaAdSet[]>("/api/meta/adsets", token, clientId);

  if (!token) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Please sign in to access Ads Manager.</p>
      </div>
    );
  }

  const activeCampaigns = campaigns?.filter((c) => c.status === "ACTIVE" || c.effective_status === "ACTIVE") ?? [];
  const pausedCampaigns = campaigns?.filter((c) => c.status === "PAUSED") ?? [];
  const totalDailyBudget = campaigns
    ?.filter((c) => c.status === "ACTIVE")
    .reduce((sum, c) => sum + (c.daily_budget ? parseFloat(c.daily_budget) / 100 : 0), 0) ?? 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meta Ads Manager</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Full campaign management · Read & write · Powered by Meta Marketing API v25.0
          </p>
        </div>
        <div className="flex items-center gap-3">
          {campaigns && (
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-900">{activeCampaigns.length} active / {pausedCampaigns.length} paused</div>
              <div className="text-xs text-gray-400">${totalDailyBudget.toFixed(2)}/day active spend</div>
            </div>
          )}
          <a
            href={
              metaAdAccountId
                ? `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${metaAdAccountId.replace("act_", "")}`
                : "https://adsmanager.facebook.com"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Open Meta ↗
          </a>
        </div>
      </div>

      {/* Launch notifications */}
      {launchNotifications.map((msg, i) => (
        <div key={i} className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <span>✅</span>
          <span>{msg}</span>
        </div>
      ))}

      {/* Tabs */}
      <div className="border-b border-gray-200 flex gap-1 flex-wrap">
        <TabButton active={activeTab === "campaigns"} onClick={() => setActiveTab("campaigns")}>
          📊 Campaigns {campaigns ? `(${campaigns.length})` : ""}
        </TabButton>
        <TabButton active={activeTab === "analytics"} onClick={() => setActiveTab("analytics")}>
          📈 Analytics
        </TabButton>
        <TabButton active={activeTab === "adsets"} onClick={() => setActiveTab("adsets")}>
          🎯 Ad Sets {adSets ? `(${adSets.length})` : ""}
        </TabButton>
        <TabButton active={activeTab === "drafts"} onClick={() => setActiveTab("drafts")}>
          🚀 Drafts ({SHIFT_ARCADE_DRAFT_CAMPAIGNS.length})
        </TabButton>
        <TabButton active={activeTab === "audiences"} onClick={() => setActiveTab("audiences")}>
          👥 Audiences
        </TabButton>
        <TabButton active={activeTab === "previews"} onClick={() => setActiveTab("previews")}>
          🖼️ Ad Previews
        </TabButton>
        <TabButton active={activeTab === "ai_assistant"} onClick={() => setActiveTab("ai_assistant")}>
          🤖 AI Assistant
        </TabButton>
        <TabButton active={activeTab === "competitors"} onClick={() => setActiveTab("competitors")}>
          🔍 Competitors
        </TabButton>
        <TabButton active={activeTab === "guide"} onClick={() => setActiveTab("guide")}>
          📖 Strategy Guide
        </TabButton>
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {/* CAMPAIGNS TAB */}
        {activeTab === "campaigns" && (
          <div className="space-y-4">
            {campaignsError && (
              <ErrorAlert message={campaignsError} onDismiss={() => {}} />
            )}

            {/* Summary cards + CAPI — TOP of campaigns tab */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Active Campaigns</div>
                <div className="text-2xl font-bold text-green-600">{activeCampaigns.length}</div>
                <div className="text-xs text-gray-400">${totalDailyBudget.toFixed(2)}/day spend</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Paused Campaigns</div>
                <div className="text-2xl font-bold text-yellow-600">{pausedCampaigns.length}</div>
                <div className="text-xs text-gray-400">No spend</div>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="text-xs text-gray-400 mb-1">Total Campaigns</div>
                <div className="text-2xl font-bold text-gray-700">{campaigns?.length ?? 0}</div>
                <div className="text-xs text-gray-400">Across all statuses</div>
              </div>
              {clientId && <CapiStrengthWidget token={token} clientId={clientId} />}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h2 className="font-semibold text-sm text-gray-900">
                  All Campaigns
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={refetchCampaigns}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Refresh
                  </button>
                  <span className="text-xs text-gray-400">Toggle switches ACTIVE ↔ PAUSED in Meta instantly</span>
                </div>
              </div>

              {campaignsLoading && <LoadingSpinner />}

              {!campaignsLoading && !campaigns?.length && !campaignsError && (
                <EmptyState
                  icon="📋"
                  message="No campaigns found. Use the Drafts tab to push pre-built campaign structures to Meta."
                />
              )}

              {campaigns && campaigns.length > 0 && (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Campaign</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Objective</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Budget</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Created</th>
                      <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Toggle / Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((campaign) => (
                      <CampaignRow
                        key={campaign.id}
                        campaign={campaign}
                        token={token}
                        clientId={clientId!}
                        onToggle={refetchCampaigns}
                        pixelHealth={pixelHealth}
                        onViewDetail={() => setDetailCampaign({ id: campaign.id, name: campaign.name })}
                      />
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && token && clientId && (
          <CampaignAnalyticsTab
            token={token}
            clientId={clientId}
            onCampaignClick={(id, name) => setDetailCampaign({ id, name })}
          />
        )}

        {/* AD SETS TAB */}
        {activeTab === "adsets" && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-semibold text-sm text-gray-900">Ad Sets</h2>
              <button onClick={refetchAdSets} className="text-xs text-blue-600 hover:underline">Refresh</button>
            </div>

            {adSetsLoading && <LoadingSpinner />}
            {adSetsError && <ErrorAlert message={adSetsError} onDismiss={() => {}} />}

            {!adSetsLoading && !adSets?.length && !adSetsError && (
              <EmptyState
                icon="🎯"
                message="No ad sets found. Ad sets are created automatically when you push a draft campaign."
              />
            )}

            {adSets && adSets.length > 0 && (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Ad Set</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Optimization</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Budget</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {adSets.map((adSet) => (
                    <tr key={adSet.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-sm text-gray-900 max-w-xs truncate">{adSet.name}</div>
                        <div className="text-xs text-gray-400">{adSet.id}</div>
                        <LearningPhaseBar effectiveStatus={adSet.effective_status} />
                      </td>
                      <td className="py-3 px-4"><StatusBadge status={adSet.status} /></td>
                      <td className="py-3 px-4 text-sm text-gray-600">{adSet.optimization_goal}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {adSet.daily_budget ? fmtBudget(adSet.daily_budget) : "—"}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-400">
                        {adSet.end_time ? new Date(adSet.end_time).toLocaleDateString() : "No end"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* DRAFTS TAB */}
        {activeTab === "drafts" && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 text-sm mb-1">
                🚀 5 AI-Researched Draft Campaigns — Ready to Push
              </h3>
              <p className="text-xs text-blue-700">
                Based on your historical performance data, Meta API research, and Shift Arcade Miami&rsquo;s business model.
                Clicking &ldquo;Push to Meta&rdquo; creates the campaign structure in Meta Ads Manager as <strong>PAUSED</strong>.
                Nothing spends until you manually activate. Add your creative assets in Meta, then activate when ready.
              </p>
            </div>

            {clientId && token ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {SHIFT_ARCADE_DRAFT_CAMPAIGNS.map((draft) => (
                  <DraftCard
                    key={draft.id}
                    draft={draft}
                    token={token}
                    clientId={clientId}
                    onEdit={() => setEditingDraft(draft)}
                    onLaunch={(cid, asid) => {
                      setLaunchNotifications((prev) => [
                        ...prev,
                        `Draft pushed! Campaign ${cid} + Ad Set ${asid} created in Meta as PAUSED`,
                      ]);
                      setTimeout(() => refetchCampaigns(), 2000);
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState icon="⚙️" message="Loading client configuration…" />
            )}
          </div>
        )}

        {/* AUDIENCES TAB */}
        {activeTab === "audiences" && token && clientId && (
          <AudiencesTab token={token} clientId={clientId} />
        )}

        {/* AD PREVIEWS TAB */}
        {activeTab === "previews" && token && clientId && (
          <AdPreviewTab token={token} clientId={clientId} />
        )}

        {/* AI ASSISTANT TAB */}
        {activeTab === "ai_assistant" && token && clientId && (
          <AiAssistantTab token={token} clientId={clientId} />
        )}

        {/* COMPETITORS TAB */}
        {activeTab === "competitors" && token && (
          <CompetitorsTab token={token} />
        )}

        {/* GUIDE TAB */}
        {activeTab === "guide" && <GuideTab />}
      </div>

      {/* Floating AI chat bubble (always visible) */}
      {token && clientId && (
        <FloatingChatBubble token={token} clientId={clientId} />
      )}

      {/* Campaign Detail Panel modal */}
      {detailCampaign && token && clientId && (
        <CampaignDetailPanel
          token={token}
          clientId={clientId}
          campaignId={detailCampaign.id}
          campaignName={detailCampaign.name}
          onClose={() => setDetailCampaign(null)}
        />
      )}

      {/* Draft Editor modal */}
      {editingDraft && token && clientId && (
        <DraftEditor
          draft={editingDraft}
          token={token}
          clientId={clientId}
          onClose={() => setEditingDraft(null)}
        />
      )}

      {/* Version footer */}
      <VersionFooter />
    </div>
  );
}
