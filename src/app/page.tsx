import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center px-4">
      {/* Glass card */}
      <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-8 text-center shadow-2xl">
        {/* Logo placeholder */}
        <div className="mb-6">
          <div className="inline-block rounded-xl bg-white/90 p-4 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-800">Your Logo</h2>
          </div>
        </div>

        {/* App name */}
        <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
          Baseline App
        </h1>
        <p className="text-sm text-blue-200/60 mb-8">
          Your tagline goes here
        </p>

        {/* CTA */}
        <Link
          href="/contact"
          className="block w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 shadow-lg"
        >
          Get in Touch
        </Link>

        <p className="mt-6 text-[10px] text-blue-200/30">
          Built with Next.js + Supabase + Tailwind
        </p>
      </div>
    </div>
  );
}
