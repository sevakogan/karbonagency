"use client";

import { useState } from "react";
import GuideModal from "./guide-modal";

export default function GuideDownloadButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 font-semibold text-sm hover:bg-orange-500/20 hover:text-orange-300 transition-all duration-200 cursor-pointer"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        Download Free Guide
      </button>
      <GuideModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
