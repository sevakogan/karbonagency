"use client";

import { Draggable } from "@hello-pangea/dnd";
import type { Lead } from "@/types";

interface KanbanLeadCardProps {
  lead: Lead;
  index: number;
}

export default function KanbanLeadCard({ lead, index }: KanbanLeadCardProps) {
  return (
    <Draggable draggableId={lead.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`rounded-lg border bg-white p-3 shadow-sm transition-shadow ${
            snapshot.isDragging
              ? "border-red-300 shadow-md"
              : "border-gray-200 hover:shadow"
          }`}
        >
          <p className="text-sm font-medium text-gray-900 truncate">
            {lead.name}
          </p>
          {lead.email && (
            <p className="text-xs text-gray-500 truncate mt-0.5">{lead.email}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            {lead.company && (
              <span className="text-xs text-gray-400 truncate">{lead.company}</span>
            )}
            {lead.source && (
              <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {lead.source}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-300 mt-1.5">
            {new Date(lead.created_at).toLocaleDateString()}
          </p>
        </div>
      )}
    </Draggable>
  );
}
