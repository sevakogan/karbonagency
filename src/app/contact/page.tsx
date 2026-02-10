import Link from "next/link";
import ContactForm from "./contact-form";

export default function ContactPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Book Your Free Strategy Call</h1>
            <p className="text-xs text-white/40">Let&apos;s talk about filling your seats.</p>
          </div>
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
            title="Back to home"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Contact Form */}
      <main className="max-w-2xl mx-auto px-4 pb-12">
        <ContactForm />
      </main>
    </div>
  );
}
