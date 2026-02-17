"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface RangeOption {
  readonly label: string;
  readonly days: number;
}

interface Props {
  readonly options: readonly RangeOption[];
  readonly currentDays: number;
}

export default function DateRangeSelector({ options, currentDays }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelect = useCallback(
    (days: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("range", String(days));
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="flex items-center gap-1 rounded-lg bg-gray-100 p-0.5">
      {options.map((opt) => {
        const isActive = opt.days === currentDays;
        return (
          <button
            key={opt.days}
            type="button"
            onClick={() => handleSelect(opt.days)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              isActive
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
