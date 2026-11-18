import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { issueBook } from "@/lib/services/circulation.service";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Librarian privileges required to issue books." }, { status: 403 });
    }

    const body = await req.json();
    const { memberIdentifier, copyIdentifier } = body;

    if (!memberIdentifier || !copyIdentifier) {
      return NextResponse.json(
        { error: "memberIdentifier (Member No or ID) and copyIdentifier (Accession No or QR) are required." },
        { status: 400 }
      );
    }

    const result = await issueBook({
      memberIdentifier,
      copyIdentifier,
      actorId: session.id,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
