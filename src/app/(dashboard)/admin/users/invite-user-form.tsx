"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { inviteClientUser } from "@/lib/actions/users";
import { getClients } from "@/lib/actions/clients";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";
import type { Client } from "@/types";

export default function InviteUserForm() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    getClients().then(setClients);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("saving");
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim();
    const clientId = formData.get("client_id") as string;
    const fullName = (formData.get("full_name") as string).trim();

    const { error } = await inviteClientUser(email, clientId, fullName);

    if (error) {
      setStatus("error");
      setMessage(error);
      return;
    }

    setStatus("success");
    setMessage("User invited successfully");
    (e.target as HTMLFormElement).reset();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className={formStyles.label}>Email</label>
          <input name="email" type="email" required className={formStyles.input} placeholder="user@venue.com" />
        </div>
        <div>
          <label className={formStyles.label}>Full Name</label>
          <input name="full_name" required className={formStyles.input} placeholder="John Doe" />
        </div>
        <div>
          <label className={formStyles.label}>Client</label>
          <select name="client_id" required className={formStyles.select}>
            <option value="">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === "success" && (
        <p className="text-sm text-green-600">{message}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className={buttonStyles.primary}
      >
        {status === "saving" ? "Inviting..." : "Invite User"}
      </button>
    </form>
  );
}
