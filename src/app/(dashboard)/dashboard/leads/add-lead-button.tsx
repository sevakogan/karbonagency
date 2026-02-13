"use client";

import { useState } from "react";
import { buttonStyles } from "@/components/ui/form-styles";
import AddLeadForm from "./add-lead-form";

export default function AddLeadButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={buttonStyles.primary}
      >
        + Add Lead
      </button>
      {open && <AddLeadForm onClose={() => setOpen(false)} />}
    </>
  );
}
