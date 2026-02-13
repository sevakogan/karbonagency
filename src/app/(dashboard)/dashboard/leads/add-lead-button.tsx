"use client";

import { useState } from "react";
import AddLeadForm from "./add-lead-form";

export default function AddLeadButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors"
      >
        + Add Lead
      </button>
      {open && <AddLeadForm onClose={() => setOpen(false)} />}
    </>
  );
}
