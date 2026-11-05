import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, SessionUser, UserRole } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Empty body is acceptable in passwordless mode
    }

    const { identifier, role } = body || {};
    let user: SessionUser | null = null;

    // 1. Quick demo / passwordless role selection
    if (role && !identifier) {
      if (role === "MEMBER") {
        const member = await prisma.member.findFirst({ where: { status: "ACTIVE" } });
        if (member) {
          user = {
            id: member.id,
            email: member.email,
            name: member.fullName,
            role: "MEMBER",
            memberId: member.id,
            memberNo: member.memberNo,
            category: member.category,
          };
        }
      } else {
        const staff = await prisma.staffUser.findFirst({ where: { role } });
        if (staff) {
          user = {
            id: staff.id,
            email: staff.email,
            name: staff.name,
            role: staff.role as UserRole,
          };
        }
      }
    }

    // 2. Direct identifier lookup without password check
    if (!user && identifier) {
      const cleanId = String(identifier).trim().toLowerCase();

      // Check staff by email
      const staff = await prisma.staffUser.findFirst({
        where: { email: cleanId },
      });

      if (staff) {
        user = {
          id: staff.id,
          email: staff.email,
          name: staff.name,
          role: staff.role as UserRole,
        };
      } else {
        // Check member by email or memberNo
        const member = await prisma.member.findFirst({
          where: {
            OR: [
              { email: cleanId },
              { memberNo: cleanId.toUpperCase() },
            ],
          },
        });

        if (member) {
          user = {
            id: member.id,
            email: member.email,
            name: member.fullName,
            role: "MEMBER",
            memberId: member.id,
            memberNo: member.memberNo,
            category: member.category,
          };
        }
      }
    }

    // 3. Fallback: Default to Super Admin / Chief Librarian if no specific match
    if (!user) {
      const defaultStaff = await prisma.staffUser.findFirst({
        where: { role: "SUPER_ADMIN" },
      }) || await prisma.staffUser.findFirst();

      if (defaultStaff) {
        user = {
          id: defaultStaff.id,
          email: defaultStaff.email,
          name: defaultStaff.name,
          role: defaultStaff.role as UserRole,
        };
      } else {
        // Fallback dummy user if DB is totally empty
        user = {
          id: "admin-default",
          email: "admin@library.gov.in",
          name: "Chief Librarian (Admin)",
          role: "SUPER_ADMIN",
        };
      }
    }

    const token = await createSessionToken(user);
    const response = NextResponse.json({ success: true, user });

    response.cookies.set("library_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
