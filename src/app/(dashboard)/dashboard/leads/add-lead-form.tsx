"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLead } from "@/lib/actions/leads";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";

export default function AddLeadForm({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const form = new FormData(e.currentTarget);
    const { error } = await createLead({
      name: form.get("name") as string,
      email: form.get("email") as string,
      phone: form.get("phone") as string,
      company: form.get("company") as string,
      source: form.get("source") as string,
      notes: form.get("notes") as string,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Add Lead</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={formStyles.label}>Name *</label>
            <input name="name" required className={formStyles.input} placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={formStyles.label}>Email</label>
              <input name="email" type="email" className={formStyles.input} placeholder="john@example.com" />
            </div>
            <div>
              <label className={formStyles.label}>Phone</label>
              <input name="phone" className={formStyles.input} placeholder="555-1234" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={formStyles.label}>Company</label>
              <input name="company" className={formStyles.input} placeholder="Acme Racing" />
            </div>
            <div>
              <label className={formStyles.label}>Source</label>
              <select name="source" className={formStyles.select}>
                <option value="manual">Manual</option>
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="social">Social Media</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className={formStyles.label}>Notes</label>
            <textarea name="notes" rows={3} className={formStyles.textarea} placeholder="Any additional details..." />
          </div>

          {status === "error" && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 ${buttonStyles.secondary}`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className={`flex-1 ${buttonStyles.primary}`}
            >
              {status === "loading" ? "Adding..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
