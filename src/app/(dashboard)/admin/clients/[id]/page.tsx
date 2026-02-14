export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/lib/actions/clients";
import { getLeads } from "@/lib/actions/leads";
import { getCampaigns } from "@/lib/actions/campaigns";
import LeadsTable from "@/components/dashboard/leads-table";
import Badge from "@/components/ui/badge";
import StatCard from "@/components/dashboard/stat-card";
import AddProjectButton from "@/components/dashboard/add-project-button";

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
        <Link href="/admin/clients" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          Clients
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-2xl font-black text-gray-900">{client.name}</h1>
        <Badge variant={client.is_active ? "active" : "lost"}>
          {client.is_active ? "Active" : "Inactive"}
        </Badge>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        {client.contact_email || "No email"} | Slug: {client.slug}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Leads" value={leads.length} />
        <StatCard label="New Leads" value={leads.filter((l) => l.status === "new").length} />
        <StatCard label="Converted" value={leads.filter((l) => l.status === "converted").length} />
        <StatCard label="Projects" value={campaigns.length} />
      </div>

      {/* Leads section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Leads</h2>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <LeadsTable leads={leads} />
        </div>
      </div>

      {/* Projects section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Projects</h2>
          <AddProjectButton clientId={id} />
        </div>
        {campaigns.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-8 text-center text-gray-400 text-sm">
            No projects yet
          </div>
        ) : (
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left py-3 px-4 font-medium">Name</th>
                  <th className="text-left py-3 px-4 font-medium">Platform</th>
                  <th className="text-left py-3 px-4 font-medium">Status</th>
                  <th className="text-left py-3 px-4 font-medium">Budget</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr key={campaign.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Link
                        href={`/dashboard/campaigns/${campaign.id}`}
                        className="text-red-600 hover:text-red-700 font-medium transition-colors"
                      >
                        {campaign.name}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-gray-600 capitalize">{campaign.platform}</td>
                    <td className="py-3 px-4">
                      <Badge variant={campaign.status}>{campaign.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-600">
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
