"use client";

import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, Bookmark } from "lucide-react";

interface ReservationButtonProps {
  bookId: string;
  availableCopies: number;
  totalCopies: number;
  activeReservationsCount?: number;
}

export default function ReservationButton({
  bookId,
  availableCopies,
  totalCopies,
  activeReservationsCount = 0,
}: ReservationButtonProps) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleReserve = async () => {
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("/api/circulation/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error(
            "Please sign in as a registered library member to reserve this title."
          );
        }
        throw new Error(data.error || "Reservation request could not be processed.");
      }

      setSuccessMessage(
        `Reservation confirmed! You are position #${data.queuePosition} in queue. You will be notified when a copy is returned to the shelf.`
      );
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {availableCopies > 0 ? (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 space-y-1">
          <div className="font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Copies Available for Walk-in Loan</span>
          </div>
          <p className="text-emerald-700">
            {availableCopies} copies are currently on the stacks. Reservations are reserved for titles currently in full circulation.
          </p>
        </div>
      ) : (
        <button
          onClick={handleReserve}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-semibold text-sm shadow-md transition cursor-pointer"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
          <span>Hold / Reserve Title ({activeReservationsCount} currently waiting)</span>
        </button>
      )}

      {/* Success banner */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error banner */}
      {errorMessage && (
        <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
          {errorMessage.includes("sign in") && (
            <Link
              href="/login"
              className="text-center py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-lg font-semibold text-xs transition"
            >
              Go to Member Sign In
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
