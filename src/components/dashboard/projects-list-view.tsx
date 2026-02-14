"use client";

import { useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import { SERVICE_LABELS } from "@/types";
import type { Campaign, CampaignService } from "@/types";

type ViewMode = "list" | "thumbnails";

interface ProjectsListViewProps {
  readonly campaigns: readonly Campaign[];
  readonly clientId: string;
  readonly addButton?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ListIcon({ active }: { readonly active: boolean }) {
  return (
    <svg className={`w-4 h-4 ${active ? "text-red-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  );
}

function GridIcon({ active }: { readonly active: boolean }) {
  return (
    <svg className={`w-4 h-4 ${active ? "text-red-600" : "text-gray-400"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Inline Meta status (no API call — just checks if ad account ID exists)
// ---------------------------------------------------------------------------

function MetaInlineStatus({ adAccountId }: { readonly adAccountId: string | null }) {
  const connected = !!adAccountId;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
        connected
          ? "bg-green-50 border-green-200 text-green-700"
          : "bg-gray-50 border-gray-200 text-gray-500"
      }`}
      title={connected ? `Ad Account: ${adAccountId}` : "No Meta Ad Account connected"}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-green-500" : "bg-gray-400"}`} />
      {connected ? "Connected" : "Not Connected"}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Status color for card accent
// ---------------------------------------------------------------------------

const STATUS_GRADIENT: Record<string, string> = {
  active: "from-green-500 to-emerald-600",
  draft: "from-gray-400 to-gray-500",
  paused: "from-yellow-500 to-amber-600",
  completed: "from-blue-500 to-indigo-600",
};

// ---------------------------------------------------------------------------
// View Toggle
// ---------------------------------------------------------------------------

function ViewToggle({ view, onViewChange }: { readonly view: ViewMode; readonly onViewChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => onViewChange("list")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
          view === "list" ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50"
        }`}
      >
        <ListIcon active={view === "list"} />
        List
      </button>
      <div className="w-px h-5 bg-gray-200" />
      <button
        type="button"
        onClick={() => onViewChange("thumbnails")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
          view === "thumbnails" ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50"
        }`}
      >
        <GridIcon active={view === "thumbnails"} />
        Thumbnails
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// List View (table)
// ---------------------------------------------------------------------------

function ListView({ campaigns }: { readonly campaigns: readonly Campaign[] }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th className="text-left py-3 px-4 font-medium">Name</th>
            <th className="text-left py-3 px-4 font-medium">Services</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Meta</th>
            <th className="text-left py-3 px-4 font-medium">Monthly Cost</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((campaign) => (
            <tr key={campaign.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
              <td className="py-3 px-4">
                <Link
                  href={`/dashboard/campaigns/${campaign.id}`}
                  className="text-red-600 hover:text-red-700 font-medium transition-colors"
                >
                  {campaign.name}
                </Link>
              </td>
              <td className="py-3 px-4">
                <div className="flex flex-wrap gap-1">
                  {(campaign.services ?? []).map((s: CampaignService) => (
                    <span key={s} className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                      {SERVICE_LABELS[s] ?? s}
                    </span>
                  ))}
                  {(!campaign.services || campaign.services.length === 0) && (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <Badge variant={campaign.status}>{campaign.status}</Badge>
              </td>
              <td className="py-3 px-4">
                <MetaInlineStatus adAccountId={campaign.meta_ad_account_id ?? null} />
              </td>
              <td className="py-3 px-4 text-gray-600">
                {campaign.monthly_cost ? `$${Number(campaign.monthly_cost).toLocaleString()}` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thumbnails View (cards)
// ---------------------------------------------------------------------------

function ThumbnailsView({ campaigns }: { readonly campaigns: readonly Campaign[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {campaigns.map((campaign) => {
        const gradient = STATUS_GRADIENT[campaign.status] ?? STATUS_GRADIENT.draft;

        return (
          <Link
            key={campaign.id}
            href={`/dashboard/campaigns/${campaign.id}`}
            className="group rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md hover:border-gray-300 transition-all"
          >
            {/* Status accent bar */}
            <div className={`h-1 bg-gradient-to-r ${gradient}`} />

            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                  {campaign.name}
                </h3>
                <Badge variant={campaign.status}>{campaign.status}</Badge>
              </div>

              {/* Services */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(campaign.services ?? []).map((s: CampaignService) => (
                  <span
                    key={s}
                    className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600"
                  >
                    {SERVICE_LABELS[s] ?? s}
                  </span>
                ))}
                {(!campaign.services || campaign.services.length === 0) && (
                  <span className="text-xs text-gray-400">No services</span>
                )}
              </div>

              {/* Meta status */}
              <div className="mb-3">
                <MetaInlineStatus adAccountId={campaign.meta_ad_account_id ?? null} />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                <span>
                  {campaign.monthly_cost
                    ? `$${Number(campaign.monthly_cost).toLocaleString()}/mo`
                    : "No budget set"}
                </span>
                {campaign.start_date && (
                  <span>Started {new Date(campaign.start_date).toLocaleDateString()}</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ProjectsListView({ campaigns, clientId, addButton }: ProjectsListViewProps) {
  const [view, setView] = useState<ViewMode>("list");

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">Projects</h2>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
        {addButton}
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 text-center text-gray-400 text-sm">
          No projects yet
        </div>
      ) : view === "list" ? (
        <ListView campaigns={campaigns} />
      ) : (
        <ThumbnailsView campaigns={campaigns} />
      )}
    </div>
  );
}
