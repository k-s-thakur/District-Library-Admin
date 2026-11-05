"use client";

import { useState } from "react";
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
} from "lucide-react";

interface PaymentReceipt {
  id: string;
  receiptNo: string;
  member: string;
  description: string;
  method: "Cash" | "Manual" | "UPI" | "Card";
  amount: number;
  status: "Sample" | "Paid" | "Reversed";
  date?: string;
  reversalReason?: string;
}

const initialReceipts: PaymentReceipt[] = [
  {
    id: "rcp-1",
    receiptNo: "RCP-2026-1084",
    member: "Ananya Sharma",
    description: "Overdue fine",
    method: "Cash",
    amount: 40,
    status: "Sample",
    date: "21 Oct 2026, 11:20 AM",
  },
  {
    id: "rcp-2",
    receiptNo: "RCP-2026-1083",
    member: "Sana Qureshi",
    description: "Membership renewal",
    method: "Cash",
    amount: 100,
    status: "Sample",
    date: "21 Oct 2026, 10:45 AM",
  },
  {
    id: "rcp-3",
    receiptNo: "RCP-2026-1082",
    member: "Rahul Verma",
    description: "Lost book recovery",
    method: "Manual",
    amount: 250,
    status: "Sample",
    date: "21 Oct 2026, 09:15 AM",
  },
  {
    id: "rcp-4",
    receiptNo: "RCP-2026-1081",
    member: "Kabir Singh",
    description: "Annual subscription",
    method: "Cash",
    amount: 150,
    status: "Sample",
    date: "20 Oct 2026, 04:30 PM",
  },
];

export default function StaffFinancePage() {
  const [activeTab, setActiveTab] = useState<"register" | "reversal">("register");
  const [receipts, setReceipts] = useState<PaymentReceipt[]>(initialReceipts);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedReceiptPrint, setSelectedReceiptPrint] = useState<PaymentReceipt | null>(null);

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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const generatedRcp = `RCP-2026-${Math.floor(1085 + receipts.length)}`;
    const newReceipt: PaymentReceipt = {
      id: `rcp-${Date.now()}`,
      receiptNo: generatedRcp,
      member: payMember.trim(),
      description: payDesc,
      method: payMethod,
      amount: Number(payAmount),
      status: "Paid",
      date: "Just now",
    };

    setReceipts([newReceipt, ...receipts]);
    setIsSubmitting(false);
    setPaymentModalOpen(false);
    setPayMember("");
    showToast(`Payment of ₹${payAmount} recorded. Generated receipt ${generatedRcp}.`);
  };

  const handleReversalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReversal(true);
    setTimeout(() => {
      setReceipts((prev) =>
        prev.map((r) =>
          r.receiptNo.toLowerCase() === reversalRcpNo.trim().toLowerCase()
            ? { ...r, status: "Reversed", reversalReason }
            : r
        )
      );
      setIsSubmittingReversal(false);
      setReversalRcpNo("");
      setReversalReason("");
      showToast("Payment reversed and marked in audit ledger.");
      setActiveTab("register");
    }, 600);
  };

  const handleExportCSV = () => {
    const headers = ["Receipt No", "Member", "Description", "Method", "Amount", "Status"];
    const rows = receipts.map((r) => [
      r.receiptNo,
      `"${r.member}"`,
      `"${r.description}"`,
      r.method,
      `₹ ${r.amount}`,
      r.status,
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
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Register</span>
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
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">₹ 2,840</div>
            <div className="text-xs text-slate-500 mt-0.5">Collected Today (18 receipts)</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#e8f2fe] text-[#2563eb] flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900 tabular-nums leading-tight">₹ 18,620</div>
            <div className="text-xs text-slate-500 mt-0.5">Collected This Month</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#fdeeed] text-[#dc2626] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600 tabular-nums leading-tight">₹ 6,180</div>
            <div className="text-xs text-slate-500 mt-0.5">Outstanding Overdue Dues</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#f0edfb] text-[#7c3aed] flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-700 tabular-nums leading-tight">₹ 120</div>
            <div className="text-xs text-slate-500 mt-0.5">Waivers Recorded</div>
          </div>
        </div>
      </div>

      {/* Finance Sub-tabs */}
      <div className="flex border-b border-slate-200 gap-6 overflow-x-auto text-xs font-medium pt-1">
        <button
          onClick={() => setActiveTab("register")}
          className={`pb-2.5 font-medium transition cursor-pointer ${
            activeTab === "register"
              ? "border-b-2 border-[#0d7a55] text-[#0d7a55] font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Receipts Register ({receipts.length})
        </button>
        <button
          onClick={() => setActiveTab("reversal")}
          className={`pb-2.5 font-medium transition cursor-pointer ${
            activeTab === "reversal"
              ? "border-b-2 border-[#0d7a55] text-[#0d7a55] font-semibold"
              : "border-b-2 border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          Payment Reversals & Audit Desk
        </button>
      </div>

      {/* TAB 1: Payment Register */}
      {activeTab === "register" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-widest uppercase font-bold text-[#0d7a55]">
                RECENT RECEIPTS
              </p>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Payment Register
              </h3>
            </div>
            <button
              onClick={() => showToast("Displaying all 18 receipts for current billing cycle.")}
              className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-[#0d7a55] font-medium transition cursor-pointer"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
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
                {receipts.map((rcp) => (
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

                    <td className="py-3.5 px-5 text-right">
                      <button
                        onClick={() => setSelectedReceiptPrint(rcp)}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 inline-flex items-center gap-1 transition cursor-pointer"
                        title="Print receipt voucher"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline text-xs font-medium">Slip</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="py-3 px-5 bg-slate-50/70 border-t border-slate-200/80 text-xs text-slate-500 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            <span>Government receipts recorded in compliance with State Financial Audits.</span>
          </div>
        </div>
      )}

      {/* TAB 2: Payment Reversals & Audit Desk */}
      {activeTab === "reversal" && (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs max-w-2xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Payment Reversal</h3>
              <p className="text-xs text-slate-500">Authorized reversal of wrongly credited fee or fine</p>
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
                placeholder="e.g. RCP-2026-1084"
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
                placeholder="e.g. System duplicate charge reversal authorized by Sub-Librarian"
                value={reversalReason}
                onChange={(e) => setReversalReason(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-[#0d7a55]"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1">
              <p className="font-semibold">Audit Warning:</p>
              <p>• Reversals are permanently logged in the Comptroller & Auditor General ledger.</p>
              <p>• Requires librarian supervisor pin authentication upon annual audit.</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingReversal}
                className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-medium shadow-xs transition cursor-pointer"
              >
                {isSubmittingReversal ? "Reversing..." : "Execute Reversal & Update Ledger"}
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
                  placeholder="e.g. MBR-2024-0185 or Rahul Verma"
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
                    <option value="Manual">Manual Receipt</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Fee Type
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
                  className="px-4 py-2 rounded-xl bg-[#0d7a55] hover:bg-[#0a6344] text-white font-medium cursor-pointer"
                >
                  {isSubmitting ? "Recording..." : "Record & Print Voucher"}
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
    </div>
  );
}
