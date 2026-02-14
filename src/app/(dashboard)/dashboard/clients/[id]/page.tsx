export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/lib/actions/clients";
import { getCampaigns } from "@/lib/actions/campaigns";
import Badge from "@/components/ui/badge";
import AddProjectButton from "@/components/dashboard/add-project-button";
import { SERVICE_LABELS } from "@/types";
import type { CampaignService } from "@/types";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDashboardPage({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const campaigns = await getCampaigns({ clientId: id });

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/campaigns" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
            Clients Projects
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-black text-gray-900">{client.name}</h1>
          <Badge variant={client.is_active ? "active" : "lost"}>
            {client.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
        <AddProjectButton clientId={id} />
      </div>
      <p className="text-sm text-gray-500 mb-8">
        {client.contact_email || "No email"} | Slug: {client.slug}
      </p>

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
                <th className="text-left py-3 px-4 font-medium">Services</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Monthly Cost</th>
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
                  <td className="py-3 px-4 text-gray-600">
                    {campaign.monthly_cost ? `$${Number(campaign.monthly_cost).toLocaleString()}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
