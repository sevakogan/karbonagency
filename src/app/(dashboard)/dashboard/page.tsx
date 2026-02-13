export const dynamic = "force-dynamic";

import { createSupabaseServer } from "@/lib/supabase-server";
import StatCard from "@/components/dashboard/stat-card";

export default async function DashboardOverview() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  // Fetch counts based on role (RLS handles scoping)
  const { count: leadCount } = await supabase
    .from("agency_leads")
    .select("*", { count: "exact", head: true });

  const { count: campaignCount } = await supabase
    .from("campaigns")
    .select("*", { count: "exact", head: true });

  const { count: newLeadCount } = await supabase
    .from("agency_leads")
    .select("*", { count: "exact", head: true })
    .eq("status", "new");

  const adminStats = isAdmin
    ? await (async () => {
        const { count: clientCount } = await supabase
          .from("clients")
          .select("*", { count: "exact", head: true });
        const { count: userCount } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });
        return { clientCount, userCount };
      })()
    : null;

  return (
    <div>
      <h1 className="text-2xl font-black mb-1">
        {isAdmin ? "Admin Dashboard" : "Dashboard"}
      </h1>
      <p className="text-sm text-white/40 mb-8">
        Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Leads" value={leadCount ?? 0} />
        <StatCard label="New Leads" value={newLeadCount ?? 0} />
        <StatCard label="Campaigns" value={campaignCount ?? 0} />

        {isAdmin && adminStats ? (
          <>
            <StatCard label="Total Clients" value={adminStats.clientCount ?? 0} />
          </>
        ) : (
          <StatCard label="Status" value="Active" />
        )}
      </div>
    </div>
  );
}
