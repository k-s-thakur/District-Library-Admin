import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN", "ACCOUNTS_OPERATOR", "APPROVING_OFFICER"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff privileges required." }, { status: 403 });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [
      catalogueTitles,
      totalCopies,
      activeMembers,
      booksOnLoan,
      overdueLoans,
      todayPayments,
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
      prisma.loan.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          bookCopy: { include: { book: { select: { title: true } } } },
          member: { select: { fullName: true, memberNo: true } },
        },
      }),
      prisma.member.findMany({
        take: 3,
        orderBy: { createdAt: "desc" },
        select: { id: true, fullName: true, memberNo: true, category: true, createdAt: true },
      }),
    ]);

    const collectionsToday = todayPayments.reduce((acc, p) => acc + p.amount, 0);

    // Recent activity timeline
    const activities = [
      ...recentLoans.map((l) => ({
        id: `loan-${l.id}`,
        type: l.status === "RETURNED" ? "return" : "issue",
        title: l.status === "RETURNED" ? "Book Returned" : "Book Issued",
        detail: `${l.bookCopy.book.title} · ${l.bookCopy.accessionNo}`,
        member: `${l.member.memberNo} (${l.member.fullName})`,
        time: new Date(l.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
        timestamp: l.createdAt,
      })),
      ...recentMembers.map((m) => ({
        id: `mbr-${m.id}`,
        type: "member",
        title: "New Member Registered",
        detail: `${m.category} Category`,
        member: `${m.memberNo} (${m.fullName})`,
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
        todayTransactionsCount: todayPayments.length,
      },
      recentActivities: activities,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
