export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getClientById } from "@/lib/actions/clients";
import { getLeads } from "@/lib/actions/leads";
import { getCampaigns } from "@/lib/actions/campaigns";
import StatCard from "@/components/dashboard/stat-card";
import ClientInfoCard from "@/components/dashboard/client-info-card";
import AddProjectButton from "@/components/dashboard/add-project-button";
import ProjectsListView from "@/components/dashboard/projects-list-view";

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
      <div className="flex items-center gap-2 mb-4">
        <Link href="/dashboard/campaigns" className="text-gray-400 hover:text-gray-600 text-sm transition-colors">
          Clients
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-600">{client.name}</span>
      </div>

      <ClientInfoCard client={client} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Leads" value={leads.length} />
        <StatCard label="New Leads" value={leads.filter((l) => l.status === "new").length} />
        <StatCard label="Converted" value={leads.filter((l) => l.status === "converted").length} />
        <StatCard label="Projects" value={campaigns.length} />
      </div>

      <ProjectsListView
        campaigns={campaigns}
        clientId={id}
        addButton={<AddProjectButton clientId={id} />}
      />
    </div>
  );
}
