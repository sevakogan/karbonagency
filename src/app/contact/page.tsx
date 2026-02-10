import Link from "next/link";
import ContactForm from "./contact-form";

export default function ContactPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Contact Us</h1>
            <p className="text-xs text-gray-500">We&apos;d love to hear from you</p>
          </div>
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            title="Back to home"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Contact Form */}
      <main className="max-w-2xl mx-auto px-4 pb-8">
        <ContactForm />
      </main>
    </div>
  );
}
