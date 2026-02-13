"use client";

import { useState, useTransition } from "react";
import Badge from "@/components/ui/badge";
import { updateLeadStatus } from "@/lib/actions/leads";
import { formStyles } from "@/components/ui/form-styles";
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
      <div className="text-center py-12 text-gray-400 text-sm">
        No leads found
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
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
              className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <td className="py-3 px-4 font-medium text-gray-900">{lead.name}</td>
              <td className="py-3 px-4 text-gray-600">{lead.email}</td>
              <td className="py-3 px-4 text-gray-600">{lead.phone}</td>
              {showClientColumn && (
                <td className="py-3 px-4 text-gray-600">{lead.company}</td>
              )}
              <td className="py-3 px-4 text-gray-600">{lead.source}</td>
              <td className="py-3 px-4">
                <select
                  value={lead.status}
                  onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                  disabled={isPending}
                  className={`${formStyles.select} !w-auto !py-1 !px-2 text-xs`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="py-3 px-4 text-gray-400 text-xs">
                {new Date(lead.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
