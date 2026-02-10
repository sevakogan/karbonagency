"use client";

import { useState, useCallback } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          phone: formData.get("phone"),
          company: formData.get("company"),
          message: formData.get("message"),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage("We got your message! We'll be in touch within 24 hours.");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to send. Please try again.");
    }
  }, []);

  const inputClass = "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
      <h2 className="text-xl font-bold mb-1">Tell Us About Your Venue</h2>
      <p className="text-sm text-white/40 mb-6">Fill out the form and we&apos;ll reach out to schedule your free strategy call.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Name | Company Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-white/60 mb-1">Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className={inputClass}
              placeholder="Your name"
            />
          </div>
          <div>
            <label htmlFor="company" className="block text-xs font-semibold text-white/60 mb-1">Company / Venue Name</label>
            <input
              id="company"
              name="company"
              type="text"
              className={inputClass}
              placeholder="Your business name"
            />
          </div>
        </div>

        {/* Row 2: Phone | Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phone" className="block text-xs font-semibold text-white/60 mb-1">Phone <span className="text-red-400">*</span></label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              className={inputClass}
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-white/60 mb-1">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className={inputClass}
              placeholder="your@email.com"
            />
          </div>
        </div>

        {/* Row 3: Message */}
        <div>
          <label htmlFor="message" className="block text-xs font-semibold text-white/60 mb-1">Message</label>
          <textarea
            id="message"
            name="message"
            rows={3}
            required
            className={`${inputClass} resize-none`}
            placeholder="Tell us about your sim racing business — how many rigs, current marketing, goals..."
          />
        </div>

        {/* SMS Consent */}
        <div className="flex items-start gap-3">
          <input
            id="sms-consent"
            name="smsConsent"
            type="checkbox"
            required
            className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 text-red-500 focus:ring-red-500/50 accent-red-600 cursor-pointer shrink-0"
          />
          <label htmlFor="sms-consent" className="text-xs text-white/40 leading-relaxed cursor-pointer">
            By checking this box, you agree to receive SMS messages from Karbon Agency, including appointment confirmations, reminders, and follow-ups. Message frequency varies (approx. 2-5 msgs/month). Message & data rates may apply. Reply STOP to opt out at any time. Reply HELP for help. Consent is not a condition of purchase. View our{" "}
            <a href="/terms" className="text-red-400 hover:text-red-300 transition-colors underline">Terms of Service</a>{" "}and{" "}
            <a href="/privacy" className="text-red-400 hover:text-red-300 transition-colors underline">Privacy Policy</a>.
          </label>
        </div>

        {status === "success" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="cta-glow w-full py-3.5 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 active:bg-red-800 transition-all duration-200 disabled:opacity-50 cursor-pointer"
        >
          {status === "submitting" ? "Sending..." : "Get My Free Strategy Call"}
        </button>

        <p className="text-center text-xs text-white/20">
          No spam. No obligations. Just a conversation about growing your business. View our{" "}
          <a href="/privacy" className="underline hover:text-white/40 transition-colors">Privacy Policy</a>{" "}and{" "}
          <a href="/terms" className="underline hover:text-white/40 transition-colors">Terms of Service</a>.
        </p>
      </form>
    </div>
  );
}
