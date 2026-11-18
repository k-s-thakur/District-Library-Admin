"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  User,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ArrowRight,
  BookOpen,
  Banknote,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [fillFeedback, setFillFeedback] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg("Please enter both your Email / Staff ID and Password.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed. Please verify your credentials.");
      }

      if (data.user?.role === "MEMBER") {
        router.push("/account");
      } else {
        router.push("/staff/overview");
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (email: string, pass: string, label: string) => {
    setIdentifier(email);
    setPassword(pass);
    setErrorMsg("");
    setFillFeedback(`Autofilled credentials for ${label}`);
    setTimeout(() => setFillFeedback(""), 2500);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-[#02281e] via-[#043d2f] to-[#012219] text-slate-100">
      {/* Top Bar with Govt Identifier */}
      <header className="w-full border-b border-emerald-900/60 bg-[#011c15]/80 backdrop-blur-md px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md ring-1 ring-white/20">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider uppercase text-emerald-300">
              Government Public Library System
            </div>
            <div className="text-[11px] text-emerald-100/70">
              Department of Culture & District Administration
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-emerald-200/80 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>NIC Encrypted Terminal · 256-bit SSL</span>
        </div>
      </header>

      {/* Main Login Card Section */}
      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md space-y-5">
          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 text-slate-900 overflow-hidden">
            {/* Card Header Banner */}
            <div className="bg-[#0b5e43] px-6 py-6 text-white text-center relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-emerald-400/10 blur-xl pointer-events-none" />
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-900/60 border border-emerald-600/40 text-[11px] font-semibold text-emerald-200 mb-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Staff & Administration Console</span>
              </div>
              <h1 className="text-2xl font-serif font-bold tracking-tight text-white">
                Official Sign In
              </h1>
              <p className="text-xs text-emerald-100/80 mt-1 max-w-xs mx-auto">
                Enter your registered Library Staff ID or Email with your security password
              </p>
            </div>

            {/* Form Container */}
            <div className="p-6 sm:p-8 space-y-5">
              {/* Error Message */}
              {errorMsg && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
                </div>
              )}

              {/* Autofill Notification */}
              {fillFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{fillFeedback}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                {/* ID / Email Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Staff Email ID or User ID</span>
                    <span className="text-[10px] text-slate-400 font-normal">e.g. admin@library.gov.in</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="admin@library.gov.in"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0b5e43] focus:border-transparent transition text-slate-900 bg-white placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Security Password</span>
                    <span className="text-[10px] text-slate-400 font-normal">Default: Admin@123</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0b5e43] focus:border-transparent transition text-slate-900 bg-white placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition p-1"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Remember & Assistance */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-800">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#0b5e43] focus:ring-[#0b5e43] border-slate-300"
                    />
                    <span>Remember terminal</span>
                  </label>
                  <span className="text-[11px] text-emerald-800 font-medium">
                    District Admin Node
                  </span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-[#0b5e43] hover:bg-[#084833] disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Admin Console</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Quick Fill Demo Credentials */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-400 uppercase tracking-wider">
                    Quick-Fill Staff Logins
                  </span>
                  <span className="text-slate-400 text-[10px]">Click to populate</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => fillCredentials("superadmin@library.gov.in", "Admin@123", "Super Admin")}
                    className="p-3 rounded-xl border border-emerald-300 bg-emerald-50/90 hover:bg-emerald-100 text-emerald-950 font-medium transition text-left cursor-pointer group shadow-xs"
                  >
                    <div className="font-bold text-xs text-emerald-900 flex items-center justify-between">
                      <span>Super Admin</span>
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div className="text-[11px] text-emerald-700 font-mono mt-1 truncate">
                      superadmin@library.gov.in
                    </div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">Password: Admin@123</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => fillCredentials("librarian@library.gov.in", "Admin@123", "Librarian")}
                    className="p-3 rounded-xl border border-teal-300 bg-teal-50/90 hover:bg-teal-100 text-teal-950 font-medium transition text-left cursor-pointer group shadow-xs"
                  >
                    <div className="font-bold text-xs text-teal-900 flex items-center justify-between">
                      <span>Librarian</span>
                      <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div className="text-[11px] text-teal-700 font-mono mt-1 truncate">
                      librarian@library.gov.in
                    </div>
                    <div className="text-[10px] text-teal-600 mt-0.5">Password: Admin@123</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Navigation & Legal Notices */}
          <div className="text-center space-y-2 text-xs text-emerald-200/80">
            <p>
              Looking for citizen book search?{" "}
              <a
                href="http://localhost:3000"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 font-semibold underline underline-offset-2 hover:text-white transition"
              >
                Go to Public OPAC Portal →
              </a>
            </p>
            <p className="text-[11px] text-emerald-400/60 max-w-sm mx-auto">
              Notice: Unauthorized access to government library administration networks is punishable under Section 43/66 of the Information Technology Act.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-emerald-950 bg-[#011711] py-3 text-center text-[11px] text-emerald-400/60">
        District Public Library System · National Informatics Framework · All Rights Reserved © 2026
      </footer>
    </div>
  );
}
