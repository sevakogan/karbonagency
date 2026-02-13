"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { inviteClientUser } from "@/lib/actions/users";
import { getClients } from "@/lib/actions/clients";
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

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Email</label>
          <input name="email" type="email" required className={inputClass} placeholder="user@venue.com" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Full Name</label>
          <input name="full_name" required className={inputClass} placeholder="John Doe" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Client</label>
          <select name="client_id" required className={inputClass}>
            <option value="" className="bg-zinc-900">Select a client</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id} className="bg-zinc-900">
                {client.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {status === "success" && (
        <p className="text-sm text-green-400">{message}</p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-400">{message}</p>
      )}

      <button
        type="submit"
        disabled={status === "saving"}
        className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
      >
        {status === "saving" ? "Inviting..." : "Invite User"}
      </button>
    </form>
  );
}
