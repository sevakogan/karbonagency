"use client";

import Link from "next/link";
import ParallaxSection from "@/components/parallax-section";

export default function Home() {
  return (
    <div className="bg-black text-white">

      {/* ============ HERO ============ */}
      <section className="hero-bg relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />

        <ParallaxSection speed={0.15} className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold tracking-wide uppercase mb-8">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            The Only Agency of Its Kind
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6">
            We Fill{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Sim Racing
            </span>{" "}
            Seats.
            <br />
            <span className="text-white/60">That&apos;s All We Do.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Meta & Instagram ads built exclusively for racing simulator businesses.
            We know the audience. We know the creative. We know what converts.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/contact"
              className="cta-glow w-full sm:w-auto px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-base hover:bg-red-700 active:bg-red-800 transition-all duration-200 text-center"
            >
              Book a Free Strategy Call
            </Link>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/20 text-white/70 font-semibold text-base hover:bg-white/5 hover:text-white transition-all duration-200 text-center"
            >
              See How It Works
            </a>
          </div>

          {/* Social proof line */}
          <p className="mt-12 text-xs text-white/25 tracking-wide uppercase">
            Trusted by sim racing venues across the country
          </p>
        </ParallaxSection>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 float-anim">
          <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* ============ PAIN POINTS ============ */}
      <section className="py-20 sm:py-28 px-4 bg-zinc-950 overflow-hidden">
        <ParallaxSection speed={0.08} className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">
            Sound Familiar?
          </h2>
          <p className="text-white/40 text-center mb-14 max-w-xl mx-auto">
            Most sim racing businesses run into the same walls when trying to grow.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", text: "You've tried boosting posts on Instagram but bookings barely moved" },
              { icon: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", text: "Generic marketing agencies don't understand your customer" },
              { icon: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6", text: "Weekday sessions are empty while weekends are overbooked" },
              { icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z", text: "You're spending on ads but have no idea what's actually working" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="shrink-0 w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <p className="text-white/70 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </ParallaxSection>
      </section>

      {/* ============ WHAT WE DO ============ */}
      <section className="py-20 sm:py-28 px-4 bg-black overflow-hidden">
        <ParallaxSection speed={0.1} className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold tracking-wide uppercase mb-6">
            Our Specialty
          </div>

          <h2 className="text-3xl sm:text-4xl font-black mb-4">
            Meta & Instagram Ads.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Sim Racing Only.
            </span>
          </h2>
          <p className="text-white/40 max-w-2xl mx-auto mb-14 leading-relaxed">
            We don&apos;t do restaurants. We don&apos;t do dentists. We run paid social
            for racing simulator businesses&mdash;and that laser focus is why we outperform
            every generalist agency out there.
          </p>

          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                title: "Hyper-Targeted Ads",
                desc: "We know exactly who books sim racing sessions&mdash;motorsport fans, gamers, corporate event planners, car enthusiasts. We target them with precision.",
                icon: "M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122",
              },
              {
                title: "Creative That Converts",
                desc: "High-energy video ads, carousel hooks, and story sequences built around the thrill of sim racing. We speak the language your customers feel.",
                icon: "M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z",
              },
              {
                title: "Seats Filled, Period",
                desc: "Weekday gaps? Corporate events? Birthday parties? We build campaigns around your actual availability and revenue goals.",
                icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="text-left p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-red-500/20 hover:bg-red-500/[0.03] transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: item.desc }} />
              </div>
            ))}
          </div>
        </ParallaxSection>
      </section>

      {/* ============ WHY US / PROOF ============ */}
      <section className="py-20 sm:py-28 px-4 bg-zinc-950 overflow-hidden">
        <ParallaxSection speed={0.08} className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">
            Why Sim Racing Businesses Choose Us
          </h2>
          <p className="text-white/40 text-center mb-14 max-w-xl mx-auto">
            We&apos;re not guessing. We&apos;ve been in the sim racing world.
          </p>

          <div className="grid sm:grid-cols-2 gap-8">
            {/* Stat cards */}
            {[
              { stat: "100%", label: "Focused on Sim Racing", sub: "Not 1 of 50 industries. The only one." },
              { stat: "Meta + IG", label: "Platform Specialists", sub: "Where your customers actually spend their time." },
              { stat: "Full Funnel", label: "Awareness to Booking", sub: "From first scroll to confirmed reservation." },
              { stat: "Data-Led", label: "Every Dollar Tracked", sub: "You see exactly what your ad spend delivers." },
            ].map((item, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]"
              >
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-1">
                  {item.stat}
                </div>
                <div className="text-white font-bold text-sm mb-1">{item.label}</div>
                <div className="text-white/30 text-xs">{item.sub}</div>
              </div>
            ))}
          </div>
        </ParallaxSection>
      </section>

      {/* ============ RESULTS / AD STATS ============ */}
      <section className="py-20 sm:py-28 px-4 bg-black overflow-hidden">
        <ParallaxSection speed={0.1} className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-semibold tracking-wide uppercase mb-6">
              Real Results
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              The Numbers{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                Speak for Themselves
              </span>
            </h2>
            <p className="text-white/40 max-w-2xl mx-auto leading-relaxed">
              Here&apos;s what our Meta &amp; Instagram campaigns deliver for sim racing businesses.
            </p>
          </div>

          {/* Big stat highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { value: "—", label: "Avg. Cost per Booking" },
              { value: "—", label: "Return on Ad Spend" },
              { value: "—", label: "Bookings Generated" },
              { value: "—", label: "Ad Spend Managed" },
            ].map((item, i) => (
              <div
                key={i}
                className="text-center p-5 rounded-2xl border border-white/5 bg-white/[0.02]"
              >
                <div className="text-2xl sm:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-1">
                  {item.value}
                </div>
                <div className="text-white/40 text-xs sm:text-sm">{item.label}</div>
              </div>
            ))}
          </div>

          {/* Campaign performance cards - placeholder for detailed stats */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                </svg>
                Meta Ads Performance
              </h3>
              <p className="text-white/30 text-sm mb-4">Facebook campaign metrics across our sim racing clients.</p>
              <div className="space-y-3">
                {[
                  { metric: "Click-Through Rate", value: "—" },
                  { metric: "Cost per Click", value: "—" },
                  { metric: "Conversion Rate", value: "—" },
                  { metric: "Cost per Lead", value: "—" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/50 text-sm">{row.metric}</span>
                    <span className="text-white font-bold text-sm">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
                Instagram Ads Performance
              </h3>
              <p className="text-white/30 text-sm mb-4">Instagram campaign metrics across our sim racing clients.</p>
              <div className="space-y-3">
                {[
                  { metric: "Engagement Rate", value: "—" },
                  { metric: "Cost per Engagement", value: "—" },
                  { metric: "Story Ad CTR", value: "—" },
                  { metric: "Reel Views per $1", value: "—" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/50 text-sm">{row.metric}</span>
                    <span className="text-white font-bold text-sm">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ParallaxSection>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="py-20 sm:py-28 px-4 bg-black overflow-hidden">
        <ParallaxSection speed={0.08} className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-black text-center mb-4">
            How It Works
          </h2>
          <p className="text-white/40 text-center mb-14 max-w-xl mx-auto">
            Three steps. No fluff. Just results.
          </p>

          <div className="space-y-8">
            {[
              {
                step: "01",
                title: "Free Strategy Call",
                desc: "We learn about your venue, your goals, and your current marketing. 15 minutes, no pitch, just clarity.",
              },
              {
                step: "02",
                title: "Custom Campaign Build",
                desc: "We build your Meta & Instagram ad campaigns from scratch&mdash;targeting, creative, copy, landing pages. All tailored to sim racing.",
              },
              {
                step: "03",
                title: "Launch & Optimize",
                desc: "Ads go live. We monitor daily, optimize weekly, and report monthly. You watch bookings climb.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-6 p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-red-500/20 transition-colors"
              >
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-black text-lg">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1">{item.title}</h3>
                  <p className="text-white/40 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: item.desc }} />
                </div>
              </div>
            ))}
          </div>
        </ParallaxSection>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="py-20 sm:py-28 px-4 bg-gradient-to-b from-zinc-950 to-black overflow-hidden">
        <ParallaxSection speed={0.12} className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-black mb-4 leading-tight">
            Ready to Fill Every{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Seat
            </span>
            ?
          </h2>
          <p className="text-white/40 mb-10 max-w-lg mx-auto leading-relaxed">
            Stop guessing with your ad spend. Talk to the only team that lives
            and breathes sim racing marketing.
          </p>

          <Link
            href="/contact"
            className="cta-glow inline-block px-10 py-4 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 active:bg-red-800 transition-all duration-200"
          >
            Book Your Free Strategy Call
          </Link>

          <p className="mt-6 text-xs text-white/20">
            No contracts. No commitments. Just a conversation.
          </p>
        </ParallaxSection>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="py-8 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-white/30 text-xs">
            SIMS Marketing &mdash; Meta & Instagram Ads for Sim Racing
          </div>
          <div className="flex items-center gap-6">
            <Link href="/contact" className="text-white/30 text-xs hover:text-white/60 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
