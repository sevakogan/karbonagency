"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { updateProfileFields } from "@/lib/actions/profile";
import AvatarUpload from "@/components/dashboard/avatar-upload";
import { formStyles, buttonStyles } from "@/components/ui/form-styles";

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");

    const { error } = await updateProfileFields({
      full_name: fullName || null,
      phone: phone || null,
    });

    if (error) {
      setStatus("error");
      setMessage(error);
    } else {
      await refreshProfile();
      setStatus("saved");
      setMessage("Profile updated");
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-black text-gray-900 mb-1">Profile</h1>
      <p className="text-sm text-gray-500 mb-8">Manage your personal information</p>

      <div className="mb-8">
        <AvatarUpload />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
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
        <div>
          <label className={formStyles.label}>Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={formStyles.input}
            placeholder="(555) 123-4567"
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

      {status === "saved" && (
        <p className="mt-4 text-sm text-green-600">{message}</p>
      )}
      {status === "error" && (
        <p className="mt-4 text-sm text-red-600">{message}</p>
      )}
    </div>
  );
}
