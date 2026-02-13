export const dynamic = "force-dynamic";

import { getUsers } from "@/lib/actions/users";
import Badge from "@/components/ui/badge";
import InviteUserForm from "./invite-user-form";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Users</h1>
          <p className="text-sm text-gray-500">{users.length} total</p>
        </div>
      </div>

      {/* Invite form */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Invite User</h2>
        <InviteUserForm />
      </div>

      {/* Users table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">
            No users yet
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-left py-3 px-4 font-medium">Email</th>
                <th className="text-left py-3 px-4 font-medium">Role</th>
                <th className="text-left py-3 px-4 font-medium">Client</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{user.full_name || "—"}</td>
                  <td className="py-3 px-4 text-gray-600">{user.email}</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.role === "admin" ? "active" : "new"}>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{user.client_name || "—"}</td>
                  <td className="py-3 px-4">
                    <Badge variant={user.is_active ? "active" : "lost"}>
                      {user.is_active ? "Active" : "Inactive"}
                    </Badge>
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
