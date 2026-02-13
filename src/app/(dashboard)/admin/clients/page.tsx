export const dynamic = "force-dynamic";

import Link from "next/link";
import { getClients } from "@/lib/actions/clients";
import Badge from "@/components/ui/badge";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black mb-1">Clients</h1>
          <p className="text-sm text-white/40">{clients.length} total</p>
        </div>
        <Link
          href="/admin/clients/new"
          className="px-5 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
        >
          Add Client
        </Link>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        {clients.length === 0 ? (
          <div className="text-center py-12 text-white/30 text-sm">
            No clients yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wide">
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-left py-3 px-4 font-medium">Slug</th>
                <th className="text-left py-3 px-4 font-medium">Email</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 px-4">
                    <Link
                      href={`/admin/clients/${client.id}`}
                      className="font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      {client.name}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-white/40 font-mono text-xs">
                    {client.slug}
                  </td>
                  <td className="py-3 px-4 text-white/60">
                    {client.contact_email || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={client.is_active ? "active" : "lost"}>
                      {client.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-white/40 text-xs">
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
