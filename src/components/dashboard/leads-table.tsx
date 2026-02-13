"use client";

import { useState, useTransition } from "react";
import Badge from "@/components/ui/badge";
import { updateLeadStatus } from "@/lib/actions/leads";
import type { Lead, LeadStatus } from "@/types";

const STATUS_OPTIONS: LeadStatus[] = ["new", "contacted", "qualified", "converted", "lost"];

interface LeadsTableProps {
  leads: Lead[];
  showClientColumn?: boolean;
}

export default function LeadsTable({ leads, showClientColumn }: LeadsTableProps) {
  const [optimisticLeads, setOptimisticLeads] = useState(leads);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (leadId: string, newStatus: LeadStatus) => {
    setOptimisticLeads((prev) =>
      prev.map((lead) =>
        lead.id === leadId ? { ...lead, status: newStatus } : lead
      )
    );

    startTransition(async () => {
      const { error } = await updateLeadStatus(leadId, newStatus);
      if (error) {
        console.error("Failed to update lead status:", error);
        setOptimisticLeads(leads);
      }
    });
  };

  if (optimisticLeads.length === 0) {
    return (
      <div className="text-center py-12 text-white/30 text-sm">
        No leads found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wide">
            <th className="text-left py-3 px-4 font-medium">Name</th>
            <th className="text-left py-3 px-4 font-medium">Email</th>
            <th className="text-left py-3 px-4 font-medium">Phone</th>
            {showClientColumn && (
              <th className="text-left py-3 px-4 font-medium">Company</th>
            )}
            <th className="text-left py-3 px-4 font-medium">Source</th>
            <th className="text-left py-3 px-4 font-medium">Status</th>
            <th className="text-left py-3 px-4 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {optimisticLeads.map((lead) => (
            <tr
              key={lead.id}
              className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
            >
              <td className="py-3 px-4 font-medium">{lead.name}</td>
              <td className="py-3 px-4 text-white/60">{lead.email}</td>
              <td className="py-3 px-4 text-white/60">{lead.phone}</td>
              {showClientColumn && (
                <td className="py-3 px-4 text-white/60">{lead.company}</td>
              )}
              <td className="py-3 px-4 text-white/60">{lead.source}</td>
              <td className="py-3 px-4">
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                  disabled={isPending}
                  className="bg-transparent border border-white/10 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-red-500/50 cursor-pointer"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-zinc-900">
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-4 text-white/40 text-xs">
                {new Date(lead.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
