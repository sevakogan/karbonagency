"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Badge from "@/components/ui/badge";
import { updateClient } from "@/lib/actions/clients";
import type { Client, Campaign } from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminClientRowProps {
  readonly client: Client;
  readonly campaigns: readonly Campaign[];
}

interface FieldEdit {
  readonly field: string;
  readonly value: string;
}

// ---------------------------------------------------------------------------
// Inline editable field
// ---------------------------------------------------------------------------

function InlineField({
  label,
  value,
  field,
  clientId,
  placeholder,
  onSaved,
}: {
  readonly label: string;
  readonly value: string | null;
  readonly field: string;
  readonly clientId: string;
  readonly placeholder: string;
  readonly onSaved: (edit: FieldEdit) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || "");
  const [saving, setSaving] = useState(false);

  const handleSave = useCallback(async () => {
    setSaving(true);
    const { error } = await updateClient(clientId, {
      [field]: draft.trim() || null,
    });
    setSaving(false);

    if (!error) {
      setEditing(false);
      onSaved({ field, value: draft.trim() });
    }
  }, [clientId, field, draft, onSaved]);

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none"
          placeholder={placeholder}
          autoFocus
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="text-xs font-medium text-white bg-gray-900 rounded-lg px-3 py-1.5 hover:bg-gray-800 disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
        <button
          onClick={() => {
            setEditing(false);
            setDraft(value || "");
          }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
      <span className={`text-sm ${value ? "text-gray-900" : "text-gray-300 italic"}`}>
        {value || placeholder}
      </span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 text-xs text-gray-400 hover:text-gray-600 transition-opacity"
      >
        Edit
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Campaign row with ad account
// ---------------------------------------------------------------------------

function CampaignAdAccountRow({
  campaign,
}: {
  readonly campaign: Campaign;
}) {
  const connected = !!campaign.meta_ad_account_id;

  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50">
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/campaigns/${campaign.id}`}
          className="text-sm font-medium text-gray-900 hover:text-red-600 transition-colors"
        >
          {campaign.name}
        </Link>
        <Badge variant={campaign.status}>{campaign.status}</Badge>
      </div>
      <div className="flex items-center gap-2">
        {connected ? (
          <span className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600 font-mono">{campaign.meta_ad_account_id}</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-gray-300" />
            No ad account
          </span>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AdminClientRow({ client, campaigns }: AdminClientRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [clientData, setClientData] = useState(client);

  const handleFieldSaved = useCallback((edit: FieldEdit) => {
    setClientData((prev) => ({
      ...prev,
      [edit.field]: edit.value || null,
    }));
  }, []);

  const connectedCampaigns = campaigns.filter((c) => c.meta_ad_account_id);
  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4 min-w-0">
          {/* Initials */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-red-700 text-white text-sm font-bold shrink-0">
            {clientData.name
              .split(" ")
              .map((w) => w[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 truncate">
                {clientData.name}
              </span>
              <Badge variant={clientData.is_active ? "active" : "lost"}>
                {clientData.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
            {clientData.company_name && (
              <p className="text-xs text-gray-500 truncate">{clientData.company_name}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          {/* Quick stats */}
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500">
            <span>{campaigns.length} projects</span>
            <span>{activeCampaigns.length} active</span>
            <span>
              {connectedCampaigns.length}/{campaigns.length} connected
            </span>
          </div>
          {/* Chevron */}
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-6 py-5 space-y-5">
          {/* Client info fields */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Client Info
            </h3>
            <InlineField
              label="Company"
              value={clientData.company_name}
              field="company_name"
              clientId={clientData.id}
              placeholder="Company name"
              onSaved={handleFieldSaved}
            />
            <InlineField
              label="Email"
              value={clientData.contact_email}
              field="contact_email"
              clientId={clientData.id}
              placeholder="contact@example.com"
              onSaved={handleFieldSaved}
            />
            <InlineField
              label="Phone"
              value={clientData.contact_phone}
              field="contact_phone"
              clientId={clientData.id}
              placeholder="(555) 123-4567"
              onSaved={handleFieldSaved}
            />
            <InlineField
              label="Instagram"
              value={clientData.instagram_url}
              field="instagram_url"
              clientId={clientData.id}
              placeholder="https://instagram.com/..."
              onSaved={handleFieldSaved}
            />
            <InlineField
              label="Facebook"
              value={clientData.facebook_url}
              field="facebook_url"
              clientId={clientData.id}
              placeholder="https://facebook.com/..."
              onSaved={handleFieldSaved}
            />
            <InlineField
              label="Ad Account"
              value={clientData.meta_ad_account_id}
              field="meta_ad_account_id"
              clientId={clientData.id}
              placeholder="Meta Ad Account ID (global)"
              onSaved={handleFieldSaved}
            />
          </div>

          {/* Projects & their ad accounts */}
          {campaigns.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Projects & Ad Accounts
              </h3>
              <div className="space-y-1.5">
                {campaigns.map((campaign) => (
                  <CampaignAdAccountRow key={campaign.id} campaign={campaign} />
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Connect ad accounts on each project&apos;s detail page
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              href={`/admin/clients/${clientData.id}`}
              className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors"
            >
              View Client Dashboard →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
