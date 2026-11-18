import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { returnBook } from "@/lib/services/circulation.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff privileges required to process returns." }, { status: 403 });
    }

    const body = await req.json();
    const { copyIdentifier } = body;

    if (!copyIdentifier) {
      return NextResponse.json({ error: "copyIdentifier (Accession No or QR) is required." }, { status: 400 });
    }

    const result = await returnBook({
      copyIdentifier,
      actorId: session.id,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
