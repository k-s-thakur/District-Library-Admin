import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const policies = await prisma.policy.findMany({
      orderBy: { category: "asc" },
    });
    return NextResponse.json({ policies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN"].includes(session.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Super Admin or Library Admin privileges required to update policies." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { policies } = body;

    if (!Array.isArray(policies)) {
      return NextResponse.json({ error: "policies array is required" }, { status: 400 });
    }

    const updatedPolicies = await prisma.$transaction(
      policies.map((p: any) =>
        prisma.policy.upsert({
          where: { category: p.category },
          update: {
            loanPeriodDays: p.loanPeriodDays !== undefined ? Number(p.loanPeriodDays) : undefined,
            maxRenewals: p.maxRenewals !== undefined ? Number(p.maxRenewals) : undefined,
            finePerDay: p.finePerDay !== undefined ? Number(p.finePerDay) : undefined,
            gracePeriodDays: p.gracePeriodDays !== undefined ? Number(p.gracePeriodDays) : undefined,
            maxBooksAllowed: p.maxBooksAllowed !== undefined ? Number(p.maxBooksAllowed) : undefined,
          },
          create: {
            category: p.category,
            loanPeriodDays: Number(p.loanPeriodDays || 14),
            maxRenewals: Number(p.maxRenewals || 2),
            finePerDay: Number(p.finePerDay || 2.0),
            gracePeriodDays: Number(p.gracePeriodDays || 2),
            maxBooksAllowed: Number(p.maxBooksAllowed || 3),
          },
        })
      ),
      { maxWait: 15000, timeout: 30000 }
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: "POLICIES_UPDATED",
        entityType: "Policy",
        metadataJson: JSON.stringify(policies),
      },
    });

    return NextResponse.json({ success: true, policies: updatedPolicies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
