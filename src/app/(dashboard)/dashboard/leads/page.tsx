export const dynamic = "force-dynamic";

import { createSupabaseServer } from "@/lib/supabase-server";
import { getLeads } from "@/lib/actions/leads";
import LeadsTable from "@/components/dashboard/leads-table";
import type { LeadStatus } from "@/types";

interface Props {
  searchParams: Promise<{ status?: string; search?: string }>;
}

export default async function LeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const isAdmin = profile?.role === "admin";

  const leads = await getLeads({
    status: params.status as LeadStatus | undefined,
    search: params.search,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black mb-1">
            {isAdmin ? "All Leads" : "My Leads"}
          </h1>
          <p className="text-sm text-white/40">{leads.length} total</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <form className="flex gap-3" action="/dashboard/leads">
          <input
            name="search"
            type="text"
            placeholder="Search leads..."
            defaultValue={params.search || ""}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/50 w-64"
          />
          <select
            name="status"
            defaultValue={params.status || ""}
            className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
          >
            <option value="" className="bg-zinc-900">All Statuses</option>
            <option value="new" className="bg-zinc-900">New</option>
            <option value="contacted" className="bg-zinc-900">Contacted</option>
            <option value="qualified" className="bg-zinc-900">Qualified</option>
            <option value="converted" className="bg-zinc-900">Converted</option>
            <option value="lost" className="bg-zinc-900">Lost</option>
          </select>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
          >
            Filter
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
        <LeadsTable leads={leads} showClientColumn={isAdmin} />
      </div>
    </div>
  );
}
