import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const rawPolicies = await prisma.libraryPolicy.findMany({
      orderBy: { category: "asc" },
    });
    // Map to normalized shape for UI
    const policies = rawPolicies.map((p) => ({
      id: p.id,
      category: p.category,
      loanPeriodDays: p.loanDurationDays,
      loanDurationDays: p.loanDurationDays,
      finePerDay: p.fineRatePerDay,
      fineRatePerDay: p.fineRatePerDay,
      gracePeriodDays: p.gracePeriodDays,
      maxRenewals: p.renewalLimit,
      renewalLimit: p.renewalLimit,
      maxBooksAllowed: p.maxBooks,
      maxBooks: p.maxBooks,
      maxFine: p.maxFine,
    }));
    return NextResponse.json({ policies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Admin privileges required to update policies." },
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
        prisma.libraryPolicy.upsert({
          where: { category: p.category },
          update: {
            loanDurationDays: p.loanPeriodDays !== undefined ? Number(p.loanPeriodDays) : (p.loanDurationDays !== undefined ? Number(p.loanDurationDays) : undefined),
            renewalLimit: p.maxRenewals !== undefined ? Number(p.maxRenewals) : (p.renewalLimit !== undefined ? Number(p.renewalLimit) : undefined),
            fineRatePerDay: p.finePerDay !== undefined ? Number(p.finePerDay) : (p.fineRatePerDay !== undefined ? Number(p.fineRatePerDay) : undefined),
            gracePeriodDays: p.gracePeriodDays !== undefined ? Number(p.gracePeriodDays) : undefined,
            maxBooks: p.maxBooksAllowed !== undefined ? Number(p.maxBooksAllowed) : (p.maxBooks !== undefined ? Number(p.maxBooks) : undefined),
          },
          create: {
            category: p.category,
            loanDurationDays: Number(p.loanPeriodDays || p.loanDurationDays || 14),
            renewalLimit: Number(p.maxRenewals || p.renewalLimit || 2),
            fineRatePerDay: Number(p.finePerDay || p.fineRatePerDay || 2.0),
            gracePeriodDays: Number(p.gracePeriodDays || 2),
            maxBooks: Number(p.maxBooksAllowed || p.maxBooks || 3),
            maxFine: 150.0,
          },
        })
      )
    );

    // Audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        actorRole: session.role,
        action: "POLICIES_UPDATED",
        entityType: "LibraryPolicy",
        metadataJson: JSON.stringify({ count: updatedPolicies.length, categories: policies.map((p: any) => p.category) }),
      },
    });

    return NextResponse.json({ policies: updatedPolicies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
