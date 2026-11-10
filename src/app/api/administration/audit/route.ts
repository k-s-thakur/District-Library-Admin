import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN", "APPROVING_OFFICER"].includes(session.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Audit log inspection requires Administrative or Approving Officer privileges." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action") || undefined;
    const limit = Math.min(Number(searchParams.get("limit") || 50), 100);

    const where: any = {};
    if (action && action !== "ALL") {
      where.action = action;
    }

    const auditLogs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
    });

    // Populate actor names if available
    const actorIds = [...new Set(auditLogs.map((l) => l.actorId).filter(Boolean))] as string[];
    const staffActors = await prisma.staffUser.findMany({
      where: { id: { in: actorIds } },
      select: { id: true, name: true, role: true },
    });

    const actorMap = new Map<string, { name: string; role: string }>();
    staffActors.forEach((s) => actorMap.set(s.id, { name: s.name, role: s.role }));

    const enrichedLogs = auditLogs.map((log) => ({
      ...log,
      actorName: log.actorId ? actorMap.get(log.actorId)?.name || "System / Service" : "System",
      actorRole: log.actorRole || (log.actorId ? actorMap.get(log.actorId)?.role : "SYSTEM"),
    }));

    return NextResponse.json({ auditLogs: enrichedLogs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
