import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { reserveBook } from "@/lib/services/circulation.service";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    let memberId = session?.memberId;

    // In open access / passwordless mode, auto-fallback to an active library member
    if (!memberId) {
      const activeMember = await prisma.member.findFirst({
        where: { status: "ACTIVE" },
      });
      if (activeMember) {
        memberId = activeMember.id;
      }
    }

    if (!memberId) {
      return NextResponse.json(
        { error: "No active library member record available to place reservation." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { bookId } = body;

    if (!bookId) {
      return NextResponse.json({ error: "bookId is required" }, { status: 400 });
    }

    const result = await reserveBook({
      memberId,
      bookId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const reservations = await prisma.reservation.findMany({
      where: {
        status: { in: ["PENDING", "READY_FOR_PICKUP"] },
      },
      include: {
        member: { select: { id: true, name: true, memberNo: true } },
        book: { select: { id: true, title: true } },
      },
      orderBy: [{ bookId: "asc" }, { queuePosition: "asc" }],
    });

    const items = reservations.map((r) => ({
      id: r.id,
      member: r.member.name,
      memberNo: r.member.memberNo,
      title: r.book.title,
      status: r.status,
      wait: `Position #${r.queuePosition}`,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({ items, total: items.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

