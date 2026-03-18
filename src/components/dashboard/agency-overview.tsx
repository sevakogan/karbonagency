"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import Link from "next/link";
import Image from "next/image";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClientOverview {
  id: string;
  name: string;
  company_name?: string | null;
  logo_url?: string | null;
  is_active: boolean;
  meta_connected: boolean;
  meta_ad_account_id?: string | null;
  active_campaigns: number;
  total_campaigns: number;
  contact_email?: string | null;
  contact_phone?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function ClientAvatar({ client }: { client: ClientOverview }) {
  if (client.logo_url) {
    return (
      <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow border border-gray-100 flex-shrink-0">
        <Image src={client.logo_url} alt={client.name} fill className="object-cover" />
      </div>
    );
  }
  const colors = [
    "from-red-500 to-red-700",
    "from-blue-500 to-blue-700",
    "from-purple-500 to-purple-700",
    "from-emerald-500 to-emerald-700",
    "from-orange-500 to-orange-700",
    "from-pink-500 to-pink-700",
  ];
  const color = colors[client.name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-lg font-bold shadow flex-shrink-0`}>
      {getInitials(client.name)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Single Client Card
// ---------------------------------------------------------------------------

function ClientCard({ client }: { client: ClientOverview }) {
  return (
    <Link
      href={`/dashboard/clients/${client.id}`}
      className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-lg hover:border-red-200 transition-all duration-200"
    >
      {/* Top accent bar */}
      <div className={`h-1 ${client.meta_connected ? "bg-gradient-to-r from-red-500 via-red-600 to-orange-400" : "bg-gray-200"}`} />

      <div className="p-5">
        <div className="flex items-start gap-4">
          <ClientAvatar client={client} />

          <div className="flex-1 min-w-0">
            {/* Name + status */}
            <div className="flex items-center gap-2 mb-0.5">
              <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                {client.name}
              </h3>
              <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                client.is_active
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-500 border border-gray-200"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${client.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                {client.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            {client.company_name && (
              <p className="text-xs text-gray-400 mb-2 truncate">{client.company_name}</p>
            )}

            {/* Meta status */}
            <div className="flex items-center gap-3 mt-2">
              <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-lg ${
                client.meta_connected
                  ? "bg-blue-50 text-blue-700 border border-blue-100"
                  : "bg-gray-50 text-gray-400 border border-gray-200"
              }`}>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14.5h-2.25v-4.75c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v4.75H9v-4.75c0-1.93 1.57-3.5 3.5-3.5s3.5 1.57 3.5 3.5v4.75z" />
                </svg>
                {client.meta_connected ? "Meta Connected" : "No Meta"}
              </span>

              {client.meta_connected && (
                <span className="text-xs text-gray-500">
                  {client.active_campaigns > 0 ? (
                    <span className="text-green-600 font-semibold">{client.active_campaigns} active</span>
                  ) : (
                    <span>{client.total_campaigns} campaigns</span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">{client.contact_email ?? ""}</span>
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            client.meta_connected
              ? "bg-red-600 text-white group-hover:bg-red-700 shadow-sm"
              : "bg-gray-100 text-gray-500"
          }`}>
            {client.meta_connected ? "Open Ads Manager →" : "View Client →"}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
        </svg>
      </div>
      <h3 className="text-base font-bold text-gray-900 mb-2">No clients yet</h3>
      <p className="text-sm text-gray-500">Add your first client to get started.</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Agency Overview Component
// ---------------------------------------------------------------------------

export default function AgencyOverview() {
  const { session } = useAuth();
  const token = session?.access_token ?? null;

  const [clients, setClients] = useState<ClientOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "meta">("all");

  useEffect(() => {
    if (!token) return;
    fetch("/api/meta/clients-overview", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((json: { data?: ClientOverview[] }) => {
        if (json.data) setClients(json.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.company_name ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "active" && c.is_active) ||
      (filter === "meta" && c.meta_connected);
    return matchesSearch && matchesFilter;
  });

  const metaCount = clients.filter((c) => c.meta_connected).length;
  const activeCount = clients.filter((c) => c.is_active).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Agency Dashboard</h1>
        <p className="text-sm text-gray-500">
          {clients.length} clients · {activeCount} active · {metaCount} Meta connected
        </p>
      </div>

      {/* Search + filter bar */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
          </svg>
          <input
            type="text"
            placeholder="Search clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {(["all", "active", "meta"] as const).map((f, i) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 text-xs font-medium transition-colors ${
                filter === f ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50"
              } ${i > 0 ? "border-l border-gray-200" : ""}`}
            >
              {f === "all" ? "All" : f === "active" ? "Active" : "Meta Connected"}
            </button>
          ))}
        </div>

        <Link
          href="/dashboard/clients/new"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors shadow-sm"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Client
        </Link>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-gray-200 bg-white h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}
