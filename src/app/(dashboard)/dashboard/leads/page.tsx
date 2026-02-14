export const dynamic = "force-dynamic";

import { getLeads } from "@/lib/actions/leads";
import Breadcrumb from "@/components/ui/breadcrumb";
import KanbanBoard from "@/components/dashboard/kanban-board";
import AddLeadButton from "./add-lead-button";
import { formStyles } from "@/components/ui/form-styles";
import { buttonStyles } from "@/components/ui/form-styles";

interface Props {
  searchParams: Promise<{ search?: string; clientId?: string }>;
}

export default async function LeadsPage({ searchParams }: Props) {
  const params = await searchParams;
  const leads = await getLeads({
    search: params.search,
    clientId: params.clientId,
  });

  return (
    <div>
      <Breadcrumb items={[{ label: "CRM" }]} />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mt-2 mb-1">CRM</h1>
          <p className="text-sm text-gray-500">{leads.length} total leads</p>
        </div>
        <AddLeadButton />
      </div>

      {/* Search */}
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
          <button type="submit" className={buttonStyles.primary}>
            Search
          </button>
        </form>
      </div>

      <KanbanBoard leads={leads} />
    </div>
  );
}
