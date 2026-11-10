import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  try {
    // 1. Ping PostgreSQL database
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - startTime;

    // 2. Fetch system core statistics
    const [booksCount, copiesCount, membersCount, activeLoansCount, pendingReservationsCount] =
      await Promise.all([
        prisma.book.count(),
        prisma.bookCopy.count(),
        prisma.member.count({ where: { status: "ACTIVE" } }),
        prisma.loan.count({ where: { status: "ACTIVE" } }),
        prisma.reservation.count({ where: { status: { in: ["PENDING", "READY_FOR_PICKUP"] } } }),
      ]);

    const memUsage = process.memoryUsage();

    return NextResponse.json(
      {
        status: "HEALTHY",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
        uptimeSeconds: Math.floor(process.uptime()),
        database: {
          status: "CONNECTED",
          provider: "PostgreSQL (Supabase)",
          latencyMs,
        },
        metrics: {
          catalogBooks: booksCount,
          physicalCopies: copiesCount,
          activeMembers: membersCount,
          activeLoans: activeLoansCount,
          pendingReservations: pendingReservationsCount,
        },
        system: {
          heapUsedMb: Math.round((memUsage.heapUsed / 1024 / 1024) * 100) / 100,
          heapTotalMb: Math.round((memUsage.heapTotal / 1024 / 1024) * 100) / 100,
          rssMb: Math.round((memUsage.rss / 1024 / 1024) * 100) / 100,
        },
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        status: "DEGRADED",
        timestamp: new Date().toISOString(),
        database: {
          status: "DISCONNECTED",
          latencyMs,
          error: err.message || "Database connection error",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
