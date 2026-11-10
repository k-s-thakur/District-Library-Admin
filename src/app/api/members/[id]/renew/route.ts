import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { renewMembership } from "@/lib/services/member.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff privileges required to renew membership." }, { status: 403 });
    }

    const { id } = await params;
    const result = await renewMembership(id, session.id);

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
