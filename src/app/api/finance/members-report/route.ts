import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMemberFeeReport } from "@/lib/services/finance.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const allowedRoles = ["SUPER_ADMIN", "LIBRARIAN"];
    if (!allowedRoles.includes(session.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Staff privileges required to access member fee reports." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : undefined;

    const data = await getMemberFeeReport(year);
    return NextResponse.json(data);
  } catch (err: any) {
    console.error("Error generating member fee report:", err);
    return NextResponse.json({ error: err.message || "Failed to generate member fee report" }, { status: 500 });
  }
}
