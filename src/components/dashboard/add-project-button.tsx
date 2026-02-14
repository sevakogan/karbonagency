"use client";

import { useState } from "react";
import AddProjectForm from "@/components/dashboard/add-project-form";
import { buttonStyles } from "@/components/ui/form-styles";

interface AddProjectButtonProps {
  clientId: string;
}

export default function AddProjectButton({ clientId }: AddProjectButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} className={buttonStyles.primary}>
        Add Project
      </button>
      {open && (
        <AddProjectForm clientId={clientId} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
