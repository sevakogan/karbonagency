"use client";

import { useState, useCallback, useRef, useEffect } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface InlineEditableNameProps {
  readonly initialName: string;
  readonly onSave: (name: string) => Promise<{ error: string | null }>;
  readonly className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function InlineEditableName({
  initialName,
  onSave,
  className = "text-2xl font-black text-gray-900",
}: InlineEditableNameProps) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSave = useCallback(async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === name) {
      setEditing(false);
      setDraft(name);
      return;
    }

    setSaving(true);
    const { error } = await onSave(trimmed);
    setSaving(false);

    if (!error) {
      setName(trimmed);
      setEditing(false);
    }
  }, [draft, name, onSave]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setDraft(name);
  }, [name]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSave();
      } else if (e.key === "Escape") {
        handleCancel();
      }
    },
    [handleSave, handleCancel]
  );

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          disabled={saving}
          className={`${className} bg-transparent border-b-2 border-red-400 outline-none px-0 py-0 min-w-[120px]`}
        />
        {saving && (
          <span className="text-xs text-gray-400 animate-pulse">Saving...</span>
        )}
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`group flex items-center gap-2 text-left ${className}`}
      title="Click to rename"
    >
      <span>{name}</span>
      <svg
        className="w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
        />
      </svg>
    </button>
  );
}
