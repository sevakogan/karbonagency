"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/badge";
import { useAuth } from "@/components/auth/auth-provider";
import type { Client } from "@/types";

type ViewMode = "list" | "thumbnails";

interface ClientsListViewProps {
  readonly clients: readonly Client[];
}

// ── Icons ──────────────────────────────────────────────────────────────────

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

function TrashIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  );
}

// ── Delete confirm dialog ──────────────────────────────────────────────────

function DeleteConfirmModal({
  clientName,
  onConfirm,
  onCancel,
  deleting,
}: {
  clientName: string;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <TrashIcon />
        </div>
        <h3 className="text-base font-bold text-gray-900 text-center mb-1">Delete client?</h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          <span className="font-semibold text-gray-700">{clientName}</span> and all associated data will be permanently removed. This cannot be undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deleting ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Deleting…</>
            ) : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function ClientInitials({ name, size = "md" }: { readonly name: string; readonly size?: "sm" | "md" }) {
  const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const sizeClasses = size === "sm" ? "w-10 h-10 text-sm rounded-xl" : "w-16 h-16 text-xl rounded-2xl";
  return (
    <div className={`${sizeClasses} bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0`}>
      {initials}
    </div>
  );
}

function ClientLogo({ client, size = "md" }: { readonly client: Client; readonly size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "w-10 h-10 rounded-xl" : "w-16 h-16 rounded-2xl";
  if (client.logo_url) {
    return (
      <div className={`relative ${sizeClasses} overflow-hidden shadow-md flex-shrink-0 border border-gray-100`}>
        <Image src={client.logo_url} alt={`${client.name} logo`} fill className="object-cover" />
      </div>
    );
  }
  return <ClientInitials name={client.name} size={size} />;
}

function ViewToggle({ view, onViewChange }: { readonly view: ViewMode; readonly onViewChange: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden">
      <button type="button" onClick={() => onViewChange("list")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === "list" ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50"}`}>
        <ListIcon active={view === "list"} /> List
      </button>
      <div className="w-px h-5 bg-gray-200" />
      <button type="button" onClick={() => onViewChange("thumbnails")} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${view === "thumbnails" ? "bg-red-50 text-red-600" : "text-gray-500 hover:bg-gray-50"}`}>
        <GridIcon active={view === "thumbnails"} /> Thumbnails
      </button>
    </div>
  );
}

// ── List View ──────────────────────────────────────────────────────────────

function ListView({
  clients,
  onDeleteClick,
}: {
  readonly clients: readonly Client[];
  onDeleteClick: (c: Client) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
            <th className="text-left py-3 px-4 font-medium">Client</th>
            <th className="text-left py-3 px-4 font-medium">Email</th>
            <th className="text-left py-3 px-4 font-medium">Phone</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Created</th>
            <th className="py-3 px-4" />
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr key={client.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors group">
              <td className="py-3 px-4">
                <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-3">
                  <ClientLogo client={client} size="sm" />
                  <span className="font-medium text-red-600 hover:text-red-700 transition-colors">{client.name}</span>
                </Link>
              </td>
              <td className="py-3 px-4 text-gray-600">{client.contact_email || "—"}</td>
              <td className="py-3 px-4 text-gray-600">{client.contact_phone || "—"}</td>
              <td className="py-3 px-4">
                <Badge variant={client.is_active ? "active" : "lost"}>
                  {client.is_active ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="py-3 px-4 text-gray-400 text-xs">{new Date(client.created_at).toLocaleDateString()}</td>
              <td className="py-3 px-4 text-right">
                <button
                  onClick={() => onDeleteClick(client)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50"
                  title="Delete client"
                >
                  <TrashIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Thumbnails View ────────────────────────────────────────────────────────

function ThumbnailsView({
  clients,
  onDeleteClick,
}: {
  readonly clients: readonly Client[];
  onDeleteClick: (c: Client) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {clients.map((client) => (
        <div key={client.id} className="group relative rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md hover:border-gray-300 transition-all">
          <div className="h-1 bg-gradient-to-r from-red-500 via-red-600 to-orange-500" />

          {/* Delete button */}
          <button
            onClick={() => onDeleteClick(client)}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:border-red-200 shadow-sm z-10"
            title="Delete client"
          >
            <TrashIcon />
          </button>

          <Link href={`/dashboard/clients/${client.id}`} className="block p-5">
            <div className="flex items-start gap-4">
              <ClientLogo client={client} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">{client.name}</h3>
                  <Badge variant={client.is_active ? "active" : "lost"}>{client.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                {client.company_name && <p className="text-xs text-gray-500 mb-2">{client.company_name}</p>}
                <div className="space-y-1 text-xs text-gray-500">
                  {client.contact_email && (
                    <div className="flex items-center gap-1.5 truncate">
                      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                      </svg>
                      <span className="truncate">{client.contact_email}</span>
                    </div>
                  )}
                  {client.contact_phone && (
                    <div className="flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                      </svg>
                      {client.contact_phone}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

export default function ClientsListView({ clients: initialClients }: ClientsListViewProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [clients, setClients] = useState<readonly Client[]>(initialClients);
  const [pendingDelete, setPendingDelete] = useState<Client | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { session } = useAuth();
  const router = useRouter();

  async function handleConfirmDelete() {
    if (!pendingDelete || !session?.access_token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/meta/clients/${pendingDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c.id !== pendingDelete.id));
        setPendingDelete(null);
        router.refresh();
      } else {
        const json = await res.json();
        alert(json.error ?? "Failed to delete client");
      }
    } catch {
      alert("Network error — could not delete client");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      {pendingDelete && (
        <DeleteConfirmModal
          clientName={pendingDelete.name}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
          deleting={deleting}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Clients</h1>
          <p className="text-sm text-gray-500">{clients.length} clients</p>
        </div>
        <ViewToggle view={view} onViewChange={setView} />
      </div>

      {clients.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm text-center py-12 text-gray-400 text-sm">
          No clients yet
        </div>
      ) : view === "list" ? (
        <ListView clients={clients} onDeleteClick={setPendingDelete} />
      ) : (
        <ThumbnailsView clients={clients} onDeleteClick={setPendingDelete} />
      )}
    </div>
  );
}
