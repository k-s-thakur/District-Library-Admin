import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { renewLoan } from "@/lib/services/circulation.service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required to renew a loan." }, { status: 401 });
    }

    const body = await req.json();
    const { loanId } = body;

    if (!loanId) {
      return NextResponse.json({ error: "loanId is required." }, { status: 400 });
    }

    // Role verification
    const isStaff = ["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN"].includes(session.role);
    if (!isStaff) {
      // Member can only renew their own loan
      const targetLoan = await prisma.loan.findUnique({
        where: { id: loanId },
        select: { memberId: true },
      });
      if (!targetLoan || targetLoan.memberId !== session.memberId) {
        return NextResponse.json({ error: "Unauthorized. You may only renew your own loans." }, { status: 403 });
      }
    }

    const result = await renewLoan({
      loanId,
      actorId: session.id,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
