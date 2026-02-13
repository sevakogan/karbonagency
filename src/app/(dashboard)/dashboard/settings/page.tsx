"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/lib/supabase";

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

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent";

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-black mb-1">Settings</h1>
      <p className="text-sm text-white/40 mb-8">Manage your profile</p>

      {/* Profile form */}
      <form onSubmit={handleUpdateProfile} className="space-y-4 mb-10">
        <h2 className="text-lg font-bold">Profile</h2>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Email</label>
          <input
            type="email"
            value={profile?.email || ""}
            disabled
            className={`${inputClass} opacity-50 cursor-not-allowed`}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">Full Name</label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            placeholder="Your name"
          />
        </div>
        <button
          type="submit"
          disabled={status === "saving"}
          className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {status === "saving" ? "Saving..." : "Save Changes"}
        </button>
      </form>

      {/* Password form */}
      <form onSubmit={handleChangePassword} className="space-y-4">
        <h2 className="text-lg font-bold">Change Password</h2>
        <div>
          <label className="block text-xs font-semibold text-white/60 mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={inputClass}
            placeholder="New password (min 6 characters)"
            minLength={6}
            required
          />
        </div>
        <button
          type="submit"
          disabled={status === "saving"}
          className="px-6 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          Update Password
        </button>
      </form>

      {status === "saved" && (
        <p className="mt-4 text-sm text-green-400">{message}</p>
      )}
      {status === "error" && (
        <p className="mt-4 text-sm text-red-400">{message}</p>
      )}
    </div>
  );
}
