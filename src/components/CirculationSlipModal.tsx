"use client";

import React, { useRef } from "react";
import { Printer, X, CheckCircle2, BookOpen, User, Calendar, AlertCircle } from "lucide-react";
import BarcodeSVG from "./BarcodeSVG";

export interface CirculationSlipData {
  type: "ISSUE" | "RETURN";
  timestamp: string;
  memberName: string;
  memberNo: string;
  bookTitle: string;
  accessionNo: string;
  dueDate?: string;
  returnDate?: string;
  fineAmount?: number;
  loanId?: string;
}

interface CirculationSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CirculationSlipData | null;
}

export function CirculationSlipModal({ isOpen, onClose, data }: CirculationSlipModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !data) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0d7a55]" />
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              {data.type === "ISSUE" ? "Book Issued Successfully" : "Book Returned Successfully"}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Style Voucher (80mm width look) */}
        <div
          ref={printRef}
          className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-slate-800 space-y-3 font-mono text-[11px]"
        >
          <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
            <p className="font-bold text-slate-900 text-xs">DISTRICT CENTRAL PUBLIC LIBRARY</p>
            <p className="text-[10px] text-slate-500 uppercase">Government of India · Public Knowledge Stack</p>
            <p className="text-[10px] font-bold text-[#0d7a55] pt-0.5">
              *** {data.type === "ISSUE" ? "CIRCULATION CHECKOUT SLIP" : "RETURN CHECK-IN RECEIPT"} ***
            </p>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Date & Time:</span>
              <span className="font-semibold text-slate-800">
                {new Date(data.timestamp).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Member:</span>
              <span className="font-bold text-slate-900">{data.memberName}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Card No:</span>
              <span className="font-semibold text-slate-800">{data.memberNo}</span>
            </div>

            <div className="border-t border-slate-200 pt-1.5">
              <span className="text-slate-500 block">Title:</span>
              <span className="font-bold text-slate-900 text-xs block truncate" title={data.bookTitle}>
                {data.bookTitle}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Accession No:</span>
              <span className="font-semibold text-slate-800">{data.accessionNo}</span>
            </div>

            {data.type === "ISSUE" && data.dueDate && (
              <div className="p-2 rounded bg-emerald-100/70 border border-emerald-300 text-emerald-950 mt-2 text-center">
                <span className="text-[10px] uppercase font-bold block text-emerald-800">Return Due Date</span>
                <span className="text-sm font-extrabold block">{data.dueDate}</span>
              </div>
            )}

            {data.type === "RETURN" && data.fineAmount !== undefined && (
              <div className="p-2 rounded bg-slate-100 border border-slate-200 text-center mt-2">
                <span className="text-[10px] uppercase font-bold text-slate-600 block">Overdue Fine</span>
                <span className={`text-sm font-bold ${data.fineAmount > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                  {data.fineAmount > 0 ? `₹${data.fineAmount.toFixed(2)} (Outstanding)` : "₹0.00 (Cleared On-Time)"}
                </span>
              </div>
            )}
          </div>

          <div className="border-t border-dashed border-slate-300 pt-3 text-center space-y-2">
            <div className="flex justify-center">
              <BarcodeSVG value={data.accessionNo} width={160} height={32} showText={false} />
            </div>
            <p className="text-[9px] text-slate-500">
              {data.type === "ISSUE"
                ? "Please return or renew on or before the due date. Standard overdue fine: ₹2/day after grace period."
                : "Thank you for returning library material on time. Books are sanitized and shelved."}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0d7a55] hover:bg-[#0a6344] text-white rounded-xl text-xs font-semibold shadow-xs transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Slip</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
