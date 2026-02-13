"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/lib/supabase";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";

export default function SettingsPage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [newPassword, setNewPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", profile!.id);

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      await refreshProfile();
      setStatus("saved");
      setMessage("Profile updated");
    }
  };

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
    <div className="max-w-lg">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Settings</h1>
      <p className="text-sm text-gray-500 mb-8">Manage your profile</p>

      {/* Profile form */}
      <form onSubmit={handleUpdateProfile} className="space-y-4 mb-10">
        <h2 className="text-lg font-bold text-gray-900">Profile</h2>
        <div>
          <label className={formStyles.label}>Email</label>
          <input
            type="email"
            value={profile?.email || ""}
            disabled
            className={`${formStyles.input} opacity-50 cursor-not-allowed`}
          />
        </div>
        <div>
          <label className={formStyles.label}>Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={formStyles.input}
            placeholder="Your name"
          />
        </div>
        <button
          type="submit"
          disabled={status === "saving"}
          className={buttonStyles.primary}
        >
          {status === "saving" ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Password form */}
      <form onSubmit={handleChangePassword} className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
        <div>
          <label className={formStyles.label}>New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={formStyles.input}
            placeholder="New password (min 6 characters)"
            minLength={6}
            required
          />
        </div>
        <button
          type="submit"
          disabled={status === "saving"}
          className={buttonStyles.primary}
        >
          Update Password
        </button>
      </form>

      {status === "saved" && (
        <p className="mt-4 text-sm text-green-600">{message}</p>
      )}
      {status === "error" && (
        <p className="mt-4 text-sm text-red-600">{message}</p>
      )}
    </div>
  );
}
