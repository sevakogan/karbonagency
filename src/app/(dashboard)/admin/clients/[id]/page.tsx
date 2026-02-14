export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getClientById } from "@/lib/actions/clients";
import { getCampaigns } from "@/lib/actions/campaigns";
import Breadcrumb from "@/components/ui/breadcrumb";
import StatCard from "@/components/dashboard/stat-card";
import ClientInfoCard from "@/components/dashboard/client-info-card";
import AddProjectButton from "@/components/dashboard/add-project-button";
import ProjectsListView from "@/components/dashboard/projects-list-view";
import RenameClientName from "@/components/dashboard/rename-client-name";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: Props) {
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const campaigns = await getCampaigns({ clientId: id });

  const activeProjects = campaigns.filter((c) => c.status === "active").length;
  const totalMonthly = campaigns.reduce((sum, c) => sum + (Number(c.monthly_cost) || 0), 0);
  const totalAdBudget = campaigns.reduce((sum, c) => {
    const budgets = c.ad_budgets ?? {};
    return sum + Object.values(budgets).reduce((s, v) => s + (Number(v) || 0), 0);
  }, 0);

  return (
    <div>
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Clients", href: "/admin/clients" },
          { label: client.name },
        ]}
      />
      <div className="flex items-center justify-between mt-2 mb-4">
        <RenameClientName clientId={id} initialName={client.name} />
        <AddProjectButton clientId={id} />
      </div>

      <ClientInfoCard client={client} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Projects" value={campaigns.length} />
        <StatCard label="Active" value={activeProjects} />
        <StatCard label="Monthly Cost" value={totalMonthly > 0 ? `$${totalMonthly.toLocaleString()}` : "—"} />
        <StatCard label="Ad Budget" value={totalAdBudget > 0 ? `$${totalAdBudget.toLocaleString()}` : "—"} />
      </div>

      <ProjectsListView
        campaigns={campaigns}
        clientId={id}
        addButton={<AddProjectButton clientId={id} />}
      />
    </div>
  );
}
