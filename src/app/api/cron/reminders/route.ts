import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dispatchBulkReminders } from "@/lib/services/circulation.service";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET || "gplms-cron-secret-2026";
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.replace(/^Bearer\s+/i, "").trim() === cronSecret) {
    return true;
  }
  const { searchParams } = new URL(req.url);
  if (searchParams.get("key") === cronSecret) {
    return true;
  }
  return false;
}

async function handleRemindersCron(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "Unauthorized. Valid CRON_SECRET bearer token or query key required." },
      { status: 401 }
    );
  }

  try {
    // Locate system super admin or default staff user for audit association
    const systemUser = await prisma.staffUser.findFirst({
      where: { role: { in: ["SUPER_ADMIN", "LIBRARY_ADMIN"] } },
      select: { id: true, email: true, name: true },
    });

    const actorId = systemUser?.id || "SYSTEM_CRON_WORKER";

    // Dispatch bulk reminders to all due or overdue borrowers
    const result = await dispatchBulkReminders(actorId);

    // Record high-level cron execution audit log
    await prisma.auditLog.create({
      data: {
        actorId,
        action: "CIRCULATION_DAILY_CRON_EXECUTED",
        entityType: "SystemSchedule",
        entityId: "DAILY_REMINDERS_CRON",
        metadataJson: JSON.stringify({
          executedAt: new Date().toISOString(),
          totalDispatched: result.totalDispatched,
          triggeredBy: "Automated Cron / Scheduler",
        }),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Daily circulation reminder cron executed successfully. Dispatched ${result.totalDispatched} notice(s).`,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to execute circulation reminders cron" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return handleRemindersCron(req);
}

export async function POST(req: NextRequest) {
  return handleRemindersCron(req);
}
