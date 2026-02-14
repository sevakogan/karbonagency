"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaign } from "@/lib/actions/campaigns";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";

interface AddProjectFormProps {
  clientId: string;
  onClose: () => void;
}

export default function AddProjectForm({ clientId, onClose }: AddProjectFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);

    const budgetRaw = formData.get("budget") as string;
    const budget = budgetRaw ? Number(budgetRaw) : undefined;

    const { error: createError } = await createCampaign({
      client_id: clientId,
      name: formData.get("name") as string,
      platform: (formData.get("platform") as string) || "meta",
      budget,
      start_date: (formData.get("start_date") as string) || undefined,
      end_date: (formData.get("end_date") as string) || undefined,
      notes: (formData.get("notes") as string) || undefined,
    });

    if (createError) {
      setError(createError);
      setSaving(false);
      return;
    }

    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Add Project</h2>
        <p className="text-sm text-gray-500 mb-4">
          Create a new project for this client.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={formStyles.label}>Project Name</label>
            <input
              name="name"
              type="text"
              required
              className={formStyles.input}
              placeholder="e.g., Meta Ads Q1"
            />
          </div>
          <div>
            <label className={formStyles.label}>Platform</label>
            <select name="platform" className={formStyles.select}>
              <option value="meta">Meta</option>
              <option value="instagram">Instagram</option>
              <option value="both">Both</option>
            </select>
          </div>
          <div>
            <label className={formStyles.label}>Budget ($)</label>
            <input
              name="budget"
              type="number"
              min="0"
              step="0.01"
              className={formStyles.input}
              placeholder="5000"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={formStyles.label}>Start Date</label>
              <input name="start_date" type="date" className={formStyles.input} />
            </div>
            <div>
              <label className={formStyles.label}>End Date</label>
              <input name="end_date" type="date" className={formStyles.input} />
            </div>
          </div>
          <div>
            <label className={formStyles.label}>Notes</label>
            <textarea
              name="notes"
              rows={3}
              className={formStyles.textarea}
              placeholder="Optional notes..."
            />
          </div>

          {error && <p className={formStyles.error}>{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className={buttonStyles.primary}
            >
              {saving ? "Creating..." : "Create Project"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className={buttonStyles.secondary}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
