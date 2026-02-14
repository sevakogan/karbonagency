"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaign } from "@/lib/actions/campaigns";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";
import { ALL_SERVICES, SERVICE_LABELS } from "@/types";
import type { CampaignService } from "@/types";

interface AddProjectFormProps {
  clientId: string;
  onClose: () => void;
}

const AD_SERVICES: ReadonlySet<CampaignService> = new Set([
  "meta_ads",
  "google_ads",
  "tiktok_ads",
]);

export default function AddProjectForm({ clientId, onClose }: AddProjectFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedServices, setSelectedServices] = useState<ReadonlyArray<CampaignService>>([]);
  const [adBudgets, setAdBudgets] = useState<Readonly<Record<string, string>>>({});

  const toggleService = (service: CampaignService) => {
    const isSelected = selectedServices.includes(service);
    if (isSelected) {
      setSelectedServices(selectedServices.filter((s) => s !== service));
      if (AD_SERVICES.has(service)) {
        const { [service]: _, ...rest } = adBudgets;
        setAdBudgets(rest);
      }
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const updateAdBudget = (service: string, value: string) => {
    setAdBudgets({ ...adBudgets, [service]: value });
  };

  const adServicesPicked = selectedServices.filter((s) => AD_SERVICES.has(s));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedServices.length === 0) {
      setError("Select at least one service.");
      return;
    }
    setSaving(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const monthlyCostRaw = formData.get("monthly_cost") as string;
    const monthlyCost = monthlyCostRaw ? Number(monthlyCostRaw) : undefined;

    const parsedBudgets: Record<string, number> = {};
    for (const [key, val] of Object.entries(adBudgets)) {
      if (val && Number(val) > 0) {
        parsedBudgets[key] = Number(val);
      }
    }

    const { error: createError } = await createCampaign({
      client_id: clientId,
      name: formData.get("name") as string,
      services: [...selectedServices],
      monthly_cost: monthlyCost,
      ad_budgets: Object.keys(parsedBudgets).length > 0 ? parsedBudgets : undefined,
      start_date: (formData.get("start_date") as string) || undefined,
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
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Add Project</h2>
        <p className="text-sm text-gray-500 mb-4">
          Create a new project for this client.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div>
            <label className={formStyles.label}>Project Name</label>
            <input
              name="name"
              type="text"
              required
              className={formStyles.input}
              placeholder="e.g., Q1 Marketing Package"
            />
          </div>

          {/* Services Pills */}
          <div>
            <label className={formStyles.label}>Services</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SERVICES.map((service) => {
                const active = selectedServices.includes(service);
                return (
                  <button
                    key={service}
                    type="button"
                    onClick={() => toggleService(service)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {SERVICE_LABELS[service]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Monthly Cost */}
          <div>
            <label className={formStyles.label}>Monthly Cost ($)</label>
            <input
              name="monthly_cost"
              type="number"
              min="0"
              step="0.01"
              className={formStyles.input}
              placeholder="2500"
            />
          </div>

          {/* Ad Budgets — per ad service selected */}
          {adServicesPicked.length > 0 && (
            <div>
              <label className={formStyles.label}>Ad Budget ($)</label>
              <div className="space-y-2">
                {adServicesPicked.map((service) => (
                  <div key={service} className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-24 shrink-0">
                      {SERVICE_LABELS[service]}
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={formStyles.input}
                      placeholder="5000"
                      value={adBudgets[service] ?? ""}
                      onChange={(e) => updateAdBudget(service, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Start Date */}
          <div>
            <label className={formStyles.label}>Start Date</label>
            <input name="start_date" type="date" className={formStyles.input} />
          </div>

          {/* Notes */}
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
