import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Super Admin or Library Admin role required to export database backup." },
        { status: 403 }
      );
    }

    const exportTimestamp = new Date().toISOString();

    // Query tables sequentially rather than Promise.all to avoid exhausting
    // the Supabase connection pooler (PgBouncer) connection slots.
    const staff = await prisma.staffUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
      },
    });

    const members = await prisma.member.findMany({
      orderBy: { createdAt: "desc" },
    });

    const policies = await prisma.libraryPolicy.findMany();

    const books = await prisma.book.findMany({
      include: {
        copies: true,
        authors: { include: { author: true } },
        category: true,
        publisher: true,
      },
    });

    const loans = await prisma.loan.findMany({
      orderBy: { issuedAt: "desc" },
    });

    const feeCharges = await prisma.feeCharge.findMany({
      orderBy: { createdAt: "desc" },
    });

    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
    });

    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 200,
      orderBy: { timestamp: "desc" },
    });

    // Record audit event
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: "SYSTEM_BACKUP_EXPORTED",
        entityType: "SystemBackup",
        entityId: `BACKUP-${Date.now()}`,
        metadataJson: JSON.stringify({
          exportedBy: session.email,
          role: session.role,
          recordCounts: {
            staff: staff.length,
            members: members.length,
            books: books.length,
            loans: loans.length,
            feeCharges: feeCharges.length,
            payments: payments.length,
            auditLogs: recentAuditLogs.length,
          },
        }),
      },
    });

    const backupPayload = {
      system: "District Public Library Management System (GPLMS)",
      schemaVersion: "1.0.0",
      exportTimestamp,
      exportedBy: {
        id: session.id,
        email: session.email,
        role: session.role,
      },
      counts: {
        staffCount: staff.length,
        membersCount: members.length,
        catalogBooksCount: books.length,
        activeLoansCount: loans.filter((l) => l.status === "ACTIVE").length,
        totalLoansCount: loans.length,
        feeChargesCount: feeCharges.length,
        paymentsCount: payments.length,
        auditLogsCount: recentAuditLogs.length,
      },
      data: {
        policies,
        staff,
        members,
        books,
        loans,
        feeCharges,
        payments,
        auditLogs: recentAuditLogs,
      },
    };

    const filename = `GPLMS_Database_Backup_${exportTimestamp.split("T")[0]}_${Date.now()}.json`;

    return new NextResponse(JSON.stringify(backupPayload, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to create database backup" }, { status: 500 });
  }
}
