"use client";

import { useState, useCallback } from "react";
import { DragDropContext, type DropResult } from "@hello-pangea/dnd";
import { useRouter } from "next/navigation";
import KanbanColumn from "@/components/dashboard/kanban-column";
import CreateClientFromLeadModal from "@/components/dashboard/create-client-from-lead-modal";
import { updateLeadStatus } from "@/lib/actions/leads";
import type { Lead, LeadStatus } from "@/types";

const COLUMNS: LeadStatus[] = ["new", "contacted", "qualified", "converted", "lost"];

interface KanbanBoardProps {
  leads: Lead[];
}

function groupByStatus(leads: Lead[]): Record<LeadStatus, Lead[]> {
  const groups: Record<LeadStatus, Lead[]> = {
    new: [],
    contacted: [],
    qualified: [],
    converted: [],
    lost: [],
  };

  for (const lead of leads) {
    groups[lead.status].push(lead);
  }

  return groups;
}

export default function KanbanBoard({ leads: initialLeads }: KanbanBoardProps) {
  const router = useRouter();
  const [leads, setLeads] = useState(initialLeads);
  const [convertedLead, setConvertedLead] = useState<Lead | null>(null);

  const grouped = groupByStatus(leads);

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { draggableId, destination, source } = result;
      if (!destination) return;
      if (
        destination.droppableId === source.droppableId &&
        destination.index === source.index
      ) {
        return;
      }

      const newStatus = destination.droppableId as LeadStatus;
      const draggedLead = leads.find((l) => l.id === draggableId);
      if (!draggedLead) return;

      // Optimistic update
      const updatedLead = { ...draggedLead, status: newStatus };
      setLeads((prev) =>
        prev.map((l) => (l.id === draggableId ? updatedLead : l))
      );

      // If converted, open modal
      if (newStatus === "converted" && draggedLead.status !== "converted") {
        setConvertedLead(updatedLead);
      }

      const { error } = await updateLeadStatus(draggableId, newStatus);
      if (error) {
        console.error("Failed to update lead status:", error);
        // Revert
        setLeads((prev) =>
          prev.map((l) => (l.id === draggableId ? draggedLead : l))
        );
      }
    },
    [leads]
  );

  const handleModalClose = () => {
    setConvertedLead(null);
  };

  const handleClientCreated = () => {
    setConvertedLead(null);
    router.refresh();
  };

  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-3">
          {COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              leads={grouped[status]}
            />
          ))}
        </div>
      </DragDropContext>

      {convertedLead && (
        <CreateClientFromLeadModal
          lead={convertedLead}
          onClose={handleModalClose}
          onCreated={handleClientCreated}
        />
      )}
    </>
  );
}
