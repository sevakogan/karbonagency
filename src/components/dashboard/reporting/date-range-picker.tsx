"use client";

import { useState, useCallback } from "react";

export interface DateRange {
  since: string;
  until: string;
}

interface Preset {
  readonly label: string;
  readonly days: number;
}

const PRESETS: readonly Preset[] = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function buildRange(days: number): DateRange {
  const now = new Date();
  const since = new Date(now);
  since.setDate(now.getDate() - days);
  return {
    since: formatDate(since),
    until: formatDate(now),
  };
}

interface DateRangePickerProps {
  defaultDays?: number;
  onChange: (range: DateRange) => void;
}

export default function DateRangePicker({
  defaultDays = 30,
  onChange,
}: DateRangePickerProps) {
  const [activeDays, setActiveDays] = useState<number | null>(defaultDays);
  const [customSince, setCustomSince] = useState("");
  const [customUntil, setCustomUntil] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const handlePreset = useCallback(
    (days: number) => {
      setActiveDays(days);
      setShowCustom(false);
      onChange(buildRange(days));
    },
    [onChange]
  );

  const handleCustomApply = useCallback(() => {
    if (!customSince || !customUntil) return;
    setActiveDays(null);
    onChange({ since: customSince, until: customUntil });
  }, [customSince, customUntil, onChange]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <button
          key={preset.days}
          type="button"
          onClick={() => handlePreset(preset.days)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            activeDays === preset.days && !showCustom
              ? "bg-red-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          {preset.label}
        </button>
      ))}

      <button
        type="button"
        onClick={() => setShowCustom((v) => !v)}
        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
          showCustom
            ? "bg-red-600 text-white"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        Custom
      </button>

      {showCustom && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date"
            value={customSince}
            onChange={(e) => setCustomSince(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <span className="text-gray-400 text-sm">to</span>
          <input
            type="date"
            value={customUntil}
            onChange={(e) => setCustomUntil(e.target.value)}
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          <button
            type="button"
            onClick={handleCustomApply}
            disabled={!customSince || !customUntil}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  );
}
