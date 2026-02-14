"use client";

import { useCallback } from "react";
import InlineEditableName from "@/components/ui/inline-editable-name";
import { updateClient } from "@/lib/actions/clients";

interface RenameClientNameProps {
  readonly clientId: string;
  readonly initialName: string;
  readonly className?: string;
}

export default function RenameClientName({
  clientId,
  initialName,
  className,
}: RenameClientNameProps) {
  const handleSave = useCallback(
    async (name: string) => {
      return updateClient(clientId, { name });
    },
    [clientId]
  );

  return (
    <InlineEditableName
      initialName={initialName}
      onSave={handleSave}
      className={className}
    />
  );
}
