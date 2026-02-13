"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/logo";
import { supabase } from "@/lib/supabase";

type AuthMode = "password" | "magic-link";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("password");
  const [email, setEmail] = useState("admin@karbonagency.com");
  const [password, setPassword] = useState("admin123");
  const [status, setStatus] = useState<"idle" | "loading" | "magic-sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    router.push("/dashboard");
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus("error");
      setErrorMessage(error.message);
      return;
    }

    setStatus("magic-sent");
  };

  const inputClass =
    "w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent";

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <h1 className="text-xl font-bold mb-1">Sign In</h1>
          <p className="text-sm text-white/40 mb-6">
            Access your dashboard
          </p>

          {status === "magic-sent" ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-sm text-white/70 mb-1">Check your email</p>
              <p className="text-xs text-white/40">
                We sent a login link to <span className="text-white/60">{email}</span>
              </p>
              <button
                onClick={() => setStatus("idle")}
                className="mt-4 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                Try a different method
              </button>
            </div>
          ) : (
            <>
              {/* Mode toggle */}
              <div className="flex rounded-xl bg-white/5 border border-white/10 p-0.5 mb-6">
                <button
                  onClick={() => setMode("password")}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                    mode === "password"
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  Password
                </button>
                <button
                  onClick={() => setMode("magic-link")}
                  className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                    mode === "magic-link"
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white/60"
                  }`}
                >
                  Magic Link
                </button>
              </div>

              <form
                onSubmit={mode === "password" ? handlePasswordLogin : handleMagicLink}
                className="space-y-4"
              >
                <div>
                  <label htmlFor="email" className="block text-xs font-semibold text-white/60 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="your@email.com"
                  />
                </div>

                {mode === "password" && (
                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold text-white/60 mb-1">
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputClass}
                      placeholder="Your password"
                    />
                  </div>
                )}

                {status === "error" && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {errorMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="w-full py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 active:bg-red-800 transition-all duration-200 disabled:opacity-50"
                >
                  {status === "loading"
                    ? "Signing in..."
                    : mode === "password"
                      ? "Sign In"
                      : "Send Magic Link"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          <Link href="/" className="hover:text-white/40 transition-colors">
            &larr; Back to website
          </Link>
        </p>
      </div>
    </div>
  );
}
