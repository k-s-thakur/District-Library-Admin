import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDailyCollectionReport } from "@/lib/services/finance.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Staff privileges required to access collection reports." },
        { status: 403 }
      );
    }

    const report = await getDailyCollectionReport();
    return NextResponse.json(report);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
