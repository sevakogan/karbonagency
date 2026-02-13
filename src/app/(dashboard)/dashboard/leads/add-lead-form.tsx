"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLead } from "@/lib/actions/leads";

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Add Lead</h2>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Name *</label>
            <input name="name" required className={inputClass} placeholder="John Doe" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Email</label>
              <input name="email" type="email" className={inputClass} placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Phone</label>
              <input name="phone" className={inputClass} placeholder="555-1234" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Company</label>
              <input name="company" className={inputClass} placeholder="Acme Racing" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/60 mb-1">Source</label>
              <select name="source" className={inputClass}>
                <option value="manual" className="bg-zinc-900">Manual</option>
                <option value="website" className="bg-zinc-900">Website</option>
                <option value="referral" className="bg-zinc-900">Referral</option>
                <option value="social" className="bg-zinc-900">Social Media</option>
                <option value="other" className="bg-zinc-900">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">Notes</label>
            <textarea name="notes" rows={3} className={inputClass} placeholder="Any additional details..." />
          </div>

          {status === "error" && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm font-semibold hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {status === "loading" ? "Adding..." : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
