"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IndianRupee,
  Plus,
  Download,
  ArrowRight,
  TrendingUp,
  Receipt as ReceiptIcon,
  Printer,
  CheckCircle2,
  X,
  CreditCard,
  Banknote,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  HelpCircle,
  FileCheck,
  Search,
  Check,
  AlertCircle,
  RefreshCw,
  Pencil,
  Users,
  Calendar,
  Clock,
  UserCheck,
  UserX,
} from "lucide-react";

interface PaymentReceipt {
  id: string;
  receiptNo: string;
  member: string;
  description: string;
  method: "Cash" | "Manual" | "UPI" | "Card";
  amount: number;
  status: "Paid" | "Reversed";
  date?: string;
  reversalReason?: string;
}

interface OutstandingCharge {
  id: string;
  memberId: string;
  memberName: string;
  memberNo: string;
  chargeType: string;
  description?: string;
  amount: number;
  balance: number;
  status: string;
  createdAt: string;
}

interface MemberFeeReportItem {
  id: string;
  memberNo: string;
  fullName: string;
  email: string;
  phone: string | null;
  category: string;
  status: string;
  registrationDate: string;
  expiryDate: string;
  totalPaidLifetime: number;
  totalPaidThisYear: number;
  outstandingDues: number;
  monthsPaidThisYear: number;
  monthsOverdue: number;
  feeStatus: "PAID" | "OVERDUE" | "PARTIALLY_PAID";
  monthlyBreakdown: { month: number; name: string; paid: boolean }[];
  chargesCount: number;
  paymentsCount: number;
}

interface MemberFeeReportSummary {
  year: number;
  totalMembers: number;
  paidMembersCount: number;
  overdueMembersCount: number;
  partiallyPaidMembersCount: number;
  totalCollectedThisYear: number;
  totalOutstandingDues: number;
}

const initialReceipts: PaymentReceipt[] = [];

export default function StaffFinancePage() {
  const [activeTab, setActiveTab] = useState<"register" | "members_report" | "waivers" | "reversal">("register");
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(initialReceipts);
  const [outstandingCharges, setOutstandingCharges] = useState<OutstandingCharge[]>([]);
  const [membersReport, setMembersReport] = useState<MemberFeeReportItem[]>([]);
  const [reportSummary, setReportSummary] = useState<MemberFeeReportSummary | null>(null);
  const [reportSearch, setReportSearch] = useState("");
  const [reportStatusFilter, setReportStatusFilter] = useState<"ALL" | "PAID" | "OVERDUE" | "PARTIALLY_PAID">("ALL");
  const [reportCategoryFilter, setReportCategoryFilter] = useState("ALL");
  const [selectedReportMember, setSelectedReportMember] = useState<MemberFeeReportItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [metrics, setMetrics] = useState({
    todayAmount: 0,
    todayCount: 0,
    totalMonthAmount: 0,
    outstandingDues: 0,
    reversalsCount: 0,
  });
  const [toastMessage, setToastMessage] = useState<{ msg: string; isError?: boolean } | null>(null);

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedReceiptPrint, setSelectedReceiptPrint] = useState<PaymentReceipt | null>(null);
  const [waiveModalCharge, setWaiveModalCharge] = useState<OutstandingCharge | null>(null);
  const [waiverReason, setWaiverReason] = useState("");
  const [isSubmittingWaiver, setIsSubmittingWaiver] = useState(false);

  // Edit Receipt Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editReceipt, setEditReceipt] = useState<PaymentReceipt | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editMethod, setEditMethod] = useState<"Cash" | "UPI" | "Card" | "Manual">("Cash");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Record Payment Form State
  const [payMember, setPayMember] = useState("");
  const [payAmount, setPayAmount] = useState("50");
  const [payDesc, setPayDesc] = useState("Overdue fine");
  const [payMethod, setPayMethod] = useState<"Cash" | "UPI" | "Card" | "Manual">("Cash");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reversal Form State
  const [reversalRcpNo, setReversalRcpNo] = useState("");
  const [reversalReason, setReversalReason] = useState("");
  const [isSubmittingReversal, setIsSubmittingReversal] = useState(false);

  const showToast = useCallback((msg: string, isError = false) => {
    setToastMessage({ msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const loadFinanceData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch payments
      const res = await fetch("/api/finance/payments");
      if (res.ok) {
        const data = await res.json();
        if (data.payments) {
          const mapped: PaymentReceipt[] = data.payments.map((p: any) => ({
            id: p.id,
            receiptNo: p.receipt?.receiptNo || `TX-${p.id.slice(0, 8)}`,
            member: p.member?.fullName || p.member?.memberNo || "Member",
            description:
              p.allocations?.map((a: any) => a.charge?.description || a.charge?.chargeType).join(", ") ||
              "Library Fee",
            method:
              p.paymentMethod === "CASH"
                ? "Cash"
                : p.paymentMethod === "MANUAL_CHALLAN"
                ? "Manual"
                : p.paymentMethod === "DEMAND_DRAFT"
                ? "Card"
                : "UPI",
            amount: p.amount,
            status: p.status === "REVERSED" ? "Reversed" : "Paid",
            date: new Date(p.createdAt).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }),
            reversalReason: p.reversal?.reversalReason,
          }));
          setReceipts(mapped);

          // Calculate metrics
          const now = new Date();
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const todayPayments = mapped.filter(
            (r) => r.status === "Paid" && r.date && new Date(r.date) >= todayStart
          );
          const totalMonth = mapped
            .filter((r) => r.status === "Paid")
            .reduce((sum, r) => sum + r.amount, 0);
          const reversals = mapped.filter((r) => r.status === "Reversed").length;

          setMetrics((prev) => ({
            ...prev,
            todayAmount: todayPayments.reduce((sum, r) => sum + r.amount, 0),
            todayCount: todayPayments.length,
            totalMonthAmount: totalMonth,
            reversalsCount: reversals,
          }));
        }
      }

      // 2. Fetch outstanding charges
      const chargesRes = await fetch("/api/finance/charges?status=OUTSTANDING");
      if (chargesRes.ok) {
        const cData = await chargesRes.json();
        if (cData.charges) {
          const totalOut = cData.charges.reduce((sum: number, c: any) => sum + (c.balance || 0), 0);
          setMetrics((prev) => ({ ...prev, outstandingDues: Number(totalOut.toFixed(2)) }));

          setOutstandingCharges(
            cData.charges.map((c: any) => ({
              id: c.id,
              memberId: c.member?.id || c.memberId,
              memberName: c.member?.fullName || "Member",
              memberNo: c.member?.memberNo || "",
              chargeType: c.chargeType,
              description: c.description || c.chargeType,
              amount: c.amount,
              balance: c.balance,
              status: c.status,
              createdAt: new Date(c.createdAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
            }))
          );
        }
      }

      // 3. Fetch member fee status report
      const reportRes = await fetch("/api/finance/members-report");
      if (reportRes.ok) {
        const rData = await reportRes.json();
        setMembersReport(rData.members || []);
        setReportSummary(rData.summary || null);
      }
    } catch (err) {
      console.error("Failed to load finance data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFinanceData();
  }, [loadFinanceData]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Resolve member
      const memberSearchRes = await fetch(`/api/members?search=${encodeURIComponent(payMember.trim())}`);
      const memberData = await memberSearchRes.json();
      const member = memberData.members && memberData.members[0];

      if (!member) {
        throw new Error(`Member "${payMember}" not found. Please register or verify the member ID/name.`);
      }

      // Map fee description to chargeType
      let chargeType = "OTHER_FEE";
      if (payDesc.toLowerCase().includes("overdue") || payDesc.toLowerCase().includes("fine")) {
        chargeType = "LATE_FINE";
      } else if (payDesc.toLowerCase().includes("renewal")) {
        chargeType = "RENEWAL_FEE";
      } else if (payDesc.toLowerCase().includes("lost")) {
        chargeType = "LOST_BOOK";
      }

      // 2. Assess charge
      const chargeRes = await fetch("/api/finance/charges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          chargeType,
          amount: parseFloat(payAmount),
          description: payDesc,
        }),
      });
      const chargeJson = await chargeRes.json();
      if (!chargeRes.ok) {
        throw new Error(chargeJson.error || "Failed to assess charge");
      }

      // 3. Post payment
      const paymentRes = await fetch("/api/finance/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: member.id,
          amount: parseFloat(payAmount),
          paymentMethod: payMethod === "Manual" ? "MANUAL_CHALLAN" : "CASH",
          allocations: [{ chargeId: chargeJson.charge.id, amount: parseFloat(payAmount) }],
        }),
      });
      const paymentJson = await paymentRes.json();
      if (!paymentRes.ok) {
        throw new Error(paymentJson.error || "Failed to post payment");
      }

      const rcpNum = paymentJson.receipt?.receiptNo || "RCP-2026";
      showToast(`Payment of ₹${payAmount} recorded successfully! Receipt #${rcpNum}`);
      setPaymentModalOpen(false);
      setPayMember("");
      await loadFinanceData();
    } catch (err: any) {
      showToast(err.message || "Payment recording failed", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReversalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReversal(true);

    try {
      const targetReceipt = receipts.find(
        (r) => r.receiptNo.toLowerCase() === reversalRcpNo.trim().toLowerCase()
      );

      if (!targetReceipt) {
        throw new Error(`Receipt "${reversalRcpNo}" not found in current ledger.`);
      }

      const res = await fetch(`/api/finance/payments/${targetReceipt.id}/reverse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reversalReason: reversalReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reverse transaction");
      }

      showToast(`Receipt ${targetReceipt.receiptNo} reversed and logged in CAG audit ledger.`);
      setReversalRcpNo("");
      setReversalReason("");
      setActiveTab("register");
      await loadFinanceData();
    } catch (err: any) {
      showToast(err.message || "Reversal failed", true);
    } finally {
      setIsSubmittingReversal(false);
    }
  };

  const handleWaiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiveModalCharge) return;
    setIsSubmittingWaiver(true);

    try {
      const res = await fetch(`/api/finance/charges/${waiveModalCharge.id}/waive`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ waiverReason: waiverReason.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to waive charge");
      }

      showToast(`Charge of ₹${waiveModalCharge.balance} successfully waived by Supervisor.`);
      setWaiveModalCharge(null);
      setWaiverReason("");
      await loadFinanceData();
    } catch (err: any) {
      showToast(err.message || "Waiver failed", true);
    } finally {
      setIsSubmittingWaiver(false);
    }
  };

  const handleOpenEdit = (rcp: PaymentReceipt) => {
    setEditReceipt(rcp);
    setEditAmount(rcp.amount.toString());
    setEditDescription(rcp.description);
    setEditMethod(rcp.method);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editReceipt) return;
    setIsSubmittingEdit(true);

    const methodMap: Record<string, string> = {
      Cash: "CASH",
      Manual: "MANUAL_CHALLAN",
      Card: "DEMAND_DRAFT",
      UPI: "OTHER_APPROVED",
    };

    try {
      const res = await fetch(`/api/finance/payments/${editReceipt.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(editAmount),
          paymentMethod: methodMap[editMethod] || "CASH",
          description: editDescription.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update payment");
      }

      showToast(`Receipt #${editReceipt.receiptNo} updated successfully!`);
      setEditModalOpen(false);
      setEditReceipt(null);
      await loadFinanceData();
    } catch (err: any) {
      showToast(err.message || "Failed to update receipt", true);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ["Receipt No", "Member", "Description", "Method", "Amount", "Status", "Date"];
    const rows = receipts.map((r) => [
      r.receiptNo,
      `"${r.member}"`,
      `"${r.description}"`,
      r.method,
      `₹ ${r.amount}`,
      r.status,
      r.date || "",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Janata_Library_Payment_Register_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Finance payment register exported successfully.");
  };

  const filteredReceipts = receipts.filter((r) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      r.receiptNo.toLowerCase().includes(q) ||
      r.member.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q)
    );
  });

  const filteredMemberReport = membersReport.filter((m) => {
    const q = reportSearch.toLowerCase().trim();
    if (q) {
      const match =
        m.fullName.toLowerCase().includes(q) ||
        m.memberNo.toLowerCase().includes(q) ||
        (m.phone && m.phone.toLowerCase().includes(q)) ||
        m.email.toLowerCase().includes(q);
      if (!match) return false;
    }

    if (reportStatusFilter !== "ALL") {
      if (m.feeStatus !== reportStatusFilter) return false;
    }

    if (reportCategoryFilter !== "ALL") {
      if (m.category !== reportCategoryFilter) return false;
    }

    return true;
  });

  const handleExportMemberReportCSV = () => {
    const headers = [
      "Member No",
      "Full Name",
      "Category",
      "Membership Status",
      `Months Paid (${reportSummary?.year || 2026})`,
      "Months Overdue",
      `Fees Paid (${reportSummary?.year || 2026})`,
      "Lifetime Fees Paid",
      "Pending Dues",
      "Fee Status",
      "Valid Till",
    ];
    const rows = filteredMemberReport.map((m) => [
      m.memberNo,
      `"${m.fullName}"`,
      m.category,
      m.status,
      `${m.monthsPaidThisYear} / 12`,
      m.monthsOverdue > 0 ? `${m.monthsOverdue} Months` : "0 (Nil)",
      `₹ ${m.totalPaidThisYear}`,
      `₹ ${m.totalPaidLifetime}`,
      `₹ ${m.outstandingDues}`,
      m.feeStatus,
      new Date(m.expiryDate).toLocaleDateString("en-IN"),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `District_Library_Member_Fee_Report_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Member fee report exported successfully.");
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 text-white px-4 py-2.5 rounded-2xl shadow-xl text-xs flex items-center gap-2 border ${
            toastMessage.isError
              ? "bg-rose-700 border-rose-500"
              : "bg-[#0d7a55] border-emerald-400"
          }`}
        >
          {toastMessage.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-200" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          )}
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#e2f6ee] text-[#0d7a55] flex items-center justify-center shrink-0 shadow-xs">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Finance & Receipts
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Fee collections, government receipts, outstanding dues, and cash audits.
            </p>
          </div>
        </div>

        {/* Action Buttons Top Right */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => loadFinanceData()}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold shadow-xs transition cursor-pointer"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => {
              if (activeTab === "members_report") {
                handleExportMemberReportCSV();
              } else {
                handleExportCSV();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{activeTab === "members_report" ? "Export Fee Report" : "Export Register"}</span>
          </button>

          <button
            onClick={() => setPaymentModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#0d7a55] hover:bg-[#0a6344] text-white text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* 2. Top 4 Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e6f7f0] text-[#0d7a55] flex items-center justify-center shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
              ₹ {metrics.todayAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Collected Today ({metrics.todayCount} receipts)
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e8f2fe] text-[#2563eb] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">
              ₹ {metrics.totalMonthAmount.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Total Collections ({receipts.length} total)
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#fdeeed] text-[#dc2626] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 tabular-nums leading-tight">
              ₹ {metrics.outstandingDues.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Outstanding Overdue Dues ({outstandingCharges.length} items)
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#f0edfb] text-[#7c3aed] flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-700 tabular-nums leading-tight">
              {metrics.reversalsCount}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">Audited Reversals</div>
          </div>
        </div>
      </div>

      {/* Finance Sub-tabs */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto text-xs font-medium pt-1">
        <button
          onClick={() => setActiveTab("register")}
          className={`pb-2.5 font-medium transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "register"
              ? "border-b-2 border-[#0d7a55] text-[#0d7a55] font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ReceiptIcon className="w-3.5 h-3.5" />
          <span>Receipts Register ({receipts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("members_report")}
          className={`pb-2.5 font-medium transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "members_report"
              ? "border-b-2 border-[#0d7a55] text-[#0d7a55] font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Member Fee Status Report ({membersReport.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("waivers")}
          className={`pb-2.5 font-medium transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "waivers"
              ? "border-b-2 border-[#0d7a55] text-[#0d7a55] font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Outstanding Dues & Fine Waivers ({outstandingCharges.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("reversal")}
          className={`pb-2.5 font-medium transition cursor-pointer flex items-center gap-1.5 ${
            activeTab === "reversal"
              ? "border-b-2 border-[#0d7a55] text-[#0d7a55] font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Payment Reversals & Audit Desk</span>
        </button>
      </div>

      {/* TAB 1: Payment Register */}
      {activeTab === "register" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[10px] tracking-widest uppercase font-bold text-[#0d7a55]">
                RECENT RECEIPTS
              </p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Payment Register
              </h3>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search receipt, member..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-[#0d7a55] focus:bg-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f2f7f4] border-b border-slate-200/80 text-[11px] font-bold text-[#536b60] uppercase tracking-wider">
                  <th className="py-3 px-5">RECEIPT NO.</th>
                  <th className="py-3 px-5">MEMBER</th>
                  <th className="py-3 px-5">DESCRIPTION</th>
                  <th className="py-3 px-5">METHOD</th>
                  <th className="py-3 px-5">AMOUNT</th>
                  <th className="py-3 px-5">STATUS</th>
                  <th className="py-3 px-5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No payments match the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((rcp) => (
                    <tr key={rcp.id} className="hover:bg-slate-50/80 transition group">
                      <td className="py-3.5 px-5 font-mono text-slate-600 text-xs">
                        {rcp.receiptNo}
                      </td>

                      <td className="py-3.5 px-5 font-semibold text-slate-900">
                        {rcp.member}
                      </td>

                      <td className="py-3.5 px-5 text-slate-600">
                        {rcp.description}
                      </td>

                      <td className="py-3.5 px-5">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          {rcp.method === "Cash" && <Banknote className="w-3.5 h-3.5 text-emerald-600" />}
                          {rcp.method === "UPI" && <CreditCard className="w-3.5 h-3.5 text-blue-600" />}
                          <span>{rcp.method}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-5 font-semibold text-slate-900 tabular-nums">
                        ₹ {rcp.amount}
                      </td>

                      <td className="py-3.5 px-5">
                        {rcp.status === "Reversed" ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fee2e2] text-[#b91c1c] border border-rose-200">
                            Reversed
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e2f6ee] text-[#0d7a55] border border-emerald-200">
                            Paid
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedReceiptPrint(rcp)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 inline-flex items-center gap-1 transition cursor-pointer"
                          title="Print receipt voucher"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline text-xs font-medium">Slip</span>
                        </button>

                        {rcp.status === "Paid" && (
                          <button
                            onClick={() => handleOpenEdit(rcp)}
                            className="p-1.5 rounded-lg border border-blue-200 bg-blue-50/60 text-blue-700 hover:bg-blue-100 inline-flex items-center gap-1 transition cursor-pointer"
                            title="Edit receipt details"
                          >
                            <Pencil className="w-3.5 h-3.5 text-blue-600" />
                            <span className="hidden sm:inline text-xs font-medium">Edit</span>
                          </button>
                        )}

                        {rcp.status === "Paid" && (
                          <button
                            onClick={() => {
                              setReversalRcpNo(rcp.receiptNo);
                              setActiveTab("reversal");
                            }}
                            className="p-1.5 rounded-lg border border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 inline-flex items-center gap-1 transition cursor-pointer"
                            title="Authorize Supervisor Reversal"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline text-xs font-medium">Reverse</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="py-3 px-5 bg-slate-50/70 border-t border-slate-200/80 text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Government treasury receipts recorded in compliance with State Financial Audits.</span>
          </div>
        </div>
      )}

      {/* TAB: Member Fee Status & Dues Report */}
      {activeTab === "members_report" && (
        <div className="space-y-4">
          {/* Top KPI Cards for Member Fee Report */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
              <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span>Total Members</span>
              </div>
              <div className="text-2xl font-bold text-slate-900 tabular-nums">
                {reportSummary?.totalMembers || membersReport.length}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Enrolled Patrons</div>
            </div>

            <div className="bg-white border border-emerald-200/90 rounded-2xl p-4 shadow-xs bg-emerald-50/30">
              <div className="flex items-center gap-2 text-emerald-800 text-xs mb-1">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fees Paid / Clear</span>
              </div>
              <div className="text-2xl font-bold text-emerald-700 tabular-nums">
                {reportSummary?.paidMembersCount ?? 0}
              </div>
              <div className="text-[11px] text-emerald-700/80 mt-0.5">Up to date patrons</div>
            </div>

            <div className="bg-white border border-rose-200/90 rounded-2xl p-4 shadow-xs bg-rose-50/30">
              <div className="flex items-center gap-2 text-rose-800 text-xs mb-1">
                <UserX className="w-3.5 h-3.5 text-rose-600" />
                <span>Overdue / Defaulters</span>
              </div>
              <div className="text-2xl font-bold text-rose-700 tabular-nums">
                {reportSummary?.overdueMembersCount ?? 0}
              </div>
              <div className="text-[11px] text-rose-700/80 mt-0.5">Pending dues or expired</div>
            </div>

            <div className="bg-white border border-blue-200/90 rounded-2xl p-4 shadow-xs bg-blue-50/30">
              <div className="flex items-center gap-2 text-blue-800 text-xs mb-1">
                <IndianRupee className="w-3.5 h-3.5 text-blue-600" />
                <span>Collected in {reportSummary?.year || 2026}</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 tabular-nums">
                ₹ {(reportSummary?.totalCollectedThisYear ?? 0).toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-blue-700/80 mt-0.5">Total collected this year</div>
            </div>

            <div className="bg-white border border-amber-200/90 rounded-2xl p-4 shadow-xs bg-amber-50/30 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2 text-amber-800 text-xs mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Pending Overdue Dues</span>
              </div>
              <div className="text-2xl font-bold text-amber-700 tabular-nums">
                ₹ {(reportSummary?.totalOutstandingDues ?? 0).toLocaleString("en-IN")}
              </div>
              <div className="text-[11px] text-amber-700/80 mt-0.5">Total overdue amount</div>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
            {/* Header, Search & Filters */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] tracking-widest uppercase font-bold text-[#0d7a55]">
                  ANNUAL & MONTHLY STATUS REPORT
                </p>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Member Fee Register ({filteredMemberReport.length})
                </h3>
              </div>

              {/* Filters & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search member, ID, phone..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-[#0d7a55] focus:bg-white"
                  />
                </div>

                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-full bg-slate-50 text-slate-700 focus:outline-[#0d7a55] cursor-pointer"
                >
                  <option value="ALL">All Status ({membersReport.length})</option>
                  <option value="PAID">Fee Paid ({reportSummary?.paidMembersCount ?? 0})</option>
                  <option value="OVERDUE">Overdue ({reportSummary?.overdueMembersCount ?? 0})</option>
                  <option value="PARTIALLY_PAID">Partially Paid ({reportSummary?.partiallyPaidMembersCount ?? 0})</option>
                </select>

                <select
                  value={reportCategoryFilter}
                  onChange={(e) => setReportCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs border border-slate-200 rounded-full bg-slate-50 text-slate-700 focus:outline-[#0d7a55] cursor-pointer"
                >
                  <option value="ALL">All Categories</option>
                  <option value="GENERAL_CITIZEN">General Citizen</option>
                  <option value="STUDENT">Student</option>
                  <option value="SENIOR_CITIZEN">Senior Citizen</option>
                  <option value="RESEARCHER">Researcher</option>
                  <option value="GOVT_STAFF">Govt Staff</option>
                </select>

                <button
                  onClick={handleExportMemberReportCSV}
                  className="px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold inline-flex items-center gap-1.5 shadow-2xs transition cursor-pointer"
                  title="Export Member Fee CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Export CSV</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#f2f7f4] border-b border-slate-200/80 text-[11px] font-bold text-[#536b60] uppercase tracking-wider">
                    <th className="py-3 px-4">MEMBER & ID</th>
                    <th className="py-3 px-4">MEMBERSHIP</th>
                    <th className="py-3 px-4">MONTHS PAID ({reportSummary?.year || 2026})</th>
                    <th className="py-3 px-4">OVERDUE PERIOD</th>
                    <th className="py-3 px-4">PAID THIS YEAR</th>
                    <th className="py-3 px-4">PENDING DUES</th>
                    <th className="py-3 px-4">FEE STATUS</th>
                    <th className="py-3 px-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMemberReport.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>No members found matching the selected filter criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMemberReport.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900">{m.fullName}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono text-[11px] text-slate-500">{m.memberNo}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                              {m.category.replace("_", " ")}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                m.status === "ACTIVE" ? "bg-emerald-500" : "bg-rose-500"
                              }`}
                            />
                            <span className="font-medium text-slate-700 capitalize">{m.status.toLowerCase()}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Expires: {new Date(m.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                          </div>
                        </td>

                        {/* Months Paid This Year (with 12-month visual indicator) */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-between mb-1 gap-2">
                            <span className="font-bold text-slate-800 tabular-nums">
                              {m.monthsPaidThisYear} / 12 Months
                            </span>
                            <button
                              onClick={() => setSelectedReportMember(m)}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer underline"
                              title="View monthly grid details"
                            >
                              Details
                            </button>
                          </div>
                          {/* 12-month mini indicator bar */}
                          <div className="flex items-center gap-0.5 w-32">
                            {m.monthlyBreakdown.map((mb) => (
                              <div
                                key={mb.month}
                                className={`h-2 flex-1 rounded-xs transition ${
                                  mb.paid ? "bg-emerald-500" : "bg-slate-200"
                                }`}
                                title={`${mb.name}: ${mb.paid ? "Paid" : "Unpaid"}`}
                              />
                            ))}
                          </div>
                        </td>

                        {/* Overdue Period */}
                        <td className="py-3.5 px-4">
                          {m.monthsOverdue > 0 ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs">
                              <Clock className="w-3 h-3 text-rose-600" />
                              <span>{m.monthsOverdue} Months Overdue</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>0 Months (Nil)</span>
                            </span>
                          )}
                        </td>

                        {/* Paid Amount This Year */}
                        <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums">
                          ₹ {m.totalPaidThisYear.toLocaleString("en-IN")}
                        </td>

                        {/* Pending Dues */}
                        <td className="py-3.5 px-4 tabular-nums">
                          {m.outstandingDues > 0 ? (
                            <span className="font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              ₹ {m.outstandingDues}
                            </span>
                          ) : (
                            <span className="text-slate-400">₹ 0</span>
                          )}
                        </td>

                        {/* Fee Status */}
                        <td className="py-3.5 px-4">
                          {m.feeStatus === "PAID" && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e2f6ee] text-[#0d7a55] border border-emerald-200">
                              Paid
                            </span>
                          )}
                          {m.feeStatus === "OVERDUE" && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#fee2e2] text-[#b91c1c] border border-rose-200">
                              Overdue
                            </span>
                          )}
                          {m.feeStatus === "PARTIALLY_PAID" && (
                            <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              Partially Paid
                            </span>
                          )}
                        </td>

                        {/* Action */}
                        <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                          {m.outstandingDues > 0 || m.feeStatus !== "PAID" ? (
                            <button
                              onClick={() => {
                                setPayMember(m.memberNo);
                                setPayAmount(m.outstandingDues > 0 ? m.outstandingDues.toString() : "50");
                                setPayDesc(m.outstandingDues > 0 ? "Outstanding membership/due fees" : "Monthly/Annual membership fee");
                                setPaymentModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 font-medium inline-flex items-center gap-1 transition cursor-pointer shadow-2xs"
                              title="Collect fee from this member"
                            >
                              <Plus className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Collect Fee</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => setSelectedReportMember(m)}
                              className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 font-medium inline-flex items-center gap-1 transition cursor-pointer"
                              title="View monthly fee breakdown"
                            >
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>Months</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="py-3 px-5 bg-slate-50/70 border-t border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Government treasury member ledger covering active patrons and fiscal year compliance.</span>
              </div>
              <span className="font-mono text-[11px] text-slate-400">
                FY {reportSummary?.year || 2026}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Outstanding Dues & Fine Waivers (Supervisor Desk) */}
      {activeTab === "waivers" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-widest uppercase font-bold text-[#0d7a55]">
                SUPERVISORY DESK
              </p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Outstanding Dues & Fine Waivers
              </h3>
            </div>
            <span className="text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
              Approving Officer Sanction Active
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f2f7f4] border-b border-slate-200/80 text-[11px] font-bold text-[#536b60] uppercase tracking-wider">
                  <th className="py-3 px-5">DATE</th>
                  <th className="py-3 px-5">PATRON</th>
                  <th className="py-3 px-5">MEMBER NO.</th>
                  <th className="py-3 px-5">FEE TYPE</th>
                  <th className="py-3 px-5">OUTSTANDING</th>
                  <th className="py-3 px-5 text-right">SUPERVISOR ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outstandingCharges.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      Zero outstanding dues! All library accounts are clear.
                    </td>
                  </tr>
                ) : (
                  outstandingCharges.map((charge) => (
                    <tr key={charge.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-5 text-slate-500">{charge.createdAt}</td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900">{charge.memberName}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-600">{charge.memberNo}</td>
                      <td className="py-3.5 px-5 text-slate-700">{charge.description}</td>
                      <td className="py-3.5 px-5 font-semibold text-rose-700 tabular-nums">₹ {charge.balance.toFixed(2)}</td>
                      <td className="py-3.5 px-5 text-right space-x-2">
                        <button
                          onClick={() => {
                            setPayMember(charge.memberNo || charge.memberName);
                            setPayAmount(charge.balance.toString());
                            setPayDesc(charge.description || "Outstanding Fee");
                            setPaymentModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium cursor-pointer"
                        >
                          Collect
                        </button>
                        <button
                          onClick={() => setWaiveModalCharge(charge)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium cursor-pointer shadow-xs"
                        >
                          Waive Fine
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Payment Reversals & Audit Desk */}
      {activeTab === "reversal" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs max-w-2xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Payment Reversal Desk</h3>
              <p className="text-xs text-slate-500">Authorized reversal requiring Approving Officer digital sanction</p>
            </div>
          </div>

          <form onSubmit={handleReversalSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Receipt Number to Reverse *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. RCP-202611-00016"
                value={reversalRcpNo}
                onChange={(e) => setReversalRcpNo(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Audit Reason for Reversal *
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Counter keying error; patron charged twice. Authorized by Approving Officer."
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1">
              <p className="font-semibold">CAG Statutory Audit Notice:</p>
              <p>• Reversals permanently cancel the receipt, re-open charge balances, and log cryptographic audit records.</p>
              <p>• Requires Approving Officer / Super Admin authorization credentials.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingReversal}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                {isSubmittingReversal ? "Executing Reversal..." : "Execute Reversal & Update Ledger"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RECORD PAYMENT MODAL */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">
                Record Cash/Digital Fee Payment
              </span>
              <button onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Citizen Member Name or Card No. *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GPL-2026-00001 or Rahul Verma"
                  value={payMember}
                  onChange={(e) => setPayMember(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Payment Method
                  </label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55] bg-white"
                  >
                    <option value="Cash">Cash (Counter)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Card">Debit/Credit Card</option>
                    <option value="Manual">Manual Challan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Fee Particulars
                </label>
                <select
                  value={payDesc}
                  onChange={(e) => setPayDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55] bg-white"
                >
                  <option>Overdue fine</option>
                  <option>Membership renewal</option>
                  <option>Lost book recovery</option>
                  <option>Duplicate card fee</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#0d7a55] hover:bg-[#0a6344] text-white font-medium cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Recording..." : "Record & Issue Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUPERVISOR FINE WAIVER MODAL */}
      {waiveModalCharge && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-slate-900 text-sm">
                  Sanction Fine Waiver
                </span>
              </div>
              <button onClick={() => setWaiveModalCharge(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1">
              <p className="font-medium text-slate-700">Patron: <span className="font-bold text-slate-900">{waiveModalCharge.memberName}</span> ({waiveModalCharge.memberNo})</p>
              <p className="text-slate-600">Charge: {waiveModalCharge.description}</p>
              <p className="text-sm font-bold text-rose-700">Waiver Amount: ₹{waiveModalCharge.balance.toFixed(2)}</p>
            </div>

            <form onSubmit={handleWaiveSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Official Waiver Justification *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Senior citizen medical exemption sanctioned under Rule 14B."
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setWaiveModalCharge(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingWaiver}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-medium cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isSubmittingWaiver ? "Sanctioning..." : "Sanction Official Waiver"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT RECEIPT MODAL */}
      {selectedReceiptPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Official Treasury Receipt
              </span>
              <button
                onClick={() => setSelectedReceiptPrint(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Official Receipt Voucher Design */}
            <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 space-y-3 font-mono text-xs text-slate-800">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <p className="font-bold text-sm uppercase">District Public Library</p>
                <p className="text-[10px] text-slate-500">Government Treasury Counter #02</p>
                <p className="text-[10px] text-slate-400">{selectedReceiptPrint.date || "21 Oct 2026, 11:20 AM"}</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-bold">{selectedReceiptPrint.receiptNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payer Name:</span>
                  <span>{selectedReceiptPrint.member}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Particulars:</span>
                  <span>{selectedReceiptPrint.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Mode:</span>
                  <span>{selectedReceiptPrint.method}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between text-sm font-bold text-slate-900">
                <span>AMOUNT PAID:</span>
                <span>₹ {selectedReceiptPrint.amount}.00</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-[#0d7a55] hover:bg-[#0a6344] text-white text-xs font-semibold cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Physical Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT RECEIPT MODAL */}
      {editModalOpen && editReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Edit Receipt</h3>
                  <p className="text-[11px] font-mono text-slate-500">{editReceipt.receiptNo}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditReceipt(null);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Member:</span>
                <span className="font-semibold text-slate-800">{editReceipt.member}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date Issued:</span>
                <span className="text-slate-700">{editReceipt.date}</span>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55] bg-white"
                  >
                    <option value="Cash">Cash (Counter)</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Card">Debit/Credit Card</option>
                    <option value="Manual">Manual Challan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Description / Particulars *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Overdue fine, Lost book recovery"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditModalOpen(false);
                    setEditReceipt(null);
                  }}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium cursor-pointer shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{isSubmittingEdit ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MEMBER MONTHLY FEE DETAILS MODAL */}
      {selectedReportMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Monthly Fee Schedule</h3>
                  <p className="text-[11px] text-slate-500">
                    Fiscal Year {reportSummary?.year || 2026} • {selectedReportMember.memberNo}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReportMember(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Member Profile Card */}
            <div className="p-3.5 bg-slate-50 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">{selectedReportMember.fullName}</span>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-200/70 text-slate-700 font-medium">
                  {selectedReportMember.memberNo}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-slate-600 text-[11px]">
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                  Category: <strong>{selectedReportMember.category.replace("_", " ")}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                  Status: <strong>{selectedReportMember.status}</strong>
                </span>
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                  Valid Till: <strong>{new Date(selectedReportMember.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</strong>
                </span>
              </div>
            </div>

            {/* Metrics summary for this member */}
            <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
              <div className="p-2.5 bg-emerald-50/60 border border-emerald-200/70 rounded-xl">
                <div className="text-[10px] text-emerald-800 font-medium">Months Paid</div>
                <div className="text-base font-bold text-emerald-700 mt-0.5">
                  {selectedReportMember.monthsPaidThisYear} / 12
                </div>
              </div>
              <div className="p-2.5 bg-blue-50/60 border border-blue-200/70 rounded-xl">
                <div className="text-[10px] text-blue-800 font-medium">Fees Paid ({reportSummary?.year || 2026})</div>
                <div className="text-base font-bold text-blue-700 mt-0.5">
                  ₹ {selectedReportMember.totalPaidThisYear}
                </div>
              </div>
              <div className="p-2.5 bg-rose-50/60 border border-rose-200/70 rounded-xl">
                <div className="text-[10px] text-rose-800 font-medium">Overdue Duration</div>
                <div className="text-base font-bold text-rose-700 mt-0.5">
                  {selectedReportMember.monthsOverdue > 0 ? `${selectedReportMember.monthsOverdue} Mo` : "Nil"}
                </div>
              </div>
            </div>

            {/* 12 Months Grid */}
            <div>
              <p className="text-[11px] font-semibold text-slate-700 mb-2 uppercase tracking-wider">
                Monthly Payment Breakdown (Jan – Dec {reportSummary?.year || 2026})
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {selectedReportMember.monthlyBreakdown.map((mb) => (
                  <div
                    key={mb.month}
                    className={`p-2 rounded-xl border text-center transition ${
                      mb.paid
                        ? "bg-[#e2f6ee] border-emerald-300 text-[#0d7a55]"
                        : "bg-slate-50 border-slate-200 text-slate-400"
                    }`}
                  >
                    <div className="text-[11px] font-bold">{mb.name}</div>
                    <div className="mt-1 flex items-center justify-center">
                      {mb.paid ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">Unpaid</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedReportMember(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              {(selectedReportMember.outstandingDues > 0 || selectedReportMember.feeStatus !== "PAID") && (
                <button
                  type="button"
                  onClick={() => {
                    const m = selectedReportMember;
                    setSelectedReportMember(null);
                    setPayMember(m.memberNo);
                    setPayAmount(m.outstandingDues > 0 ? m.outstandingDues.toString() : "50");
                    setPayDesc(m.outstandingDues > 0 ? "Outstanding membership/due fees" : "Monthly/Annual membership fee");
                    setPaymentModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0d7a55] hover:bg-[#0a6344] text-white text-xs font-semibold cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Collect Payment (₹{selectedReportMember.outstandingDues > 0 ? selectedReportMember.outstandingDues : "50"})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
