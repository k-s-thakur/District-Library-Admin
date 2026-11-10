import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchCatalogue, createBook } from "@/lib/services/catalogue.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query") || undefined;
    const categoryCode = searchParams.get("categoryCode") || undefined;
    const ddcPrefix = searchParams.get("ddcPrefix") || undefined;
    const language = searchParams.get("language") || undefined;
    const availableOnly = searchParams.get("availableOnly") === "true";
    const sortBy = (searchParams.get("sortBy") as any) || undefined;
    const page = searchParams.get("page") ? parseInt(searchParams.get("page")!, 10) : 1;
    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 50;

    const result = await searchCatalogue({
      query,
      categoryCode,
      ddcPrefix,
      language,
      availableOnly,
      sortBy,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Librarian privileges required to add books." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, isbn, subtitle, edition, publicationYear, language, ddcCode, bookNumber, description, coverImageUrl, categoryId, publisherName, authors, isFeatured } = body;

    if (!title || !isbn) {
      return NextResponse.json({ error: "Title and ISBN are required." }, { status: 400 });
    }

    const book = await createBook(
      {
        title,
        isbn,
        subtitle,
        edition,
        publicationYear,
        language,
        ddcCode,
        bookNumber,
        description,
        coverImageUrl,
        categoryId,
        publisherName,
        authors,
        isFeatured,
      },
      session.id
    );

    return NextResponse.json({ book }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
