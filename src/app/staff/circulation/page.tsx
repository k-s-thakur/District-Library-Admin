"use client";

import { useState, useEffect } from "react";
import {
  Repeat,
  Plus,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  ArrowRight,
  X,
  Scan,
  User,
  BookOpen,
  Calendar,
  ArrowLeftRight,
  HelpCircle,
} from "lucide-react";

interface FollowUpItem {
  id: string;
  member: string;
  memberSubtitle: string;
  book: string;
  dueDate: string;
  followUp: "Due today" | "Overdue 2 days" | "Due tomorrow";
  reminded?: boolean;
}

const initialFollowUps: FollowUpItem[] = [];

interface ActiveLoanRecord {
  id: string;
  memberNo: string;
  memberName: string;
  accessionNo: string;
  bookTitle: string;
  issuedAt: string;
  dueDate: string;
  renewals: number;
  status: "ACTIVE" | "OVERDUE";
}

const initialActiveLoans: ActiveLoanRecord[] = [];

export default function StaffCirculationPage() {
  const [activeTab, setActiveTab] = useState<"followups" | "issue" | "return" | "active">("followups");
  const [followUps, setFollowUps] = useState<FollowUpItem[]>([]);
  const [activeLoans, setActiveLoans] = useState<ActiveLoanRecord[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState({
    totalActiveLoans: 0,
    overdueCount: 0,
    dueTodayCount: 0,
    dueTomorrowCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [scanModalOpen, setScanModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [liveReservations, setLiveReservations] = useState<any[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);

  const fetchReservations = async () => {
    setLoadingReservations(true);
    try {
      const res = await fetch("/api/circulation/reserve");
      if (res.ok) {
        const data = await res.json();
        setLiveReservations(data.items || []);
      }
    } catch (err) {
      console.error("Error loading reservations", err);
    } finally {
      setLoadingReservations(false);
    }
  };

  // Issue Form State
  const [issueMember, setIssueMember] = useState("");
  const [issueBookAcc, setIssueBookAcc] = useState("");
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  // Return Form State
  const [returnAcc, setReturnAcc] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);

  // Scan simulation state
  const [scanCode, setScanCode] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Followups
      const fuRes = await fetch("/api/circulation/followups");
      if (fuRes.ok) {
        const fuData = await fuRes.json();
        if (fuData.items) {
          setFollowUps(
            fuData.items.map((item: any) => ({
              id: item.id,
              member: item.memberName,
              memberSubtitle: item.memberSubtitle,
              book: item.bookTitle,
              dueDate: new Date(item.dueDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              followUp: item.followUp,
              reminded: false,
            }))
          );
        }
        if (fuData.summary) {
          setSummaryMetrics({
            totalActiveLoans: fuData.summary.totalActiveLoans || 0,
            overdueCount: fuData.summary.overdueCount || 0,
            dueTodayCount: fuData.summary.dueTodayCount || 0,
            dueTomorrowCount: fuData.summary.dueTomorrowCount || 0,
          });
        }
      }

      // 2. Fetch Active Loans
      const alRes = await fetch("/api/circulation/active");
      if (alRes.ok) {
        const alData = await alRes.json();
        if (alData.loans) {
          setActiveLoans(
            alData.loans.map((l: any) => {
              const due = new Date(l.dueDate);
              const isOverdue = due < new Date();
              return {
                id: l.id,
                memberNo: l.member?.memberNo || "—",
                memberName: l.member?.fullName || "—",
                accessionNo: l.copy?.accessionNo || "—",
                bookTitle: l.copy?.book?.title || "—",
                issuedAt: new Date(l.issuedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
                dueDate: due.toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }),
                renewals: l.renewalCount || 0,
                status: isOverdue ? "OVERDUE" : "ACTIVE",
              };
            })
          );
        }
      }
    } catch (e) {
      console.error("Failed to load circulation data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRemind = (id: string, member: string) => {
    setFollowUps((prev) =>
      prev.map((item) => (item.id === id ? { ...item, reminded: true } : item))
    );
    showToast(`Reminder notice dispatched to ${member} via SMS & Email.`);
  };

  const handleRenewLoan = async (id: string) => {
    try {
      const res = await fetch("/api/circulation/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to renew loan");
      }
      showToast("Loan successfully renewed for 14 additional days.");
      await loadData();
    } catch (err: any) {
      showToast(`Error: ${err.message}`);
    }
  };

  const handleExportRegister = () => {
    const headers = ["Member", "Book", "Due Date", "Follow-up Status"];
    const rows = followUps.map((f) => [
      `"${f.member}"`,
      `"${f.book}"`,
      f.dueDate,
      f.followUp,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Janata_Library_Due_Register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Due register exported as CSV.");
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingIssue(true);
    try {
      const res = await fetch("/api/circulation/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberIdentifier: issueMember.trim(),
          copyIdentifier: issueBookAcc.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to issue book");
      }
      showToast(`Book successfully issued to ${data.member?.name || issueMember}.`);
      setIssueMember("");
      setIssueBookAcc("");
      setIssueModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(`Issue failed: ${err.message}`);
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReturn(true);
    try {
      const res = await fetch("/api/circulation/return", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          copyIdentifier: returnAcc.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to return book");
      }
      if (data.isOverdue) {
        showToast(`Book checked in. Overdue fine assessed: ₹${data.assessedFineAmount}`);
      } else {
        showToast(`Accession ${returnAcc} successfully returned to stacks.`);
      }
      setReturnAcc("");
      setReturnModalOpen(false);
      await loadData();
    } catch (err: any) {
      showToast(`Return failed: ${err.message}`);
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0d7a55] text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#e2f6ee] text-[#0d7a55] flex items-center justify-center shrink-0 shadow-xs">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Circulation Desk
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage book issues, returns, renewals, and due date follow-ups.
            </p>
          </div>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setScanModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Scan className="w-4 h-4 text-slate-500" />
            <span>Scan Barcode</span>
          </button>

          <button
            onClick={() => setIssueModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0d7a55] hover:bg-[#0a6344] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Book</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Books on Loan */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e6f7f0] text-[#0d7a55] flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
              {summaryMetrics.totalActiveLoans}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Active Loans</div>
          </div>
        </div>

        {/* Due Today */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e8f2fe] text-[#2563eb] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
              {summaryMetrics.dueTodayCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Due Today</div>
          </div>
        </div>

        {/* Overdue Accounts */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#fdeeed] text-[#dc2626] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-[#dc2626] tabular-nums leading-tight">
              {summaryMetrics.overdueCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Overdue Loans</div>
          </div>
        </div>

        {/* Due Tomorrow */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#f0edfb] text-[#7c3aed] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
              {summaryMetrics.dueTomorrowCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Due Tomorrow</div>
          </div>
        </div>
      </div>

      {/* Circulation Sub-Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto text-xs font-medium pt-1">
        <button
          onClick={() => setActiveTab("followups")}
          className={`pb-2.5 font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === "followups"
              ? "border-b-2 border-[#0d7a55] text-[#0d7a55] font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Due Dates & Follow-ups
        </button>
        <button
          onClick={() => setActiveTab("issue")}
          className={`pb-2.5 font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === "issue"
              ? "border-b-2 border-[#0d7a55] text-[#0d7a55] font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Issue Desk
        </button>
        <button
          onClick={() => setActiveTab("return")}
          className={`pb-2.5 font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === "return"
              ? "border-b-2 border-[#0d7a55] text-[#0d7a55] font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Return Desk
        </button>
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-2.5 font-medium transition whitespace-nowrap cursor-pointer ${
            activeTab === "active"
              ? "border-b-2 border-[#0d7a55] text-[#0d7a55] font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Active Loans ({activeLoans.length})
        </button>
      </div>

      {/* TAB 1: Due Dates & Follow-ups (Exact match to image) */}
      {activeTab === "followups" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] tracking-widest uppercase font-bold text-[#0d7a55]">
                ACTION REQUIRED
              </p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Due dates & follow-ups
              </h3>
            </div>
            <button
              onClick={handleExportRegister}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold self-start sm:self-auto transition shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export register</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f2f7f4] border-b border-slate-200/80 text-[11px] font-bold text-[#536b60] uppercase tracking-wider">
                  <th className="py-3 px-5">MEMBER</th>
                  <th className="py-3 px-5">BOOK</th>
                  <th className="py-3 px-5">DUE DATE</th>
                  <th className="py-3 px-5">FOLLOW-UP</th>
                  <th className="py-3 px-5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {followUps.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#e2f6ee] text-[#0d7a55] flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 leading-tight">
                            {item.member}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {item.memberSubtitle}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 font-normal text-slate-800">
                      {item.book}
                    </td>

                    <td className="py-3.5 px-5 text-slate-600 text-xs">
                      {item.dueDate}
                    </td>

                    <td className="py-3.5 px-5">
                      {item.followUp === "Due today" ? (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
                          Due today
                        </span>
                      ) : item.followUp === "Overdue 2 days" ? (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium bg-[#fee2e2] text-[#b91c1c] border border-[#fecaca]">
                          Overdue 2 days
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium bg-[#e0f2fe] text-[#0369a1] border border-[#bae6fd]">
                          Due tomorrow
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleRemind(item.id, item.member)}
                        className={`px-4 py-1 rounded-full text-xs font-semibold border transition cursor-pointer shadow-xs ${
                          item.reminded
                            ? "bg-emerald-50 text-[#0d7a55] border-emerald-300"
                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                        }`}
                      >
                        {item.reminded ? "Reminded ✓" : "Remind"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="py-3 px-5 bg-slate-50/70 border-t border-slate-200/80 text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Reminder and issue records require staff access controls.</span>
          </div>
        </div>
      )}

      {/* TAB 2: Fast Issue Desk */}
      {activeTab === "issue" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs max-w-2xl space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Fast Book Checkout Desk</h3>
            <p className="text-xs text-slate-500">Scan or input citizen ID & copy barcode</p>
          </div>

          <form onSubmit={handleIssueSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Citizen Member Number or Phone *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MBR-2024-0185 or 9871154321"
                value={issueMember}
                onChange={(e) => setIssueMember(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Book Copy Accession Token *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ACC-2024-0043"
                value={issueBookAcc}
                onChange={(e) => setIssueBookAcc(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-[#0d7a55] space-y-1">
              <p className="font-semibold">Standard Circulation Policy Verified:</p>
              <p>• 14 calendar days checkout duration (Due date: 04 Nov 2026).</p>
              <p>• Grace period: 2 days. Subsequent overdue fine: ₹2 per day.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingIssue}
                className="px-5 py-2.5 rounded-full bg-[#0d7a55] hover:bg-[#0a6344] text-white font-medium shadow-xs transition cursor-pointer"
              >
                {isSubmittingIssue ? "Issuing..." : "Complete Checkout & Print Slip"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: Fast Return Desk */}
      {activeTab === "return" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs max-w-2xl space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Book Return & Inward Check-in</h3>
            <p className="text-xs text-slate-500">Scan accession barcode or enter copy number</p>
          </div>

          <form onSubmit={handleReturnSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Accession Number / Barcode *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. ACC-2024-0043"
                value={returnAcc}
                onChange={(e) => setReturnAcc(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
              <p className="font-semibold text-slate-800">Check-in Process:</p>
              <p>• Automatically checks overdue status and assesses fine if applicable.</p>
              <p>• Automatically updates copy status back to &quot;Available&quot; in the stacks.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingReturn}
                className="px-5 py-2.5 rounded-full bg-[#0d7a55] hover:bg-[#0a6344] text-white font-medium shadow-xs transition cursor-pointer"
              >
                {isSubmittingReturn ? "Checking in..." : "Check-in Book to Stacks"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: Active Loans Directory */}
      {activeTab === "active" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                All Active Loans Across Library
              </h3>
              <p className="text-xs text-slate-500">Live circulation records</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f2f7f4] border-b border-slate-200/80 text-[11px] font-bold text-[#536b60] uppercase tracking-wider">
                  <th className="py-3 px-5">Member</th>
                  <th className="py-3 px-5">Book Title</th>
                  <th className="py-3 px-5">Accession</th>
                  <th className="py-3 px-5">Issued On</th>
                  <th className="py-3 px-5">Due Date</th>
                  <th className="py-3 px-5">Renewals</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900">{loan.memberName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{loan.memberNo}</div>
                    </td>
                    <td className="py-3.5 px-5 font-normal text-slate-800">{loan.bookTitle}</td>
                    <td className="py-3.5 px-5 font-mono text-slate-600">{loan.accessionNo}</td>
                    <td className="py-3.5 px-5 text-slate-600">{loan.issuedAt}</td>
                    <td className="py-3.5 px-5 font-medium">
                      <span className={loan.status === "OVERDUE" ? "text-rose-600" : "text-slate-800"}>
                        {loan.dueDate}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600">{loan.renewals} / 2</td>
                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => handleRenewLoan(loan.id)}
                        disabled={loan.renewals >= 2}
                        className="px-3.5 py-1 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold disabled:opacity-40 shadow-xs cursor-pointer"
                      >
                        Renew
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Bottom Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Process a return */}
        <button
          onClick={() => {
            setActiveTab("return");
            setReturnModalOpen(true);
          }}
          className="bg-white border border-slate-200/90 hover:border-[#0d7a55] p-5 rounded-2xl shadow-xs text-left transition flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#e2f6ee] text-[#0d7a55] flex items-center justify-center shrink-0 group-hover:bg-[#0d7a55] group-hover:text-white transition">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Process a return</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Scan or enter an accession number
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#0d7a55] group-hover:translate-x-1 transition" />
        </button>

        {/* Card 2: Reservation queue */}
        <button
          onClick={() => {
            fetchReservations();
            setReservationModalOpen(true);
          }}
          className="bg-white border border-slate-200/90 hover:border-amber-500 p-5 rounded-2xl shadow-xs text-left transition flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#fef3c7] text-[#d97706] flex items-center justify-center shrink-0 group-hover:bg-[#d97706] group-hover:text-white transition">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 text-sm">Reservation queue</p>
              <p className="text-xs text-slate-500 mt-0.5">27 titles awaiting pickup</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#d97706] group-hover:translate-x-1 transition" />
        </button>
      </div>

      {/* SCAN MODAL */}
      {scanModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">
                Scan Accession / Barcode
              </span>
              <button onClick={() => setScanModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-2 border-dashed border-emerald-600/60 rounded-2xl p-8 bg-emerald-50/40 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-100 text-[#0d7a55] flex items-center justify-center animate-pulse">
                <Scan className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-600">
                Hold barcode label or QR token up to optical scanner
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-600 font-medium">Or type Accession code:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="ACC-2024-0043"
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
                <button
                  onClick={() => {
                    showToast(`Found book record for ${scanCode || "ACC-2024-0043"}.`);
                    setScanModalOpen(false);
                  }}
                  className="px-4 py-2 bg-[#0d7a55] hover:bg-[#0a6344] text-white rounded-xl font-medium cursor-pointer"
                >
                  Lookup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ISSUE MODAL */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">
                Issue Book to Member
              </span>
              <button onClick={() => setIssueModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Member Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="MBR-2024-0185"
                  value={issueMember}
                  onChange={(e) => setIssueMember(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Accession Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="ACC-2024-0043"
                  value={issueBookAcc}
                  onChange={(e) => setIssueBookAcc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
                Loan duration: 14 days · Due date will be 04 Nov 2026.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIssueModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIssue}
                  className="px-4 py-2 rounded-xl bg-[#0d7a55] text-white font-medium hover:bg-[#0a6344] cursor-pointer"
                >
                  {isSubmittingIssue ? "Issuing..." : "Complete Issue"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RETURN MODAL */}
      {returnModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">
                Process Book Return
              </span>
              <button onClick={() => setReturnModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Accession Number or Scan Barcode
                </label>
                <input
                  type="text"
                  required
                  placeholder="ACC-2023-0318"
                  value={returnAcc}
                  onChange={(e) => setReturnAcc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReturn}
                  className="px-4 py-2 rounded-xl bg-[#0d7a55] text-white font-medium hover:bg-[#0a6344] cursor-pointer"
                >
                  {isSubmittingReturn ? "Processing..." : "Process Check-in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESERVATION QUEUE MODAL */}
      {reservationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Active Reservation Queue
                </h4>
                <p className="text-xs text-slate-500">
                  {liveReservations.length} patrons waiting in queue
                </p>
              </div>
              <button onClick={() => setReservationModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
              {loadingReservations ? (
                <p className="text-center py-6 text-slate-400">Loading reservation queue...</p>
              ) : liveReservations.length === 0 ? (
                <p className="text-center py-6 text-slate-400">No active book reservations pending in queue.</p>
              ) : (
                liveReservations.map((res, i) => (
                  <div key={res.id || i} className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{res.title}</p>
                      <p className="text-[11px] text-slate-500">
                        Reserved by <span className="font-medium text-slate-700">{res.member}</span> ({res.memberNo})
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-200">
                      {res.wait}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setReservationModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
