export const dynamic = "force-dynamic";

import Link from "next/link";
import { getClients } from "@/lib/actions/clients";
import Badge from "@/components/ui/badge";

export default async function ClientsProjectsPage() {
  const clients = await getClients();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            Clients Projects
          </h1>
          <p className="text-sm text-gray-500">{clients.length} clients</p>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {clients.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No clients yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left py-3 px-4 font-medium">Client</th>
                <th className="text-left py-3 px-4 font-medium">Email</th>
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
                      className="font-medium text-red-600 hover:text-red-700 transition-colors"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-gray-600">
                    {client.contact_email || "—"}
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
        )}
      </div>
    </div>
  );
}
