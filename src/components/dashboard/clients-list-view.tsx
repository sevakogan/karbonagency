"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Badge from "@/components/ui/badge";
import type { Client } from "@/types";

type ViewMode = "list" | "thumbnails";

interface ClientsListViewProps {
  readonly clients: readonly Client[];
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ListIcon({ active }: { readonly active: boolean }) {
  return (
    <svg
      className={`w-4 h-4 ${active ? "text-red-600" : "text-gray-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
    </svg>
  );
}

function GridIcon({ active }: { readonly active: boolean }) {
  return (
    <svg
      className={`w-4 h-4 ${active ? "text-red-600" : "text-gray-400"}`}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function SocialIcon({ type }: { readonly type: "instagram" | "facebook" }) {
  if (type === "instagram") {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Client Initials
// ---------------------------------------------------------------------------

function ClientInitials({ name, size = "md" }: { readonly name: string; readonly size?: "sm" | "md" }) {
  const initials = name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const sizeClasses = size === "sm"
    ? "w-10 h-10 text-sm rounded-xl"
    : "w-16 h-16 text-xl rounded-2xl";

  return (
    <div className={`${sizeClasses} bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white font-bold shadow-md flex-shrink-0`}>
      {initials}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Client Logo
// ---------------------------------------------------------------------------

function ClientLogo({ client, size = "md" }: { readonly client: Client; readonly size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "w-10 h-10 rounded-xl" : "w-16 h-16 rounded-2xl";

  if (client.logo_url) {
    return (
      <div className={`relative ${sizeClasses} overflow-hidden shadow-md flex-shrink-0 border border-gray-100`}>
        <Image
          src={client.logo_url}
          alt={`${client.name} logo`}
          fill
          className="object-cover"
        />
      </div>
    );
  }

  return <ClientInitials name={client.name} size={size} />;
}

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
          view === "list"
            ? "bg-red-50 text-red-600"
            : "text-gray-500 hover:bg-gray-50"
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
          view === "thumbnails"
            ? "bg-red-50 text-red-600"
            : "text-gray-500 hover:bg-gray-50"
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

function ListView({ clients }: { readonly clients: readonly Client[] }) {
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
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => (
            <tr
              key={client.id}
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 px-4">
                <Link
                  href={`/admin/clients/${client.id}`}
                  className="flex items-center gap-3"
                >
                  <ClientLogo client={client} size="sm" />
                  <span className="font-medium text-red-600 hover:text-red-700 transition-colors">
                    {client.name}
                  </span>
                </Link>
              </td>
              <td className="py-3 px-4 text-gray-600">
                {client.contact_email || "—"}
              </td>
              <td className="py-3 px-4 text-gray-600">
                {client.contact_phone || "—"}
              </td>
              <td className="py-3 px-4">
                <Badge variant={client.is_active ? "active" : "lost"}>
                  {client.is_active ? "Active" : "Inactive"}
                </Badge>
              </td>
              <td className="py-3 px-4 text-gray-400 text-xs">
                {new Date(client.created_at).toLocaleDateString()}
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

function ThumbnailsView({ clients }: { readonly clients: readonly Client[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {clients.map((client) => {
        const hasSocials = client.instagram_url || client.facebook_url;

        return (
          <Link
            key={client.id}
            href={`/admin/clients/${client.id}`}
            className="group rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden hover:shadow-md hover:border-gray-300 transition-all"
          >
            {/* Gradient accent bar */}
            <div className="h-1 bg-gradient-to-r from-red-500 via-red-600 to-orange-500" />

            <div className="p-5">
              <div className="flex items-start gap-4">
                <ClientLogo client={client} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-base font-bold text-gray-900 truncate group-hover:text-red-600 transition-colors">
                      {client.name}
                    </h3>
                    <Badge variant={client.is_active ? "active" : "lost"}>
                      {client.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  {client.company_name && (
                    <p className="text-xs text-gray-500 mb-2">{client.company_name}</p>
                  )}

                  {/* Contact */}
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

                  {/* Social links */}
                  {hasSocials && (
                    <div className="flex items-center gap-3 mt-2">
                      {client.instagram_url && (
                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                          <SocialIcon type="instagram" />
                        </span>
                      )}
                      {client.facebook_url && (
                        <span className="flex items-center gap-1 text-gray-400 text-xs">
                          <SocialIcon type="facebook" />
                        </span>
                      )}
                    </div>
                  )}
                </div>
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

export default function ClientsListView({ clients }: ClientsListViewProps) {
  const [view, setView] = useState<ViewMode>("list");

  return (
    <div>
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
        <ListView clients={clients} />
      ) : (
        <ThumbnailsView clients={clients} />
      )}
    </div>
  );
}
