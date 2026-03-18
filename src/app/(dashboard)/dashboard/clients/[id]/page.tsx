export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getClientById } from "@/lib/actions/clients";
import AdsManagerClient from "@/components/dashboard/ads-manager-client";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);
  return { title: client ? `${client.name} — Ads Manager` : "Ads Manager" };
}

export default async function ClientAdsManagerPage({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  return (
    <div className="space-y-4">
      {/* Breadcrumb + back link */}
      <div className="flex items-center justify-between">
        <nav className="flex items-center gap-2 text-sm">
          <Link
            href="/dashboard"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            Agency
          </Link>
          <span className="text-gray-300">/</span>
          <span className="font-semibold text-gray-900">{client.name}</span>
          <span className="text-gray-300">/</span>
          <span className="text-gray-500">Ads Manager</span>
        </nav>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors border border-gray-200 rounded-lg px-3 py-1.5 bg-white hover:border-gray-300"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All Clients
        </Link>
      </div>

      {/* Client name + status pill */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-black text-gray-900">{client.name}</h1>
        {client.meta_ad_account_id ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Meta Connected
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
            No Meta Account
          </span>
        )}
      </div>

      {/* Full Ads Manager scoped to this client */}
      <AdsManagerClient initialClientId={id} />
    </div>
  );
}
