export const dynamic = "force-dynamic";

import { createSupabaseServer } from "@/lib/supabase-server";
import { getLeads } from "@/lib/actions/leads";
import LeadsTable from "@/components/dashboard/leads-table";
import AddLeadButton from "./add-lead-button";
import { formStyles } from "@/components/ui/form-styles";
import { buttonStyles } from "@/components/ui/form-styles";
import type { LeadStatus } from "@/types";

interface Props {
  searchParams: Promise<{ status?: string; search?: string; clientId?: string }>;
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
    clientId: params.clientId,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">
            {isAdmin ? "All Leads" : "My Leads"}
          </h1>
          <p className="text-sm text-gray-500">{leads.length} total</p>
        </div>
        <AddLeadButton />
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <form className="flex gap-3" action="/dashboard/leads">
          {params.clientId && (
            <input type="hidden" name="clientId" value={params.clientId} />
          )}
          <input
            name="search"
            type="text"
            placeholder="Search leads..."
            defaultValue={params.search || ""}
            className={`${formStyles.input} w-64`}
          />
          <select
            name="status"
            defaultValue={params.status || ""}
            className={formStyles.select}
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
          </select>
          <button type="submit" className={buttonStyles.primary}>
            Filter
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <LeadsTable leads={leads} showClientColumn={isAdmin} />
      </div>
    </div>
  );
}
