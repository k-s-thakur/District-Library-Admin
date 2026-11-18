import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { updatePayment } from "@/lib/services/finance.service";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        receipt: true,
        reversal: true,
        member: {
          select: { id: true, fullName: true, memberNo: true },
        },
        allocations: {
          include: { charge: true },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json(
        { error: "Unauthorized. Staff privileges required to edit payments." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { amount, paymentMethod, description, referenceNumber } = body;

    const updated = await updatePayment({
      paymentId: id,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      paymentMethod,
      description,
      referenceNumber,
      actorId: session.id,
    });

    return NextResponse.json({ payment: updated, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
