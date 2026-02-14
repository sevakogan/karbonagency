"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/actions/clients";
import Breadcrumb from "@/components/ui/breadcrumb";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";

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

  return (
    <div className="max-w-lg">
      <Breadcrumb items={[{ label: "Admin", href: "/admin" }, { label: "Clients", href: "/admin/clients" }, { label: "New Client" }]} />
      <h1 className="text-2xl font-black text-gray-900 mt-2 mb-1">Add Client</h1>
      <p className="text-sm text-gray-500 mb-8">Create a new sim racing venue client</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={formStyles.label}>
            Venue Name <span className="text-red-600">*</span>
          </label>
          <input name="name" required className={formStyles.input} placeholder="e.g. SpeedZone Racing" />
        </div>

        <div>
          <label className={formStyles.label}>
            Slug <span className="text-red-600">*</span>
          </label>
          <input
            name="slug"
            required
            className={formStyles.input}
            placeholder="e.g. speedzone-racing"
            pattern="[a-z0-9-]+"
            title="Lowercase letters, numbers, and hyphens only"
          />
        </div>

        <div>
          <label className={formStyles.label}>Contact Email</label>
          <input name="contact_email" type="email" className={formStyles.input} placeholder="contact@venue.com" />
        </div>

        <div>
          <label className={formStyles.label}>Contact Phone</label>
          <input name="contact_phone" type="tel" className={formStyles.input} placeholder="(555) 123-4567" />
        </div>

        <div>
          <label className={formStyles.label}>GHL Location ID</label>
          <input name="ghl_location_id" className={formStyles.input} placeholder="Optional GoHighLevel location ID" />
        </div>

        {status === "error" && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "saving"}
          className={`w-full ${buttonStyles.primary}`}
        >
          {status === "saving" ? "Creating..." : "Create Client"}
        </button>
      </form>
    </div>
  );
}
