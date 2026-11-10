import { prisma } from "../prisma";
import crypto from "crypto";

export interface SearchCatalogParams {
  query?: string;
  categoryCode?: string;
  ddcPrefix?: string;
  language?: string;
  availableOnly?: boolean;
  sortBy?: "relevance" | "title_asc" | "title_desc" | "author_asc" | "newest";
  page?: number;
  limit?: number;
}

export interface SafeBookSummary {
  id: string;
  isbn: string;
  title: string;
  subtitle?: string | null;
  edition?: string | null;
  publicationYear?: number | null;
  language: string;
  ddcCode?: string | null;
  bookNumber?: string | null;
  description?: string | null;
  coverImageUrl?: string | null;
  publisher: string;
  category: {
    id: string;
    name: string;
    code: string;
    ddcPrefix?: string | null;
  } | null;
  authors: string;
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  referenceOnlyCopies: number;
  primaryLocation: string;
  availabilityStatus: "Available" | "All copies issued" | "Reference only" | "Availability unknown";
  shelfLocations: string[];
}

export async function searchCatalogue(params: SearchCatalogParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(50, params.limit || 12));
  const skip = (page - 1) * limit;

  const where: any = {};

  if (params.query && params.query.trim().length > 0) {
    const q = params.query.trim();
    where.OR = [
      { title: { contains: q } },
      { subtitle: { contains: q } },
      { isbn: { contains: q } },
      { ddcCode: { contains: q } },
      { description: { contains: q } },
      { authors: { some: { author: { name: { contains: q } } } } },
      { publisher: { name: { contains: q } } },
      { category: { name: { contains: q } } },
    ];
  }

  if (params.categoryCode) {
    where.category = { code: params.categoryCode };
  }

  if (params.ddcPrefix) {
    where.ddcCode = { startsWith: params.ddcPrefix };
  }

  if (params.language) {
    where.language = { contains: params.language };
  }

  if (params.availableOnly) {
    where.copies = {
      some: {
        status: "AVAILABLE",
      },
    };
  }

  let orderBy: any = { createdAt: "desc" };
  if (params.sortBy === "title_asc") {
    orderBy = { title: "asc" };
  } else if (params.sortBy === "title_desc") {
    orderBy = { title: "desc" };
  } else if (params.sortBy === "newest") {
    orderBy = { publicationYear: "desc" };
  }

  const [totalCount, books] = await Promise.all([
    prisma.book.count({ where }),
    prisma.book.findMany({
      where,
      skip,
      take: limit,
      include: {
        authors: { include: { author: true } },
        publisher: true,
        category: true,
        copies: {
          select: {
            id: true,
            accessionNo: true,
            status: true,
            shelfLocation: true,
            copyNumber: true,
          },
        },
      },
      orderBy,
    }),
  ]);

  const items: SafeBookSummary[] = books.map((b) => {
    const totalCopies = b.copies.length;
    const availableCopies = b.copies.filter((c) => c.status === "AVAILABLE").length;
    const issuedCopies = b.copies.filter((c) => c.status === "ISSUED").length;
    const referenceOnlyCopies = b.copies.filter((c) => c.status === "REFERENCE_ONLY").length;

    let availabilityStatus: SafeBookSummary["availabilityStatus"] = "Availability unknown";
    if (totalCopies === 0) {
      availabilityStatus = "Availability unknown";
    } else if (availableCopies > 0) {
      availabilityStatus = "Available";
    } else if (referenceOnlyCopies === totalCopies) {
      availabilityStatus = "Reference only";
    } else {
      availabilityStatus = "All copies issued";
    }

    const uniqueShelves = Array.from(
      new Set(b.copies.map((c) => c.shelfLocation).filter(Boolean) as string[])
    );

    return {
      id: b.id,
      isbn: b.isbn,
      title: b.title,
      subtitle: b.subtitle,
      edition: b.edition,
      publicationYear: b.publicationYear,
      language: b.language,
      ddcCode: b.ddcCode,
      bookNumber: b.bookNumber,
      description: b.description,
      coverImageUrl: b.coverImageUrl,
      publisher: b.publisher?.name || "Official Publications",
      category: b.category
        ? {
            id: b.category.id,
            name: b.category.name,
            code: b.category.code,
            ddcPrefix: b.category.ddcPrefix,
          }
        : null,
      authors: b.authors.map((a) => a.author.name).join(", "),
      totalCopies,
      availableCopies,
      issuedCopies,
      referenceOnlyCopies,
      primaryLocation: uniqueShelves[0] || "General Reading Stack",
      availabilityStatus,
      shelfLocations: uniqueShelves,
    };
  });

  return {
    items,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}

export async function getBookDetails(idOrIsbn: string) {
  const book = await prisma.book.findFirst({
    where: {
      OR: [{ id: idOrIsbn }, { isbn: idOrIsbn }],
    },
    include: {
      authors: { include: { author: true } },
      publisher: true,
      category: true,
      copies: {
        select: {
          id: true,
          accessionNo: true,
          copyNumber: true,
          shelfLocation: true,
          condition: true,
          status: true,
        },
        orderBy: { copyNumber: "asc" },
      },
      reservations: {
        where: { status: "PENDING" },
        select: {
          id: true,
          queuePosition: true,
          reservedAt: true,
        },
        orderBy: { queuePosition: "asc" },
      },
    },
  });

  if (!book) {
    throw new Error(`Book with identifier "${idOrIsbn}" was not found in the public catalogue.`);
  }

  const totalCopies = book.copies.length;
  const availableCopies = book.copies.filter((c) => c.status === "AVAILABLE").length;
  const issuedCopies = book.copies.filter((c) => c.status === "ISSUED").length;
  const referenceOnlyCopies = book.copies.filter((c) => c.status === "REFERENCE_ONLY").length;

  let availabilityStatus: SafeBookSummary["availabilityStatus"] = "Availability unknown";
  if (totalCopies === 0) {
    availabilityStatus = "Availability unknown";
  } else if (availableCopies > 0) {
    availabilityStatus = "Available";
  } else if (referenceOnlyCopies === totalCopies) {
    availabilityStatus = "Reference only";
  } else {
    availabilityStatus = "All copies issued";
  }

  return {
    id: book.id,
    isbn: book.isbn,
    title: book.title,
    subtitle: book.subtitle,
    edition: book.edition,
    publicationYear: book.publicationYear,
    language: book.language,
    ddcCode: book.ddcCode,
    bookNumber: book.bookNumber,
    description: book.description,
    coverImageUrl: book.coverImageUrl,
    publisher: book.publisher ? { id: book.publisher.id, name: book.publisher.name } : null,
    category: book.category
      ? {
          id: book.category.id,
          name: book.category.name,
          code: book.category.code,
          ddcPrefix: book.category.ddcPrefix,
        }
      : null,
    authors: book.authors.map((a) => ({ id: a.author.id, name: a.author.name })),
    authorsString: book.authors.map((a) => a.author.name).join(", "),
    totalCopies,
    availableCopies,
    issuedCopies,
    referenceOnlyCopies,
    availabilityStatus,
    copies: book.copies.map((c) => ({
      accessionNo: c.accessionNo,
      copyNumber: c.copyNumber,
      shelfLocation: c.shelfLocation || "Main Reading Stack",
      status: c.status,
    })),
    activeReservationsCount: book.reservations.length,
  };
}

export async function getCuratedCatalog() {
  const [editorsChoice, popular, recentlyAdded, featured] = await Promise.all([
    searchCatalogue({ limit: 6, sortBy: "relevance" }),
    searchCatalogue({ limit: 6, sortBy: "title_asc" }),
    searchCatalogue({ limit: 6, sortBy: "newest" }),
    prisma.book.findMany({
      where: { isFeatured: true },
      take: 4,
      include: {
        authors: { include: { author: true } },
        publisher: true,
        category: true,
        copies: {
          select: { status: true, shelfLocation: true },
        },
      },
    }),
  ]);

  const safeFeatured: SafeBookSummary[] = featured.map((b) => {
    const totalCopies = b.copies.length;
    const availableCopies = b.copies.filter((c) => c.status === "AVAILABLE").length;
    const referenceOnlyCopies = b.copies.filter((c) => c.status === "REFERENCE_ONLY").length;
    const issuedCopies = b.copies.filter((c) => c.status === "ISSUED").length;

    let availabilityStatus: SafeBookSummary["availabilityStatus"] = "Availability unknown";
    if (totalCopies === 0) {
      availabilityStatus = "Availability unknown";
    } else if (availableCopies > 0) {
      availabilityStatus = "Available";
    } else if (referenceOnlyCopies === totalCopies) {
      availabilityStatus = "Reference only";
    } else {
      availabilityStatus = "All copies issued";
    }

    return {
      id: b.id,
      isbn: b.isbn,
      title: b.title,
      subtitle: b.subtitle,
      edition: b.edition,
      publicationYear: b.publicationYear,
      language: b.language,
      ddcCode: b.ddcCode,
      bookNumber: b.bookNumber,
      description: b.description,
      coverImageUrl: b.coverImageUrl,
      publisher: b.publisher?.name || "Official Publications",
      category: b.category
        ? {
            id: b.category.id,
            name: b.category.name,
            code: b.category.code,
            ddcPrefix: b.category.ddcPrefix,
          }
        : null,
      authors: b.authors.map((a) => a.author.name).join(", "),
      totalCopies,
      availableCopies,
      issuedCopies,
      referenceOnlyCopies,
      primaryLocation: b.copies[0]?.shelfLocation || "Main Reading Hall",
      availabilityStatus,
      shelfLocations: [b.copies[0]?.shelfLocation || "Main Reading Hall"],
    };
  });

  return {
    featured: safeFeatured,
    editorsChoice: editorsChoice.items,
    popular: popular.items,
    recentlyAdded: recentlyAdded.items,
  };
}

export async function getCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { books: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    code: c.code,
    ddcPrefix: c.ddcPrefix,
    description: c.description,
    iconName: c.iconName,
    accentColor: c.accentColor || "teal",
    booksCount: c._count.books,
  }));
}

export interface CreateBookInput {
  title: string;
  isbn: string;
  subtitle?: string;
  edition?: string;
  publicationYear?: number;
  language?: string;
  ddcCode?: string;
  bookNumber?: string;
  description?: string;
  coverImageUrl?: string;
  categoryId?: string;
  publisherName?: string;
  authors?: string[]; // author names
  isFeatured?: boolean;
}

export interface UpdateBookInput {
  title?: string;
  subtitle?: string;
  edition?: string;
  publicationYear?: number;
  language?: string;
  ddcCode?: string;
  bookNumber?: string;
  description?: string;
  coverImageUrl?: string;
  categoryId?: string;
  publisherName?: string;
  authors?: string[];
  isFeatured?: boolean;
}

export interface AddBookCopyInput {
  bookId: string;
  accessionNo?: string;
  shelfLocation?: string;
  acquisitionCost?: number;
  condition?: "NEW" | "GOOD" | "FAIR" | "POOR";
  status?: "AVAILABLE" | "REFERENCE_ONLY";
}

export interface UpdateBookCopyInput {
  shelfLocation?: string;
  acquisitionCost?: number;
  condition?: "NEW" | "GOOD" | "FAIR" | "POOR";
  status?: "AVAILABLE" | "REFERENCE_ONLY" | "DAMAGED" | "LOST" | "WITHDRAWN";
}

const TX_OPTIONS = { maxWait: 20000, timeout: 60000 };

export async function createBook(input: CreateBookInput, actorId: string) {
  const bookId = await prisma.$transaction(async (tx) => {
    // 1. Verify unique ISBN
    const existing = await tx.book.findUnique({ where: { isbn: input.isbn } });
    if (existing) {
      throw new Error(`A book with ISBN "${input.isbn}" already exists: "${existing.title}".`);
    }

    // 2. Handle publisher if provided
    let publisherId: string | null = null;
    if (input.publisherName && input.publisherName.trim()) {
      const pubName = input.publisherName.trim();
      let pub = await tx.publisher.findUnique({ where: { name: pubName } });
      if (!pub) {
        pub = await tx.publisher.create({ data: { name: pubName } });
      }
      publisherId = pub.id;
    }

    // 3. Create book
    const book = await tx.book.create({
      data: {
        isbn: input.isbn.trim(),
        title: input.title.trim(),
        subtitle: input.subtitle?.trim() || null,
        edition: input.edition?.trim() || null,
        publicationYear: input.publicationYear ? Number(input.publicationYear) : null,
        language: input.language || "Hindi/English",
        ddcCode: input.ddcCode?.trim() || null,
        bookNumber: input.bookNumber?.trim() || null,
        description: input.description?.trim() || null,
        coverImageUrl: input.coverImageUrl?.trim() || null,
        categoryId: input.categoryId || null,
        publisherId,
        isFeatured: input.isFeatured ?? false,
      },
    });

    // 4. Link authors
    if (input.authors && input.authors.length > 0) {
      for (const authorName of input.authors) {
        const cleanName = authorName.trim();
        if (!cleanName) continue;
        let author = await tx.author.findUnique({ where: { name: cleanName } });
        if (!author) {
          author = await tx.author.create({ data: { name: cleanName } });
        }
        await tx.bookAuthor.create({
          data: {
            bookId: book.id,
            authorId: author.id,
          },
        });
      }
    }

    // 5. Audit log
    await tx.auditLog.create({
      data: {
        actorId,
        action: "BOOK_CREATED",
        entityType: "Book",
        entityId: book.id,
        metadataJson: JSON.stringify({ title: book.title, isbn: book.isbn }),
      },
    });

    return book.id;
  }, TX_OPTIONS);

  return await getBookDetails(bookId);
}

export async function updateBook(id: string, input: UpdateBookInput, actorId: string) {
  await prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({ where: { id } });
    if (!book) throw new Error("Book not found.");

    let publisherId = book.publisherId;
    if (input.publisherName !== undefined) {
      if (input.publisherName && input.publisherName.trim()) {
        const pubName = input.publisherName.trim();
        let pub = await tx.publisher.findUnique({ where: { name: pubName } });
        if (!pub) {
          pub = await tx.publisher.create({ data: { name: pubName } });
        }
        publisherId = pub.id;
      } else {
        publisherId = null;
      }
    }

    await tx.book.update({
      where: { id },
      data: {
        title: input.title !== undefined ? input.title.trim() : book.title,
        subtitle: input.subtitle !== undefined ? input.subtitle?.trim() || null : book.subtitle,
        edition: input.edition !== undefined ? input.edition?.trim() || null : book.edition,
        publicationYear: input.publicationYear !== undefined ? input.publicationYear : book.publicationYear,
        language: input.language !== undefined ? input.language : book.language,
        ddcCode: input.ddcCode !== undefined ? input.ddcCode?.trim() || null : book.ddcCode,
        bookNumber: input.bookNumber !== undefined ? input.bookNumber?.trim() || null : book.bookNumber,
        description: input.description !== undefined ? input.description?.trim() || null : book.description,
        coverImageUrl: input.coverImageUrl !== undefined ? input.coverImageUrl?.trim() || null : book.coverImageUrl,
        categoryId: input.categoryId !== undefined ? input.categoryId : book.categoryId,
        publisherId,
        isFeatured: input.isFeatured !== undefined ? input.isFeatured : book.isFeatured,
      },
    });

    // Update authors if supplied
    if (input.authors !== undefined) {
      await tx.bookAuthor.deleteMany({ where: { bookId: id } });
      for (const authorName of input.authors) {
        const cleanName = authorName.trim();
        if (!cleanName) continue;
        let author = await tx.author.findUnique({ where: { name: cleanName } });
        if (!author) {
          author = await tx.author.create({ data: { name: cleanName } });
        }
        await tx.bookAuthor.create({
          data: {
            bookId: id,
            authorId: author.id,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorId,
        action: "BOOK_UPDATED",
        entityType: "Book",
        entityId: id,
        metadataJson: JSON.stringify({ title: input.title || book.title }),
      },
    });
  }, TX_OPTIONS);

  return await getBookDetails(id);
}

export async function deleteBook(id: string, actorId: string) {
  return await prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({
      where: { id },
      include: {
        copies: {
          include: {
            loans: { where: { status: "ACTIVE" } },
          },
        },
      },
    });

    if (!book) throw new Error("Book not found.");

    const activeLoans = book.copies.flatMap((c) => c.loans);
    if (activeLoans.length > 0) {
      throw new Error(`Cannot delete book: ${activeLoans.length} physical copies are currently on active loan.`);
    }

    const copyIds = book.copies.map((c) => c.id);
    await tx.bookAuthor.deleteMany({ where: { bookId: id } });
    await tx.reservation.deleteMany({ where: { bookId: id } });
    await tx.feeCharge.deleteMany({ where: { loan: { copyId: { in: copyIds } } } });
    await tx.loan.deleteMany({ where: { copyId: { in: copyIds } } });
    await tx.bookCopy.deleteMany({ where: { bookId: id } });
    await tx.book.delete({ where: { id } });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "BOOK_DELETED",
        entityType: "Book",
        entityId: id,
        metadataJson: JSON.stringify({ title: book.title, isbn: book.isbn }),
      },
    });

    return { success: true, title: book.title };
  }, TX_OPTIONS);
}

export async function generateNextAccessionNo(year = new Date().getFullYear()): Promise<string> {
  const prefix = `ACC-${year}-`;
  const copies = await prisma.bookCopy.findMany({
    where: { accessionNo: { startsWith: prefix } },
    select: { accessionNo: true },
  });

  let maxNum = 0;
  for (const c of copies) {
    const parts = c.accessionNo.split("-");
    const num = parseInt(parts[2], 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }

  return `${prefix}${String(maxNum + 1).padStart(4, "0")}`;
}

export async function addBookCopy(input: AddBookCopyInput, actorId: string) {
  return await prisma.$transaction(async (tx) => {
    const book = await tx.book.findUnique({
      where: { id: input.bookId },
      include: { copies: true },
    });
    if (!book) throw new Error(`Book with ID "${input.bookId}" was not found.`);

    // Determine accession number
    let accessionNo = input.accessionNo?.trim();
    if (!accessionNo) {
      const year = new Date().getFullYear();
      const prefix = `ACC-${year}-`;
      const copies = await tx.bookCopy.findMany({
        where: { accessionNo: { startsWith: prefix } },
        select: { accessionNo: true },
      });
      let maxNum = 0;
      for (const c of copies) {
        const parts = c.accessionNo.split("-");
        const num = parseInt(parts[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
      accessionNo = `${prefix}${String(maxNum + 1).padStart(4, "0")}`;
    } else {
      const existing = await tx.bookCopy.findUnique({ where: { accessionNo } });
      if (existing) {
        throw new Error(`Accession number "${accessionNo}" already exists in the accession register.`);
      }
    }

    const copyNumber = book.copies.length + 1;
    const randomHex = crypto.randomBytes(4).toString("hex").toUpperCase();
    const qrCodeToken = `QR-${accessionNo}-${randomHex}`;

    const copy = await tx.bookCopy.create({
      data: {
        bookId: book.id,
        accessionNo,
        copyNumber,
        qrCodeToken,
        shelfLocation: input.shelfLocation?.trim() || "General Stacks",
        acquisitionCost: input.acquisitionCost !== undefined ? Number(input.acquisitionCost) : 0,
        condition: input.condition || "GOOD",
        status: input.status || "AVAILABLE",
      },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "COPY_ADDED",
        entityType: "BookCopy",
        entityId: copy.id,
        metadataJson: JSON.stringify({
          bookTitle: book.title,
          accessionNo,
          copyNumber,
          shelfLocation: copy.shelfLocation,
        }),
      },
    });

    return copy;
  }, TX_OPTIONS);
}

export async function updateBookCopy(copyId: string, input: UpdateBookCopyInput, actorId: string) {
  return await prisma.$transaction(async (tx) => {
    const copy = await tx.bookCopy.findUnique({
      where: { id: copyId },
      include: {
        book: true,
        loans: { where: { status: "ACTIVE" } },
      },
    });

    if (!copy) throw new Error("Copy not found.");

    if (input.status && ["LOST", "DAMAGED", "WITHDRAWN"].includes(input.status) && copy.loans.length > 0) {
      throw new Error(`Cannot change status to "${input.status}" while copy is actively issued.`);
    }

    const updated = await tx.bookCopy.update({
      where: { id: copyId },
      data: {
        shelfLocation: input.shelfLocation !== undefined ? input.shelfLocation.trim() : copy.shelfLocation,
        acquisitionCost: input.acquisitionCost !== undefined ? Number(input.acquisitionCost) : copy.acquisitionCost,
        condition: input.condition || copy.condition,
        status: input.status || copy.status,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId,
        action: "COPY_UPDATED",
        entityType: "BookCopy",
        entityId: copy.id,
        metadataJson: JSON.stringify({
          accessionNo: copy.accessionNo,
          oldStatus: copy.status,
          newStatus: updated.status,
          condition: updated.condition,
        }),
      },
    });

    return updated;
  }, TX_OPTIONS);
}

export async function listAccessionRegister(params?: {
  search?: string;
  status?: string;
  condition?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, params?.page || 1);
  const limit = Math.max(1, Math.min(100, params?.limit || 50));
  const skip = (page - 1) * limit;

  const where: any = {};
  if (params?.status) where.status = params.status;
  if (params?.condition) where.condition = params.condition;

  if (params?.search && params.search.trim()) {
    const s = params.search.trim();
    where.OR = [
      { accessionNo: { contains: s } },
      { shelfLocation: { contains: s } },
      { book: { title: { contains: s } } },
      { book: { isbn: { contains: s } } },
      { book: { ddcCode: { contains: s } } },
      { book: { authors: { some: { author: { name: { contains: s } } } } } },
    ];
  }

  const [totalCount, copies] = await Promise.all([
    prisma.bookCopy.count({ where }),
    prisma.bookCopy.findMany({
      where,
      skip,
      take: limit,
      include: {
        book: {
          include: {
            authors: { include: { author: true } },
            category: true,
            publisher: true,
          },
        },
        loans: {
          where: { status: "ACTIVE" },
          include: {
            member: {
              select: { id: true, memberNo: true, fullName: true, phone: true },
            },
          },
        },
      },
      orderBy: { accessionNo: "asc" },
    }),
  ]);

  return {
    items: copies.map((c) => ({
      id: c.id,
      accessionNo: c.accessionNo,
      copyNumber: c.copyNumber,
      qrCodeToken: c.qrCodeToken,
      shelfLocation: c.shelfLocation,
      acquisitionCost: c.acquisitionCost,
      acquisitionDate: c.acquisitionDate,
      condition: c.condition,
      status: c.status,
      bookId: c.book.id,
      title: c.book.title,
      isbn: c.book.isbn,
      ddcCode: c.book.ddcCode,
      category: c.book.category?.name || "General",
      authors: c.book.authors.map((a) => a.author.name).join(", "),
      activeLoan: c.loans[0]
        ? {
            loanId: c.loans[0].id,
            memberNo: c.loans[0].member.memberNo,
            memberName: c.loans[0].member.fullName,
            dueDate: c.loans[0].dueDate,
          }
        : null,
    })),
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    },
  };
}
