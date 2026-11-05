"use client";

import { useState } from "react";
import {
  Sliders,
  Shield,
  Building2,
  Clock,
  IndianRupee,
  Users,
  Save,
  CheckCircle2,
} from "lucide-react";

export default function StaffAdministrationPage() {
  const [loanDaysAdult, setLoanDaysAdult] = useState("14");
  const [loanDaysStudent, setLoanDaysStudent] = useState("21");
  const [finePerDay, setFinePerDay] = useState("2");
  const [gracePeriodDays, setGracePeriodDays] = useState("2");
  const [maxRenewals, setMaxRenewals] = useState("2");
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {saved && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-800 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-teal-500 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>Library policy configuration saved successfully.</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          System Administration & Policies
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Branch settings, fine calculation rules, and circulation policy limits
        </p>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Circulation & Lending Policy */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-teal-700" />
            <h3 className="font-semibold text-slate-900 text-xs">
              Lending & Loan Periods
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Adult Member Loan Duration (days)
              </label>
              <input
                type="number"
                value={loanDaysAdult}
                onChange={(e) => setLoanDaysAdult(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Student & Scholar Loan Duration (days)
              </label>
              <input
                type="number"
                value={loanDaysStudent}
                onChange={(e) => setLoanDaysStudent(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Max Allowed Online Renewals
              </label>
              <input
                type="number"
                value={maxRenewals}
                onChange={(e) => setMaxRenewals(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
              />
            </div>
          </div>
        </div>

        {/* Fines & Tariffs */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <IndianRupee className="w-4 h-4 text-teal-700" />
            <h3 className="font-semibold text-slate-900 text-xs">
              Overdue Fine Tariff & Grace Rules
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Fine Rate per Day Overdue (₹)
              </label>
              <input
                type="number"
                value={finePerDay}
                onChange={(e) => setFinePerDay(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Overdue Grace Period (days before fine applies)
              </label>
              <input
                type="number"
                value={gracePeriodDays}
                onChange={(e) => setGracePeriodDays(e.target.value)}
                className="w-full px-3.5 py-2 border border-slate-300 rounded-xl focus:outline-teal-600"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 shadow-xs transition"
              >
                <Save className="w-4 h-4" />
                <span>Save Policy Settings</span>
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
