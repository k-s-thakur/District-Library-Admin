"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Building2,
  User,
  ShieldCheck,
  BookOpen,
  Banknote,
  ArrowRight,
  Sparkles,
  Loader2,
  CheckCircle2,
} from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Login failed.");
      }

      if (data.user?.role === "MEMBER") {
        router.push("/account");
      } else {
        router.push("/staff/overview");
      }
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAccess = async (role: string, targetPath: string) => {
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Direct access failed.");

      router.push(targetPath);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-slate-50 via-teal-50/20 to-white">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            <span>Open Access Mode · No Passwords Required</span>
          </div>
          <h1 className="text-2xl font-bold font-serif text-slate-900 tracking-tight">
            District Library Access Portal
          </h1>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Choose any portal below for instant 1-click access without entering passwords.
          </p>
        </div>

        {/* Portal Selection Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700">
              {errorMsg}
            </div>
          )}

          {/* Instant 1-Click Role Access Buttons */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              1-Click Direct Entry
            </label>

            {/* Admin Portal Button */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickAccess("SUPER_ADMIN", "/staff/overview")}
              className="w-full p-3.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/70 text-slate-900 transition flex items-center justify-between group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-teal-700 text-white flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-teal-950 flex items-center gap-1.5">
                    <span>Admin & Management Portal</span>
                    <span className="text-[10px] bg-teal-200 text-teal-900 font-bold px-1.5 py-0.2 rounded">Full Access</span>
                  </div>
                  <div className="text-xs text-teal-700">Access overview, reports, settings & inventory</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition" />
            </button>

            {/* Librarian Desk */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickAccess("LIBRARIAN", "/staff/circulation")}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 transition flex items-center justify-between group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Librarian Circulation Desk</div>
                  <div className="text-[11px] text-slate-500">Book issue, return, barcode scan & member lookup</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </button>

            {/* Citizen OPAC Member Portal */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickAccess("MEMBER", "/account")}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 transition flex items-center justify-between group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Citizen Member Portal (OPAC)</div>
                  <div className="text-[11px] text-slate-500">My loans, reservations, library card & dues</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </button>

            {/* Accounts Officer */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickAccess("ACCOUNTS_OPERATOR", "/staff/finance")}
              className="w-full p-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 transition flex items-center justify-between group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-700 text-white flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900">Accounts & Cashier Desk</div>
                  <div className="text-[11px] text-slate-500">Fine collection, receipts & fee reconciliation</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </button>
          </div>

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">or sign in by ID</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {/* Optional Identifier Form - No Password */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700">
                Email Address or Member Card No
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="e.g. GPL-2026-00001 or admin@library.gov.in"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-teal-600 focus:border-teal-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-xs rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Enter Portal (No Password Required)</span>
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-teal-700 transition">
            ← Return to Public Catalogue
          </Link>
        </div>
      </div>
    </div>
  );
}
