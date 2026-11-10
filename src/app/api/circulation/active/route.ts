import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const search = searchParams.get("search");

    // Privacy protection: Regular member can only see their own active loans
    const isStaff = ["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN", "ACCOUNTS_OPERATOR"].includes(session.role);
    if (!isStaff) {
      if (session.role !== "MEMBER" || !session.memberId) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }

    const where: any = { status: "ACTIVE" };
    if (!isStaff) {
      where.memberId = session.memberId;
    } else if (memberId) {
      where.memberId = memberId;
    }

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { member: { fullName: { contains: s } } },
        { member: { memberNo: { contains: s } } },
        { copy: { accessionNo: { contains: s } } },
        { copy: { book: { title: { contains: s } } } },
      ];
    }

    const loans = await prisma.loan.findMany({
      where,
      include: {
        member: {
          select: { id: true, memberNo: true, fullName: true, phone: true, category: true },
        },
        copy: {
          include: {
            book: {
              select: { id: true, title: true, isbn: true, ddcCode: true, coverImageUrl: true },
            },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json({ loans });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
