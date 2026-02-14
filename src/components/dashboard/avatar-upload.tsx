"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth/auth-provider";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export default function AvatarUpload() {
  const { user, profile, refreshProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, GIF, and WebP images are allowed.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Image must be under 2MB.");
      return;
    }

    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setError(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);

    const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      await refreshProfile();
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const initial = (profile?.full_name || profile?.email || "?")
    .charAt(0)
    .toUpperCase();

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="relative group"
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt="Avatar"
            className="h-16 w-16 rounded-full object-cover border-2 border-gray-200 group-hover:border-red-400 transition-colors"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-lg font-bold text-red-600 border-2 border-gray-200 group-hover:border-red-400 transition-colors">
            {initial}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      </button>
      <div>
        <p className="text-sm text-gray-500">
          {uploading ? "Uploading..." : "Click to change photo"}
        </p>
        <p className="text-xs text-gray-400">JPEG, PNG, GIF, WebP. Max 2MB.</p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  );
}
