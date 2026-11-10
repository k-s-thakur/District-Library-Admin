import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updateBookCopy } from "@/lib/services/catalogue.service";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff privileges required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const copy = await updateBookCopy(id, body, session.id);
    return NextResponse.json({ copy });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
