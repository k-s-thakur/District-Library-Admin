import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { listMembers, registerMember } from "@/lib/services/member.service";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff privileges required to view member directory." }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;

    const members = await listMembers(search, category, status);
    return NextResponse.json({ members });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || !["SUPER_ADMIN", "LIBRARIAN"].includes(session.role)) {
      return NextResponse.json({ error: "Unauthorized. Staff privileges required to register members." }, { status: 403 });
    }

    const body = await req.json();
    const { fullName, email, phone, address, category, password, memberNo } = body;

    if (!fullName || !email) {
      return NextResponse.json({ error: "fullName and email are required" }, { status: 400 });
    }

    const member = await registerMember({
      fullName,
      email,
      phone,
      address,
      category: category || "GENERAL_CITIZEN",
      password,
      memberNo,
      actorId: session.id,
    });

    return NextResponse.json({ member }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
