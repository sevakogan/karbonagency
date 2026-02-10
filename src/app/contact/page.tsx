import Link from "next/link";
import ContactForm from "./contact-form";
import Logo from "@/components/logo";

export default function ContactPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-8">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <Link
            href="/"
            className="text-white/40 text-sm hover:text-white/70 transition-colors"
          >
            &larr; Back
          </Link>
        </div>
        <div>
          <h1 className="text-2xl font-black mb-1">Book Your Free Strategy Call</h1>
          <p className="text-sm text-white/40">Let&apos;s talk about filling your seats.</p>
        </div>
      </div>

      {/* Contact Form */}
      <main className="max-w-2xl mx-auto px-4 pb-12">
        <ContactForm />
      </main>
    </div>
  );
}
