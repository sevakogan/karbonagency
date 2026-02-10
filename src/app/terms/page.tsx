import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/logo";

export const metadata: Metadata = {
  title: "Terms of Service | Karbon Agency",
  description:
    "Terms of Service for Karbon Agency including SMS messaging terms, opt-out instructions, carrier liability disclaimer, and privacy policy for sim racing business clients.",
  alternates: {
    canonical: "https://karbonagency.com/terms",
  },
};

export default function TermsPage() {
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

        <h1 className="text-3xl font-black mb-2">Terms of Service</h1>
        <p className="text-sm text-white/40 mb-8">Last updated: February 2026</p>

        <div className="space-y-8 text-sm text-white/60 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-2">1. Description of SMS Use Cases</h2>
            <p className="mb-3">
              TheLevelTeam LLC, doing business as Karbon Agency (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;),
              uses SMS messaging to communicate with leads and clients who have opted in through
              our website. SMS messages may include:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Appointment confirmations and reminders for strategy calls</li>
              <li>Follow-up messages regarding your inquiry about our services</li>
              <li>Booking links and scheduling information</li>
              <li>Responses to your questions about Meta & Instagram advertising</li>
              <li>Service updates and promotional information related to sim racing marketing</li>
            </ul>
            <p className="mt-3">
              Message frequency varies based on your interaction with our services. Typically, you
              may receive 2-5 messages per month.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">2. Opt-Out Instructions</h2>
            <p className="mb-3">
              You can opt out of receiving SMS messages at any time using any of the following methods:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                Reply <strong className="text-white">STOP</strong> to any SMS message you receive from us
              </li>
              <li>
                Reply <strong className="text-white">UNSUBSCRIBE</strong> or <strong className="text-white">CANCEL</strong> to
                any SMS message
              </li>
              <li>
                Contact us directly at{" "}
                <a href="tel:+18669966382" className="text-red-400 hover:text-red-300 transition-colors">
                  (866) 996-6382
                </a>{" "}
                and request to be removed
              </li>
              <li>
                Email us at{" "}
                <a href="mailto:support@karbonagency.com" className="text-red-400 hover:text-red-300 transition-colors">
                  support@karbonagency.com
                </a>
              </li>
            </ul>
            <p className="mt-3">
              After opting out, you will receive a final confirmation message and will no longer
              receive SMS messages from Karbon Agency. You may opt back in at any time by
              submitting a new form on our website.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">3. Customer Support Contact</h2>
            <p className="mb-3">
              For any questions, concerns, or issues related to our SMS messaging program or
              services, you can reach us through the following channels:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong className="text-white">Phone:</strong>{" "}
                <a href="tel:+18669966382" className="text-red-400 hover:text-red-300 transition-colors">
                  (866) 996-6382
                </a>
              </li>
              <li>
                <strong className="text-white">Email:</strong>{" "}
                <a href="mailto:support@karbonagency.com" className="text-red-400 hover:text-red-300 transition-colors">
                  support@karbonagency.com
                </a>
              </li>
              <li>
                <strong className="text-white">Website:</strong>{" "}
                <Link href="/contact" className="text-red-400 hover:text-red-300 transition-colors">
                  karbonagency.com/contact
                </Link>
              </li>
            </ul>
            <p className="mt-3">
              Reply <strong className="text-white">HELP</strong> to any SMS message for immediate
              assistance and support information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">4. Message & Data Rate Disclosure</h2>
            <p>
              Standard message and data rates may apply to any SMS messages sent or received.
              Message frequency varies. Your mobile carrier&apos;s standard messaging rates will apply
              to all text messages. Karbon Agency is not responsible for any charges incurred from
              your mobile carrier for sending or receiving text messages. Please contact your
              mobile carrier for details about your specific text messaging plan.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">5. Carrier Liability Disclaimer</h2>
            <p>
              Carriers (including but not limited to T-Mobile, AT&T, Verizon, and other mobile
              service providers) are not liable for delayed or undelivered messages. Message
              delivery is subject to effective transmission from your mobile carrier and network
              availability. Karbon Agency and mobile carriers are not responsible for any delays
              in sending or receiving text messages, as delivery is subject to effective
              transmission by your mobile service provider. Neither Karbon Agency nor any mobile
              carrier shall be liable for any damages arising from or relating to the SMS
              messaging service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">6. Age Restriction</h2>
            <p>
              Our SMS messaging program and services are intended for users who are at least 18
              years of age. By opting in to receive SMS messages from Karbon Agency, you confirm
              that you are at least 18 years old. If we become aware that a person under 18 has
              opted in to our messaging program, we will promptly remove their information and
              opt them out of all communications.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">7. Privacy Policy</h2>
            <p>
              Your privacy is important to us. We do not sell, rent, or share your personal
              information, including your phone number, with third parties for marketing purposes.
              All personal data collected through our forms is used solely for the purposes
              described in our{" "}
              <Link href="/privacy" className="text-red-400 hover:text-red-300 transition-colors">
                Privacy Policy
              </Link>.
              Your consent to receive SMS messages is not a condition of purchasing any goods or
              services from Karbon Agency.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">8. Use of Services</h2>
            <p>
              By accessing our website at karbonagency.com or using any of our services, you
              agree to these Terms of Service. Karbon Agency provides Meta & Instagram advertising
              services for sim racing businesses, including but not limited to ad campaign
              management, lead generation, and marketing strategy consultations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">9. Changes to These Terms</h2>
            <p>
              We reserve the right to modify these Terms of Service at any time. Any changes will
              be posted on this page with an updated revision date. Your continued use of our
              services after any changes constitutes your acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-2">10. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
              <li>
                <strong className="text-white">Phone:</strong>{" "}
                <a href="tel:+18669966382" className="text-red-400 hover:text-red-300 transition-colors">
                  (866) 996-6382
                </a>
              </li>
              <li>
                <strong className="text-white">Email:</strong>{" "}
                <a href="mailto:support@karbonagency.com" className="text-red-400 hover:text-red-300 transition-colors">
                  support@karbonagency.com
                </a>
              </li>
              <li>
                <strong className="text-white">Website:</strong>{" "}
                <Link href="/contact" className="text-red-400 hover:text-red-300 transition-colors">
                  karbonagency.com/contact
                </Link>
              </li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 text-center text-xs text-white/20">
          <p>&copy; {new Date().getFullYear()} TheLevelTeam LLC, DBA Karbon Agency. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
