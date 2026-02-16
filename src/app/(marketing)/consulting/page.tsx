import type { Metadata } from "next";
import Link from "next/link";
import Logo from "@/components/logo";
import ParallaxSection from "@/components/parallax-section";
import GuideDownloadButton from "@/components/guide-download-button";

export const metadata: Metadata = {
  title: "Open a Sim Racing Center | Turnkey Consulting",
  description:
    "We build your sim racing center from scratch — location, lease, rigs, staff, marketing, and 30 days of hands-on operations training. You own it. We never do.",
  openGraph: {
    title: "Open a Sim Racing Center | Karbon Agency",
    description:
      "Turnkey sim center consulting. We handle everything from finding your location to training your team — then hand you a fully running business.",
    url: "https://karbonagency.com/consulting",
  },
  alternates: {
    canonical: "https://karbonagency.com/consulting",
  },
};

const steps = [
  {
    step: "01",
    title: "Find Your Location",
    desc: "We scout and evaluate locations based on traffic, demographics, and lease terms to find the best fit for your market.",
  },
  {
    step: "02",
    title: "Help Sign the Lease",
    desc: "We walk you through the lease process and help negotiate terms that protect your investment from day one.",
  },
  {
    step: "03",
    title: "Order & Build the Rigs",
    desc: "From simulator selection to full buildout — we source, order, and assemble everything so your floor is race-ready.",
  },
  {
    step: "04",
    title: "Place the Right Employees",
    desc: "We help recruit, screen, and place staff who understand the sim racing experience and can run your venue.",
  },
  {
    step: "05",
    title: "Build Full Marketing from Day One",
    desc: "Launch-ready ad campaigns, landing pages, and booking funnels so customers are lined up before you even open.",
  },
  {
    step: "06",
    title: "Dial In Social Media",
    desc: "Profiles set up, content strategy in place, and posting cadence locked in — so your brand shows up right from the start.",
  },
  {
    step: "07",
    title: "30-Day Operations Training",
    desc: "We run your center alongside you for 30 days using our proprietary software — teaching every system, process, and workflow.",
  },
  {
    step: "08",
    title: "Full Handoff",
    desc: "The business is 100% yours. We step back. You walk in and operate.",
  },
];

const addOns = [
  { label: "Website Development", icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" },
  { label: "Paid Advertising", icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" },
  { label: "Social Media Management", icon: "M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" },
  { label: "Marketing Strategy", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
];

export default function ConsultingPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      {/* Header */}
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
      </div>

      {/* Hero with Video Background */}
      <section className="relative px-4 pb-16 overflow-hidden">
        {/* Background Video */}
        <div className="absolute inset-0 -top-20 overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-20"
          >
            <source src="/sim-racing-bg.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/60 to-black" />
        </div>

        <ParallaxSection speed={0.12} className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold tracking-wide uppercase mb-6">
            Turnkey Sim Center Buildout
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.1] mb-4">
            We{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Build It.
            </span>{" "}
            You Own It.
          </h1>

          <p className="text-white/50 max-w-xl mx-auto leading-relaxed mb-6">
            Everything you need to open a sim racing center — from finding the
            space to filling the seats. We handle the hardest parts so you can
            walk into a fully running business.
          </p>
          <GuideDownloadButton />
        </ParallaxSection>
      </section>

      {/* 8-Step Process */}
      <section className="py-16 sm:py-20 px-4 bg-zinc-950 overflow-hidden">
        <ParallaxSection speed={0.08} className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-3">
            Everything We Handle
          </h2>
          <p className="text-white/40 text-center mb-12 max-w-lg mx-auto text-sm">
            Eight steps from zero to a running sim racing business.
          </p>

          <div className="space-y-4">
            {steps.map((item) => (
              <div
                key={item.step}
                className="flex items-start gap-5 p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-red-500/20 transition-colors"
              >
                <div className="shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-black text-sm">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-base font-bold mb-1">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ParallaxSection>
      </section>

      {/* Ownership Clarity */}
      <section className="py-16 sm:py-20 px-4 bg-black overflow-hidden">
        <ParallaxSection speed={0.1} className="max-w-2xl mx-auto">
          <div className="p-8 rounded-2xl border border-red-500/20 bg-red-500/[0.04] text-center">
            <h2 className="text-2xl sm:text-3xl font-black mb-3">
              It&apos;s{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                100% Yours
              </span>
            </h2>
            <p className="text-white/50 leading-relaxed max-w-md mx-auto">
              We don&apos;t own it. We don&apos;t operate it. We don&apos;t take
              a cut. Once the buildout is done and your team is trained, the
              business is fully yours.
            </p>
          </div>
        </ParallaxSection>
      </section>

      {/* Ongoing Services */}
      <section className="py-16 sm:py-20 px-4 bg-zinc-950 overflow-hidden">
        <ParallaxSection speed={0.08} className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold tracking-wide uppercase mb-4">
              Optional Add-Ons
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mb-3">
              Keep Us in Your Corner
            </h2>
            <p className="text-white/40 max-w-lg mx-auto text-sm leading-relaxed">
              After handoff, add any of these on a monthly basis. A perfectly
              working system — you just walk in and operate day to day.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {addOns.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-red-500/20 hover:bg-red-500/[0.03] transition-all duration-300"
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={item.icon}
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
            ))}
          </div>
        </ParallaxSection>
      </section>

      {/* The Hardest Problem */}
      <section className="py-16 sm:py-20 px-4 bg-black overflow-hidden">
        <ParallaxSection speed={0.1} className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-black mb-3">
            We Solve the{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Hardest Problem
            </span>
          </h2>
          <p className="text-white/50 max-w-md mx-auto leading-relaxed text-lg">
            Bringing people to your door.
          </p>
        </ParallaxSection>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-20 px-4 bg-gradient-to-b from-zinc-950 to-black overflow-hidden">
        <ParallaxSection speed={0.12} className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-4xl font-black mb-3 leading-tight">
            Ready to Open Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Sim Center
            </span>
            ?
          </h2>
          <p className="text-white/40 mb-8 max-w-md mx-auto leading-relaxed text-sm">
            Let&apos;s talk about your market, your budget, and your timeline.
            No commitments — just a conversation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="cta-glow w-full sm:w-auto px-10 py-4 rounded-xl bg-red-600 text-white font-bold text-base hover:bg-red-700 active:bg-red-800 transition-all duration-200 text-center"
            >
              Book a Consultation
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-10 py-4 rounded-xl border border-white/20 text-white/70 font-semibold text-base hover:bg-white/5 hover:text-white transition-all duration-200 text-center"
            >
              Request More Info
            </Link>
          </div>
        </ParallaxSection>
      </section>
    </div>
  );
}
