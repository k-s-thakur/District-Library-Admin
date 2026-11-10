import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { waiveCharge } from "@/lib/services/finance.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "APPROVING_OFFICER", "LIBRARY_ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Approving Officer / Supervisor sanction required to waive charges." },
        { status: 403 }
      );
    }

    const { id: chargeId } = await params;
    const body = await req.json();
    const { waiverReason } = body;

    if (!waiverReason || waiverReason.trim().length === 0) {
      return NextResponse.json(
        { error: "A valid waiverReason is strictly required for official audit traceability." },
        { status: 400 }
      );
    }

    const result = await waiveCharge({
      chargeId,
      waiverReason: waiverReason.trim(),
      waivedBy: session.name || session.email,
      actorId: session.id,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
