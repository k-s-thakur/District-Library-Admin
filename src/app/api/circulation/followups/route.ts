import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getCirculationFollowUps } from "@/lib/services/circulation.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN", "ACCOUNTS_OPERATOR"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff privileges required to view circulation follow-ups." }, { status: 403 });
    }

    const data = await getCirculationFollowUps();
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
