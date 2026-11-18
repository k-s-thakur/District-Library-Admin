import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { searchCatalogue, createBook } from "@/lib/services/catalogue.service";
import { validateIsbn } from "@/lib/isbn";

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
    if (!session || !["SUPER_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Librarian privileges required to add books." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, isbn, subtitle, edition, publicationYear, language, ddcCode, bookNumber, description, coverImageUrl, categoryId, categoryName, publisherName, authors, isFeatured } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    const currentYear = new Date().getFullYear();
    if (publicationYear && Number(publicationYear) > currentYear) {
      return NextResponse.json(
        { error: `प्रकाशन वर्ष वर्तमान वर्ष (${currentYear}) से अधिक नहीं हो सकता। (Publication year cannot exceed ${currentYear})` },
        { status: 400 }
      );
    }

    // ISBN is optional and has no restrictions.
    // If not provided, generate a unique catalog identifier for database uniqueness.
    const finalIsbn = isbn && isbn.trim().length > 0
      ? isbn.trim()
      : `LIB-${Date.now().toString().slice(-8)}-${Math.floor(Math.random() * 1000)}`;

    const book = await createBook(
      {
        title,
        isbn: finalIsbn,
        subtitle,
        edition,
        publicationYear: publicationYear ? Number(publicationYear) : undefined,
        language,
        ddcCode,
        bookNumber,
        description,
        coverImageUrl,
        categoryId,
        categoryName,
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
