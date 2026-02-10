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
          message: formData.get("message"),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage("Thank you! Your message has been sent.");
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-1">Send a Message</h2>
      <p className="text-sm text-gray-500 mb-6">Fill out the form below and we&apos;ll get back to you.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            placeholder="your@email.com"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
            placeholder="(555) 123-4567"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-xs font-semibold text-gray-700 mb-1">Message</label>
          <textarea
            id="message"
            name="message"
            rows={4}
            required
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
            placeholder="How can we help you?"
          />
        </div>

        {status === "success" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-green-50 text-green-700 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 shadow-sm cursor-pointer"
        >
          {status === "submitting" ? "Sending..." : "Send Message"}
        </button>
      </form>
    </div>
  );
}
