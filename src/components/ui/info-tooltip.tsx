"use client";

import { useState } from "react";

interface InfoTooltipProps {
  text: string;
  formula?: string;
}

export default function InfoTooltip({ text, formula }: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500 hover:bg-gray-300 transition-colors"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        onClick={() => setVisible((v) => !v)}
        aria-label="More info"
      >
        ?
      </button>
      {visible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg border border-gray-200 bg-white p-3 shadow-lg z-50 normal-case">
          <p className="text-[11px] text-gray-600 leading-relaxed">{text}</p>
          {formula && (
            <p className="text-[10px] text-gray-400 mt-1.5 font-mono bg-gray-50 rounded px-2 py-1">
              {formula}
            </p>
          )}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
            <div className="h-2 w-2 rotate-45 border-b border-r border-gray-200 bg-white" />
          </div>
        </div>
      )}
    </span>
  );
}
