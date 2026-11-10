import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { dispatchLoanReminder, dispatchBulkReminders } from "@/lib/services/circulation.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN", "ACCOUNTS_OPERATOR"].includes(session.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Staff privileges required to dispatch circulation reminders." },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { loanId, bulk, loanIds } = body;

    if (bulk || (loanIds && Array.isArray(loanIds))) {
      const result = await dispatchBulkReminders(session.id, loanIds);
      return NextResponse.json({
        success: true,
        message: `Dispatched ${result.totalDispatched} reminder notice(s).`,
        ...result,
      });
    }

    if (!loanId) {
      return NextResponse.json(
        { error: "loanId or bulk: true is required" },
        { status: 400 }
      );
    }

    const result = await dispatchLoanReminder({
      loanId,
      actorId: session.id,
    });

    return NextResponse.json({
      success: true,
      message: `Reminder successfully sent to ${result.member} for "${result.bookTitle}".`,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
