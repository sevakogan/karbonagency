import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "./contact-form";
import Logo from "@/components/logo";

export const metadata: Metadata = {
  title: "Request More Info | Sim Racing Marketing by Karbon Agency",
  description:
    "Want to learn more about Meta & Instagram advertising for your sim racing business? Fill out the form and our team will get back to you with details tailored to your venue.",
  openGraph: {
    title: "Request More Info | Karbon Agency",
    description:
      "Get more information about Meta & Instagram ad campaigns for your sim racing venue, F1 experience center, drift arcade, or motorsport entertainment business.",
    url: "https://karbonagency.com/contact",
  },
  alternates: {
    canonical: "https://karbonagency.com/contact",
  },
};

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
          <h1 className="text-2xl font-black mb-1">Request More Info</h1>
          <p className="text-sm text-white/40">Tell us about your venue and we&apos;ll send you a custom overview of how Karbon Agency can help fill seats.</p>
        </div>
      </div>

      {/* Contact Form */}
      <main className="max-w-2xl mx-auto px-4 pb-12">
        <ContactForm />
      </main>
    </div>
  );
}
