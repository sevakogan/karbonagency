"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("saved");
      setMessage("Password updated");
      setNewPassword("");
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Account and security settings</p>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className={formStyles.label}>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={formStyles.input}
              placeholder="Min 6 characters"
              minLength={6}
              required
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={status === "saving"}
              className={buttonStyles.primary}
            >
              {status === "saving" ? "Updating..." : "Update Password"}
            </button>
            {status === "saved" && (
              <span className="text-sm text-green-600">{message}</span>
            )}
            {status === "error" && (
              <span className="text-sm text-red-600">{message}</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
