import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role === "MEMBER") {
      return NextResponse.json(
        { error: "Unauthorized. Staff directory requires staff access." },
        { status: 403 }
      );
    }

    const staffMembers = await prisma.staffUser.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        createdAt: true,
      },
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ staffMembers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Admin role required to onboard staff." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, phone, role, password } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: "Name, email, and role are required." }, { status: 400 });
    }

    const existing = await prisma.staffUser.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: `Staff user with email "${email}" already exists.` }, { status: 400 });
    }

    const defaultPassword = password || "Admin@123";
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    const newStaff = await prisma.staffUser.create({
      data: {
        name,
        email,
        phone: phone || null,
        role,
        passwordHash,
        status: "ACTIVE",
      },
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: "STAFF_ONBOARDED",
        entityType: "StaffUser",
        entityId: newStaff.id,
        metadataJson: JSON.stringify({ name, email, role }),
      },
    });

    return NextResponse.json({ success: true, staff: newStaff }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Super Admin role required to update staff." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, name, phone, role, status, password } = body;

    if (!id) {
      return NextResponse.json({ error: "Staff ID is required." }, { status: 400 });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.staffUser.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: "STAFF_UPDATED",
        entityType: "StaffUser",
        entityId: id,
        metadataJson: JSON.stringify(updateData),
      },
    });

    return NextResponse.json({ success: true, staff: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only Super Admin can delete staff accounts." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Staff ID is required." }, { status: 400 });
    }

    if (id === session.id) {
      return NextResponse.json({ error: "Cannot delete your own active session account." }, { status: 400 });
    }

    await prisma.staffUser.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actorId: session.id,
        action: "STAFF_DELETED",
        entityType: "StaffUser",
        entityId: id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
