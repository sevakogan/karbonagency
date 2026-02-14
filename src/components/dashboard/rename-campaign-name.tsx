"use client";

import { useCallback } from "react";
import InlineEditableName from "@/components/ui/inline-editable-name";
import { updateCampaign } from "@/lib/actions/campaigns";

interface RenameCampaignNameProps {
  readonly campaignId: string;
  readonly initialName: string;
  readonly className?: string;
}

export default function RenameCampaignName({
  campaignId,
  initialName,
  className,
}: RenameCampaignNameProps) {
  const handleSave = useCallback(
    async (name: string) => {
      return updateCampaign(campaignId, { name });
    },
    [campaignId]
  );

  return (
    <InlineEditableName
      initialName={initialName}
      onSave={handleSave}
      className={className}
    />
  );
}
