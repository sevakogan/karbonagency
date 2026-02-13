export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/lib/actions/clients";
import { getLeads } from "@/lib/actions/leads";
import { getCampaigns } from "@/lib/actions/campaigns";
import LeadsTable from "@/components/dashboard/leads-table";
import Badge from "@/components/ui/badge";
import StatCard from "@/components/dashboard/stat-card";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const [leads, campaigns] = await Promise.all([
    getLeads({ clientId: id }),
    getCampaigns({ clientId: id }),
  ]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <Link href="/admin/clients" className="text-white/40 hover:text-white/70 text-sm transition-colors">
          Clients
        </Link>
        <span className="text-white/20">/</span>
        <h1 className="text-2xl font-black">{client.name}</h1>
        <Badge variant={client.is_active ? "active" : "lost"}>
          {client.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
      <p className="text-sm text-white/40 mb-8">
        {client.contact_email || "No email"} | Slug: {client.slug}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Leads" value={leads.length} />
        <StatCard label="New Leads" value={leads.filter((l) => l.status === "new").length} />
        <StatCard label="Converted" value={leads.filter((l) => l.status === "converted").length} />
        <StatCard label="Campaigns" value={campaigns.length} />
      </div>

      {/* Leads section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-4">Leads</h2>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
          <LeadsTable leads={leads} />
        </div>
      </div>

      {/* Campaigns section */}
      <div>
        <h2 className="text-lg font-bold mb-4">Campaigns</h2>
        {campaigns.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-center text-white/30 text-sm">
            No campaigns yet
          </div>
        ) : (
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wide">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Platform</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Budget</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/campaigns/${campaign.id}`}
                        className="text-red-400 hover:text-red-300 font-medium transition-colors"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-white/60 capitalize">{campaign.platform}</td>
                    <td className="py-3 px-4">
                      <Badge variant={campaign.status}>{campaign.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-white/60">
                      {campaign.budget ? `$${Number(campaign.budget).toLocaleString()}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
