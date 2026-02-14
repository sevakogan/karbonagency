"use client";

import { Droppable } from "@hello-pangea/dnd";
import KanbanLeadCard from "@/components/dashboard/kanban-lead-card";
import type { Lead, LeadStatus } from "@/types";

const COLUMN_COLORS: Record<LeadStatus, string> = {
  new: "border-t-blue-500",
  contacted: "border-t-yellow-500",
  qualified: "border-t-purple-500",
  converted: "border-t-green-500",
  lost: "border-t-red-500",
};

const COLUMN_LABELS: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  converted: "Converted",
  lost: "Lost",
};

interface KanbanColumnProps {
  status: LeadStatus;
  leads: Lead[];
}

export default function KanbanColumn({ status, leads }: KanbanColumnProps) {
  return (
    <div
      className={`flex flex-col rounded-xl border border-gray-200 border-t-4 bg-gray-50 ${COLUMN_COLORS[status]}`}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <h3 className="text-sm font-semibold text-gray-700">
          {COLUMN_LABELS[status]}
        </h3>
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-medium text-gray-600">
          {leads.length}
        </span>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 space-y-2 px-2 pb-2 min-h-[120px] transition-colors rounded-b-xl ${
              snapshot.isDraggingOver ? "bg-gray-100" : ""
            }`}
          >
            {leads.map((lead, index) => (
              <KanbanLeadCard key={lead.id} lead={lead} index={index} />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
