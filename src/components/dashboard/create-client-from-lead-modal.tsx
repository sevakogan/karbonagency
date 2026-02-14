"use client";

import { useState } from "react";
import { createClient } from "@/lib/actions/clients";
import { linkLeadToClient } from "@/lib/actions/leads";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";
import type { Lead } from "@/types";

interface CreateClientFromLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateClientFromLeadModal({
  lead,
  onClose,
  onCreated,
}: CreateClientFromLeadModalProps) {
  const [name, setName] = useState(lead.company || lead.name);
  const [slug, setSlug] = useState(
    (lead.company || lead.name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
  );
  const [email, setEmail] = useState(lead.email);
  const [phone, setPhone] = useState(lead.phone);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const { id: clientId, error: createError } = await createClient({
      name,
      slug,
      contact_email: email || undefined,
      contact_phone: phone || undefined,
    });

    if (createError || !clientId) {
      setError(createError || "Failed to create client");
      setSaving(false);
      return;
    }

    const { error: linkError } = await linkLeadToClient(lead.id, clientId);
    if (linkError) {
      setError(linkError);
      setSaving(false);
      return;
    }

    onCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Create Client from Lead
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          This lead has been converted. Create a client record.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={formStyles.label}>Client Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={formStyles.input}
            />
          </div>
          <div>
            <label className={formStyles.label}>Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              pattern="[a-z0-9-]+"
              className={formStyles.input}
            />
          </div>
          <div>
            <label className={formStyles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={formStyles.input}
            />
          </div>
          <div>
            <label className={formStyles.label}>Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={formStyles.input}
            />
          </div>

          {error && <p className={formStyles.error}>{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className={buttonStyles.primary}
            >
              {saving ? "Creating..." : "Create Client"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={buttonStyles.secondary}
            >
              Skip
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
