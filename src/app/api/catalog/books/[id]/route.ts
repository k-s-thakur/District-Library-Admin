import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getBookDetails, updateBook, deleteBook } from "@/lib/services/catalogue.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const book = await getBookDetails(id);
    return NextResponse.json({ book });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff privileges required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const book = await updateBook(id, body, session.id);
    return NextResponse.json({ book });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Library Admin privileges required to delete books." }, { status: 403 });
    }

    const { id } = await params;
    const result = await deleteBook(id, session.id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
