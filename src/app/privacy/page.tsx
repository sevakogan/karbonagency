import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/logo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Karbon Agency privacy policy covering data collection, SMS messaging consent, and information protection for sim racing business clients.",
  alternates: {
    canonical: "https://karbonagency.com/privacy",
  },
};

export default function PrivacyPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-3xl mx-auto px-4 py-6">
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

        <h1 className="text-3xl font-black mb-2">Privacy Policy</h1>
        <p className="text-sm text-white/40 mb-8">Last updated: February 2026</p>

        <div className="space-y-8 text-sm text-white/60 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">Information We Collect</h2>
            <p>
              When you submit our contact form, we collect your name, email address, phone number,
              company/venue name, and message. This information is used solely to respond to your
              inquiry and schedule your free strategy call.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">SMS Messaging & Consent</h2>
            <p className="mb-3">
              By checking the SMS consent box on our contact form, you agree to receive text messages
              from Karbon Agency. These messages may include:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Appointment confirmations and reminders</li>
              <li>Follow-up messages regarding your inquiry</li>
              <li>Promotional updates about our services</li>
            </ul>
            <p className="mt-3">
              Message frequency varies. Message and data rates may apply. You can opt out at any
              time by replying <strong className="text-white">STOP</strong> to any message. Reply{" "}
              <strong className="text-white">HELP</strong> for assistance.
            </p>
            <p className="mt-3">
              By opting in, you confirm that you are the owner or authorized user of the mobile
              number provided and that you consent to receive SMS messages at that number.
            </p>
            <p className="mt-3">
              We do not sell, rent, or share your phone number or any personal information with
              third parties for marketing purposes. Your consent to receive SMS messages is not a
              condition of purchasing any goods or services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">How We Use Your Information</h2>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>To respond to your inquiries and schedule consultations</li>
              <li>To send appointment confirmations and reminders via SMS</li>
              <li>To follow up on your interest in our services</li>
              <li>To improve our website and services</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Data Protection</h2>
            <p>
              We take reasonable measures to protect your personal information. Your data is stored
              securely and access is limited to authorized personnel who need it to provide our
              services.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Third-Party Services</h2>
            <p>
              We use trusted third-party services to manage our communications and store contact
              information. These services are bound by their own privacy policies and maintain
              industry-standard security practices.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Your Rights</h2>
            <p>
              You may request to view, update, or delete your personal information at any time by
              contacting us. To stop receiving SMS messages, reply <strong className="text-white">STOP</strong> to
              any text message.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, contact us at{" "}
              <a href="tel:+18669966382" className="text-red-400 hover:text-red-300 transition-colors">
                (866) 996-6382
              </a>,{" "}
              email{" "}
              <a href="mailto:support@karbonagency.com" className="text-red-400 hover:text-red-300 transition-colors">
                support@karbonagency.com
              </a>,{" "}
              or visit our{" "}
              <Link href="/contact" className="text-red-400 hover:text-red-300 transition-colors">
                contact page
              </Link>.
            </p>
            <p className="mt-3">
              For our full Terms of Service including SMS messaging terms, please visit our{" "}
              <Link href="/terms" className="text-red-400 hover:text-red-300 transition-colors">
                Terms of Service
              </Link>{" "}
              page.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-center text-xs text-white/20">
          &copy; {new Date().getFullYear()} Karbon Agency. All rights reserved.
        </div>
      </div>
    </div>
  );
}
