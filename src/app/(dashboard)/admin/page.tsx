export const dynamic = "force-dynamic";

import Link from "next/link";
import { getClients } from "@/lib/actions/clients";
import { getCampaigns } from "@/lib/actions/campaigns";
import Breadcrumb from "@/components/ui/breadcrumb";
import { buttonStyles } from "@/components/ui/form-styles";
import AdminClientRow from "@/components/dashboard/admin-client-row";

export default async function AdminPanelPage() {
  const clients = await getClients();

  // Fetch campaigns for all clients in parallel
  const campaignsByClient = await Promise.all(
    clients.map(async (client) => {
      const campaigns = await getCampaigns({ clientId: client.id });
      return { clientId: client.id, campaigns };
    })
  );

  const campaignMap = Object.fromEntries(
    campaignsByClient.map((c) => [c.clientId, c.campaigns])
  );

  return (
    <div>
      <Breadcrumb items={[{ label: "Admin Panel" }]} />
      <div className="flex items-center justify-between mt-2 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Admin Panel</h1>
          <p className="text-sm text-gray-500">
            {clients.length} clients · Manage clients, ad accounts, and settings
          </p>
        </div>
        <Link href="/admin/clients/new" className={buttonStyles.primary}>
          Add Client
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-12 text-center">
          <p className="text-gray-400 text-sm">No clients yet</p>
          <Link href="/admin/clients/new" className="text-red-600 text-sm mt-2 inline-block hover:underline">
            Create your first client
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {clients.map((client) => (
            <AdminClientRow
              key={client.id}
              client={client}
              campaigns={campaignMap[client.id] ?? []}
            />
          ))}
        </div>
      )}

      {/* Quick links */}
      <div className="mt-8 flex items-center gap-4 text-sm text-gray-500">
        <Link href="/admin/users" className="hover:text-gray-900 transition-colors">
          Manage Users →
        </Link>
        <Link href="/admin/clients" className="hover:text-gray-900 transition-colors">
          Clients Table View →
        </Link>
      </div>
    </div>
  );
}
