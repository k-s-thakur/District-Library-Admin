import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getMemberDetails, updateMember, renewMembership } from "@/lib/services/member.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { id } = await params;
    const isStaff = ["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN", "ACCOUNTS_OPERATOR"].includes(session.role);

    // If citizen/member, can ONLY query their own account
    if (!isStaff && session.memberId !== id) {
      return NextResponse.json({ error: "Access denied. You can only view your own library account." }, { status: 403 });
    }

    const member = await getMemberDetails(id);
    return NextResponse.json({ member });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff privileges required to update members." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = await updateMember(
      id,
      {
        fullName: body.fullName,
        phone: body.phone,
        address: body.address,
        category: body.category,
        status: body.status,
      },
      session.id
    );

    return NextResponse.json({ success: true, member: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARY_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff privileges required." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    if (body.action === "renew") {
      const renewed = await renewMembership(id, session.id);
      return NextResponse.json({ success: true, member: renewed, message: "Membership renewed for 1 academic year" });
    }

    const updated = await updateMember(id, body, session.id);
    return NextResponse.json({ success: true, member: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
