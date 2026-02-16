"use client";

import Link from "next/link";
import ParallaxSection from "@/components/parallax-section";
import Logo from "@/components/logo";

export default function Home() {
  return (
    <div className="bg-black text-white">

      {/* ============ NAVBAR ============ */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 bg-black/60 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/consulting"
              className="px-3 py-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold hover:bg-orange-500/20 transition-colors whitespace-nowrap"
            >
              Open a Sim Center
            </Link>
            <Link
              href="/login"
              className="hidden md:inline-block px-3 py-1.5 rounded-lg border border-white/30 text-white text-xs font-semibold hover:bg-white/10 transition-colors whitespace-nowrap"
            >
              Client Dashboard
            </Link>
            <Link
              href="/book"
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors whitespace-nowrap"
            >
              Book a Free Call
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ HERO ============ */}
      <section className="hero-bg relative min-h-screen flex items-center justify-center px-4 pt-20 overflow-hidden">

        <ParallaxSection speed={0.15} className="relative z-10 max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-red-500/40 bg-red-500/10 backdrop-blur-sm mb-8 shadow-[0_0_30px_rgba(239,68,68,0.15)]">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <span className="badge-roll text-sm sm:text-base font-bold tracking-wide uppercase">
              The Only Agency of Its Kind
            </span>
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
              href="/book"
              className="cta-glow w-full sm:w-auto px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-base hover:bg-red-700 active:bg-red-800 transition-all duration-200 text-center"
            >
              Start Your Ads Now
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/20 text-white/70 font-semibold text-base hover:bg-white/5 hover:text-white transition-all duration-200 text-center"
            >
              Request More Info
            </Link>
          </div>
          <Link
            href="/consulting"
            className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl border border-orange-500/30 bg-orange-500/10 text-orange-400 font-semibold text-sm hover:bg-orange-500/20 hover:text-orange-300 transition-all duration-200"
          >
            Open a Sim Center &rarr;
          </Link>

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
            <p className="text-white/40 max-w-2xl mx-auto leading-relaxed mb-8">
              Here&apos;s what our Meta &amp; Instagram campaigns deliver for sim racing businesses.
            </p>
            <Link
              href="/book"
              className="cta-glow inline-block px-8 py-4 rounded-xl bg-red-600 text-white font-bold text-base hover:bg-red-700 active:bg-red-800 transition-all duration-200"
            >
              Get These Results for Your Venue
            </Link>
          </div>

          {/* Big stat highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              { value: "$5.03", label: "Avg. Cost per Booking" },
              { value: "7.7M+", label: "Impressions Delivered" },
              { value: "20,600+", label: "Bookings Generated" },
              { value: "$104K+", label: "Ad Spend Managed" },
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

          {/* Real Meta Ads screenshot */}
          <div className="relative mb-10 rounded-2xl border border-white/10 overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.12)]">
            <img
              src="/SA_M1.png"
              alt="Meta Ads Manager showing 2,344 website purchases from a single sim racing campaign"
              className="w-full h-auto"
              loading="lazy"
            />
            {/* Dark tinted overlay to blend with site theme */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/30 via-red-950/15 to-orange-950/20 mix-blend-multiply pointer-events-none" />
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
          </div>

          {/* Campaign performance breakdown */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                </svg>
                Meta Ads Performance
              </h3>
              <p className="text-white/30 text-sm mb-4">Real campaign metrics from our sim racing venue clients.</p>
              <div className="space-y-3">
                {[
                  { metric: "Cost per Booking", value: "$5.03 – $14.60" },
                  { metric: "Best Performing CPB", value: "$5.03" },
                  { metric: "Total Bookings", value: "20,600+" },
                  { metric: "People Reached", value: "2.3M+" },
                  { metric: "Avg. CPM", value: "$11.56" },
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
                <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Why Our Ads Work
              </h3>
              <p className="text-white/30 text-sm mb-4">The Karbon difference — built for sim racing from day one.</p>
              <div className="space-y-3">
                {[
                  { icon: "🎯", text: "Audiences built from real motorsport & gaming behavior" },
                  { icon: "🎬", text: "High-energy creative that stops the scroll" },
                  { icon: "📊", text: "Weekly optimization — never \"set it and forget it\"" },
                  { icon: "📅", text: "Campaigns shaped around your peak & off-peak hours" },
                  { icon: "💬", text: "Dedicated strategist who knows the sim racing world" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                    <span className="text-base">{row.icon}</span>
                    <span className="text-white/50 text-sm">{row.text}</span>
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

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/book"
              className="cta-glow w-full sm:w-auto px-10 py-4 rounded-xl bg-red-600 text-white font-bold text-lg hover:bg-red-700 active:bg-red-800 transition-all duration-200 text-center"
            >
              Book Your Free Strategy Call
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto px-10 py-4 rounded-xl border border-white/20 text-white/70 font-semibold text-lg hover:bg-white/5 hover:text-white transition-all duration-200 text-center"
            >
              Request More Info
            </Link>
          </div>

          <p className="mt-6 text-xs text-white/20">
            No contracts. No commitments. Just a conversation.
          </p>
        </ParallaxSection>
      </section>

      {/* ============ SEO: WHO WE SERVE ============ */}
      <section className="py-16 sm:py-20 px-4 bg-black border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-center mb-4">
            Marketing for Every Type of{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              Racing Experience
            </span>
          </h2>
          <p className="text-white/40 text-center mb-12 max-w-2xl mx-auto text-sm leading-relaxed">
            Whether you run a single-rig setup or a full motorsport entertainment complex, Karbon Agency builds Meta &amp; Instagram ad campaigns tailored to your exact business model.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              "Sim Racing Venues",
              "F1 Simulator Experiences",
              "Drift Simulation Centers",
              "Racing Arcade Lounges",
              "iRacing Centers",
              "Motorsport Entertainment",
              "Virtual Racing Facilities",
              "Esports Racing Venues",
              "Corporate Racing Events",
              "NASCAR Simulator Centers",
              "GT Racing Experiences",
              "Rally Simulation Arcades",
              "IndyCar Simulator Venues",
              "Racing Birthday Parties",
              "Karting & Sim Combos",
              "Multi-Rig Racing Centers",
            ].map((item, i) => (
              <div
                key={i}
                className="px-4 py-3 rounded-xl border border-white/5 bg-white/[0.02] text-center"
              >
                <span className="text-white/50 text-xs font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SEO: LONG-FORM CONTENT FOR AI/SEARCH ============ */}
      <section className="py-16 sm:py-20 px-4 bg-zinc-950">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-black mb-6 text-center">
            The Sim Racing Marketing Agency Built for Growth
          </h2>
          <div className="space-y-4 text-white/35 text-sm leading-relaxed text-justify">
            <p>
              Karbon Agency is the only digital marketing agency in the United States that works exclusively with sim racing businesses. We specialize in Meta advertising (Facebook ads) and Instagram advertising for racing simulator venues, F1 experience centers, drift simulation arcades, motorsport entertainment complexes, and virtual racing facilities.
            </p>
            <p>
              The sim racing industry is booming. From Formula 1 simulator experiences and professional-grade iRacing setups to casual drift simulators and NASCAR racing arcades, more venues are opening every month. But most sim racing business owners struggle with digital marketing because generic agencies don&apos;t understand the motorsport customer. They don&apos;t know the difference between an F1 fan looking for a realistic cockpit experience and a casual gamer wanting to try drifting with friends.
            </p>
            <p>
              That&apos;s where Karbon Agency comes in. We understand the sim racing audience because it&apos;s the only audience we serve. We know that motorsport enthusiasts respond to high-energy cockpit footage. We know that corporate event planners search for team-building racing experiences. We know that parents look for unique birthday party venues featuring racing simulators. And we know exactly how to reach all of them through Meta and Instagram&apos;s advertising platforms.
            </p>
            <p>
              Our services cover every aspect of paid social media advertising for sim racing: campaign strategy, audience targeting, ad creative production, copywriting, A/B testing, conversion tracking, and ongoing optimization. Whether you need to fill empty weekday sessions, promote a new F1 simulator installation, launch a corporate events program, or drive bookings for your drift racing experience, we build campaigns that deliver measurable results.
            </p>
            <p>
              We work with sim racing businesses of all sizes &mdash; from single-location racing lounges to multi-venue motorsport entertainment chains. Our clients include F1 simulator experience centers, professional racing training facilities, casual sim racing arcades, esports racing venues, GT and endurance racing simulators, rally racing experiences, and hybrid venues combining go-karting with sim racing.
            </p>
            <p>
              If you operate a racing simulator business and want to grow through Meta and Instagram advertising, Karbon Agency is the only agency built specifically for you. Book a free strategy call to learn how we can fill every seat in your venue.
            </p>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="py-10 px-4 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
            <div className="flex flex-col items-center sm:items-start gap-2">
              <Logo size="sm" />
              <p className="text-white/20 text-xs">
                Meta & Instagram Ads for Sim Racing Businesses
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/consulting" className="text-white/30 text-xs hover:text-white/60 transition-colors">
                Open a Sim Center
              </Link>
              <Link href="/book" className="text-white/30 text-xs hover:text-white/60 transition-colors">
                Book a Call
              </Link>
              <Link href="/contact" className="text-white/30 text-xs hover:text-white/60 transition-colors">
                Request Info
              </Link>
              <Link href="/privacy" className="text-white/30 text-xs hover:text-white/60 transition-colors">
                Privacy Policy
              </Link>
              <a href="tel:+18669963824" className="text-white/30 text-xs hover:text-white/60 transition-colors">
                (866) 996-META
              </a>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6">
            <p className="text-white/15 text-xs text-center leading-relaxed max-w-3xl mx-auto">
              Karbon Agency specializes in Meta ads and Instagram ads for sim racing businesses, racing simulator venues, F1 experience centers, drift simulation arcades, motorsport entertainment facilities, iRacing centers, esports racing venues, NASCAR simulator experiences, GT racing lounges, rally simulation centers, corporate racing events, and virtual racing facilities across the United States.
            </p>
            <p className="text-white/10 text-xs text-center mt-4">
              &copy; {new Date().getFullYear()} Karbon Agency. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
