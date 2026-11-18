import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { reversePayment } from "@/lib/services/finance.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Admin authorization is required to reverse transactions." },
        { status: 403 }
      );
    }

    const { id: paymentId } = await params;
    const body = await req.json();
    const { reversalReason } = body;

    if (!reversalReason || reversalReason.trim().length === 0) {
      return NextResponse.json(
        { error: "A valid reversalReason is strictly required for official audit traceability." },
        { status: 400 }
      );
    }

    const result = await reversePayment({
      paymentId,
      reversalReason,
      authorizedBy: session.name || session.email,
      operatorId: session.id,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
