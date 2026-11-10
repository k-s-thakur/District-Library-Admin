"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  TrendingUp,
  PieChart,
  BookOpen,
  Users,
  IndianRupee,
  CheckCircle2,
  Printer,
  RefreshCw,
} from "lucide-react";

interface CategoryStat {
  name: string;
  count: number;
  pct: number;
}

interface TopBookStat {
  title: string;
  author: string;
  loans: number;
}

interface AnalyticsData {
  monthlyCheckouts: number;
  onTimeReturnRate: string;
  revenueCollected: number;
  newMemberEnrolments: number;
  categoryBreakdown: CategoryStat[];
  topBorrowedTitles: TopBookStat[];
}

export default function StaffReportsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    monthlyCheckouts: 0,
    onTimeReturnRate: "0%",
    revenueCollected: 0,
    newMemberEnrolments: 0,
    categoryBreakdown: [],
    topBorrowedTitles: [],
  });
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadAnalytics = () => {
    setLoading(true);
    fetch("/api/reports/analytics")
      .then((res) => res.json())
      .then((data) => {
        if (data.analytics) {
          setAnalytics(data.analytics);
        }
      })
      .catch((err) => console.error("Error loading analytics", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleExportCSV = () => {
    const categoriesRows = [
      ["--- Category Circulation Breakdown ---"],
      ["Category", "Loans Count", "Share %"],
      ...analytics.categoryBreakdown.map((c) => [c.name, String(c.count), `${c.pct}%`]),
    ];

    const titlesRows = [
      [],
      ["--- Top Borrowed Titles ---"],
      ["Title", "Author", "Total Loans"],
      ...analytics.topBorrowedTitles.map((t) => [`"${t.title.replace(/"/g, '""')}"`, `"${t.author}"`, String(t.loans)]),
    ];

    const summaryRows = [
      ["--- Library Executive Summary ---"],
      ["Metric", "Value"],
      ["Monthly Checkouts", String(analytics.monthlyCheckouts)],
      ["On-time Return Rate", analytics.onTimeReturnRate],
      ["Revenue Collected (INR)", `Rs. ${analytics.revenueCollected}`],
      ["New Member Enrolments", String(analytics.newMemberEnrolments)],
      [],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [...summaryRows, ...categoriesRows, ...titlesRows].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `District_Library_Official_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast("Official library analytics dataset exported as CSV.");
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-800 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs flex items-center gap-2 border border-teal-500 animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-teal-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Reports & Operational Insights
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade circulation summaries, collection analytics, and revenue reports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadAnalytics}
            className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition cursor-pointer"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => {
              window.print();
              showToast("Printing official report document.");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Print Report</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-medium transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            {loading ? "..." : analytics.monthlyCheckouts}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Monthly Checkouts</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-2xl font-bold text-teal-700 tabular-nums">
            {loading ? "..." : analytics.onTimeReturnRate}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">On-time Return Rate</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-2xl font-bold text-slate-900 tabular-nums">
            ₹ {loading ? "..." : analytics.revenueCollected.toLocaleString("en-IN")}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Revenue Collected</div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="text-2xl font-bold text-blue-700 tabular-nums">
            {loading ? "..." : analytics.newMemberEnrolments}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">New Member Enrolments</div>
        </div>
      </div>

      {/* Report Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Most Borrowed Categories */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-bold text-slate-900">
            Circulation by Category
          </h3>
          <div className="space-y-3 text-xs">
            {analytics.categoryBreakdown.length === 0 ? (
              <p className="text-slate-400 py-4 text-center">No category circulation data found.</p>
            ) : (
              analytics.categoryBreakdown.map((cat, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>{cat.name}</span>
                    <span className="font-mono">{cat.count} loans ({cat.pct}%)</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      style={{ width: `${Math.min(cat.pct, 100)}%` }}
                      className="h-full bg-teal-600 rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Circulation Books */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="font-serif text-lg font-bold text-slate-900">
            Top Borrowed Titles
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {analytics.topBorrowedTitles.length === 0 ? (
              <p className="text-slate-400 py-4 text-center">No title loan events recorded.</p>
            ) : (
              analytics.topBorrowedTitles.map((b, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{b.title}</p>
                    <p className="text-[11px] text-slate-400">{b.author}</p>
                  </div>
                  <span className="font-mono font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                    {b.loans} loans
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
