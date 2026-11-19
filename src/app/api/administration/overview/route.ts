import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    const isStaff = session && ["SUPER_ADMIN", "LIBRARIAN"].includes(session.role);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      catalogueTitles,
      totalCopies,
      activeMembers,
      booksOnLoan,
      overdueLoans,
      todayPayments,
      todayLoansCount,
      todayReturnsCount,
      recentLoans,
      recentMembers,
    ] = await Promise.all([
      prisma.book.count(),
      prisma.bookCopy.count(),
      prisma.member.count({ where: { status: "ACTIVE" } }),
      prisma.loan.count({ where: { status: "ACTIVE" } }),
      prisma.loan.count({ where: { status: "ACTIVE", dueDate: { lt: new Date() } } }),
      prisma.payment.findMany({
        where: { createdAt: { gte: startOfDay }, status: "POSTED" },
        select: { amount: true },
      }),
      prisma.loan.count({
        where: { issuedAt: { gte: startOfDay } },
      }),
      prisma.loan.count({
        where: { returnedAt: { gte: startOfDay } },
      }),
      prisma.loan.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        include: {
          copy: { include: { book: { select: { title: true } } } },
          member: { select: { fullName: true, memberNo: true } },
        },
      }),
      prisma.member.findMany({
        take: 4,
        orderBy: { createdAt: "desc" },
        select: { id: true, fullName: true, memberNo: true, category: true, createdAt: true },
      }),
    ]);

    const collectionsToday = todayPayments.reduce((acc, p) => acc + p.amount, 0);
    const todayTransactionsCount = todayPayments.length + todayLoansCount + todayReturnsCount;

    // Recent activity timeline
    const activities = [
      ...recentLoans.map((l) => ({
        id: `loan-${l.id}`,
        type: l.status === "RETURNED" ? "return" : "issue",
        title: l.status === "RETURNED" ? "Book Returned" : "Book Issued",
        detail: `${l.copy?.book?.title || "Book"} · ${l.copy?.accessionNo || ""}`,
        member: isStaff
          ? `${l.member?.memberNo || ""} (${l.member?.fullName || ""})`
          : `${l.member?.memberNo || "Member"}`,
        time: new Date(l.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        timestamp: l.createdAt,
      })),
      ...recentMembers.map((m) => ({
        id: `mbr-${m.id}`,
        type: "member",
        title: "New Member Registered",
        detail: `${m.category} Category`,
        member: isStaff
          ? `${m.memberNo} (${m.fullName})`
          : `${m.memberNo}`,
        time: new Date(m.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        timestamp: m.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 6);

    return NextResponse.json({
      metrics: {
        catalogueTitles,
        totalCopies,
        activeMembers,
        booksOnLoan,
        overdueLoans,
        collectionsToday: Number(collectionsToday.toFixed(2)),
        todayTransactionsCount,
      },
      recentActivities: activities,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
