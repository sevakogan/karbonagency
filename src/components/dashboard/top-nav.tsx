"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/logo";
import ClientSelector from "@/components/dashboard/client-selector";
import { useAuth } from "@/components/auth/auth-provider";
import type { Client } from "@/types";

interface TabItem {
  label: string;
  href: string;
}

const adminTabs: TabItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "Leads", href: "/dashboard/leads" },
  { label: "Campaigns", href: "/dashboard/campaigns" },
  { label: "Clients", href: "/admin/clients" },
  { label: "Users", href: "/admin/users" },
  { label: "Settings", href: "/dashboard/settings" },
];

const clientTabs: TabItem[] = [
  { label: "Overview", href: "/dashboard" },
  { label: "My Leads", href: "/dashboard/leads" },
  { label: "My Campaigns", href: "/dashboard/campaigns" },
  { label: "Settings", href: "/dashboard/settings" },
];

interface TopNavProps {
  clients: Client[];
}

export default function TopNav({ clients }: TopNavProps) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();

  const isAdmin = profile?.role === "admin";
  const tabs = isAdmin ? adminTabs : clientTabs;

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      {/* Row 1: Logo, client dropdown, user */}
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Logo size="sm" variant="light" />
          </Link>
          {isAdmin && <ClientSelector clients={clients} />}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-600">
              {(profile?.full_name || profile?.email || "?").charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 sm:block">
              {profile?.full_name || "User"}
            </span>
          </div>
          <button
            onClick={signOut}
            className="rounded-lg px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Row 2: Tabs */}
      <div className="mx-auto max-w-7xl px-6">
        <nav className="-mb-px flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const active = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`whitespace-nowrap border-b-2 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-red-600 text-red-600"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
