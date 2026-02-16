"use client";

import { useState, useCallback, useEffect } from "react";

interface GuideModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setStatus("submitting");
      setErrorMessage("");

      const formData = new FormData(e.currentTarget);

      try {
        const res = await fetch("/api/guide", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.get("name"),
            email: formData.get("email"),
          }),
        });

        const data = await res.json();

        if (data.success) {
          setStatus("success");
          // Trigger PDF download
          const link = document.createElement("a");
          link.href = "/sim-center-guide.pdf";
          link.download = "Sim-Center-Guide-Karbon-Agency.pdf";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          setStatus("error");
          setErrorMessage(data.message || "Something went wrong.");
        }
      } catch {
        setStatus("error");
        setErrorMessage("Failed to submit. Please try again.");
      }
    },
    [],
  );

  if (!isOpen) return null;

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
        role="button"
        tabIndex={0}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-950 p-6 sm:p-8 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
          aria-label="Close"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {status === "success" ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <svg
                className="w-7 h-7 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-2">
              Your guide is downloading!
            </h3>
            <p className="text-white/40 text-sm mb-6">
              Check your downloads folder. We&apos;ll also send a copy to your
              email.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl border border-white/20 text-white/70 font-semibold text-sm hover:bg-white/5 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold tracking-wide uppercase mb-3">
                Free Guide
              </div>
              <h3 className="text-xl font-bold mb-1">
                Download the Sim Center Guide
              </h3>
              <p className="text-white/40 text-sm">
                5 pages covering location, rigs, staffing, operations, and
                marketing. Enter your info and it&apos;s yours instantly.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="guide-name"
                  className="block text-xs font-semibold text-white/60 mb-1"
                >
                  Name
                </label>
                <input
                  id="guide-name"
                  name="name"
                  type="text"
                  required
                  className={inputClass}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label
                  htmlFor="guide-email"
                  className="block text-xs font-semibold text-white/60 mb-1"
                >
                  Email
                </label>
                <input
                  id="guide-email"
                  name="email"
                  type="email"
                  required
                  className={inputClass}
                  placeholder="your@email.com"
                />
              </div>

              {status === "error" && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <svg
                    className="w-4 h-4 shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="cta-glow w-full py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 active:bg-red-800 transition-all duration-200 disabled:opacity-50 cursor-pointer"
              >
                {status === "submitting"
                  ? "Sending..."
                  : "Get the Free Guide"}
              </button>

              <p className="text-center text-[10px] text-white/20">
                No spam. We&apos;ll only reach out if you want to talk.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
