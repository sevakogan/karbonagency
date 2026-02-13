"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/actions/clients";

export default function NewClientPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("saving");
    setErrorMessage("");

    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string).trim();
    const slug = (formData.get("slug") as string).trim();
    const contactEmail = (formData.get("contact_email") as string).trim();
    const contactPhone = (formData.get("contact_phone") as string).trim();
    const ghlLocationId = (formData.get("ghl_location_id") as string).trim();

    const { id, error } = await createClient({
      name,
      slug,
      contact_email: contactEmail || undefined,
      contact_phone: contactPhone || undefined,
      ghl_location_id: ghlLocationId || undefined,
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error);
      return;
    }

    router.push(`/admin/clients/${id}`);
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent";

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-black mb-1">Add Client</h1>
      <p className="text-sm text-white/40 mb-8">Create a new sim racing venue client</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">
            Venue Name <span className="text-red-400">*</span>
          </label>
          <input name="name" required className={inputClass} placeholder="e.g. SpeedZone Racing" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">
            Slug <span className="text-red-400">*</span>
          </label>
          <input
            name="slug"
            required
            className={inputClass}
            placeholder="e.g. speedzone-racing"
            pattern="[a-z0-9-]+"
            title="Lowercase letters, numbers, and hyphens only"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Contact Email</label>
          <input name="contact_email" type="email" className={inputClass} placeholder="contact@venue.com" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Contact Phone</label>
          <input name="contact_phone" type="tel" className={inputClass} placeholder="(555) 123-4567" />
        </div>

        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">GHL Location ID</label>
          <input name="ghl_location_id" className={inputClass} placeholder="Optional GoHighLevel location ID" />
        </div>

        {status === "error" && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "saving"}
          className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {status === "saving" ? "Creating..." : "Create Client"}
        </button>
      </form>
    </div>
  );
}
