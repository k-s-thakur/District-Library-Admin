import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listAccessionRegister, addBookCopy, generateNextAccessionNo } from "@/lib/services/catalogue.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN", "ACCOUNTS_OPERATOR"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff privileges required to view accession register." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;
    const condition = searchParams.get("condition") || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;
    const nextAccession = searchParams.get("nextAccession") === "true";

    if (nextAccession) {
      const nextNo = await generateNextAccessionNo();
      return NextResponse.json({ nextAccessionNo: nextNo });
    }

    const register = await listAccessionRegister({ search, status, condition, page, limit });
    return NextResponse.json(register);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Librarian privileges required to accession copies." }, { status: 403 });
    }

    const body = await req.json();
    const { bookId, accessionNo, shelfLocation, acquisitionCost, condition, status } = body;

    if (!bookId) {
      return NextResponse.json({ error: "bookId is required." }, { status: 400 });
    }

    const copy = await addBookCopy(
      {
        bookId,
        accessionNo,
        shelfLocation,
        acquisitionCost,
        condition,
        status,
      },
      session.id
    );

    return NextResponse.json({ copy }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
