import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const JWT_SECRET_STRING = process.env.JWT_SECRET || "smart-library-default-secure-key-2026";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export type UserRole =
  | "SUPER_ADMIN"
  | "LIBRARY_ADMIN"
  | "LIBRARIAN"
  | "ACCOUNTS_OPERATOR"
  | "APPROVING_OFFICER"
  | "MEMBER"
  | "PUBLIC_VISITOR";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  memberId?: string | null;
  memberNo?: string | null;
  category?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    memberId: user.memberId,
    memberNo: user.memberNo,
    category: user.category,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole,
      memberId: (payload.memberId as string) || null,
      memberNo: (payload.memberNo as string) || null,
      category: (payload.category as string) || null,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("library_session")?.value;
    if (token) {
      const user = await verifySessionToken(token);
      if (user) return user;
    }

    // Default to Super Admin so login is not required
    const defaultStaff =
      (await prisma.staffUser.findFirst({
        where: { role: "SUPER_ADMIN" },
      })) || (await prisma.staffUser.findFirst());

    if (defaultStaff) {
      return {
        id: defaultStaff.id,
        email: defaultStaff.email,
        name: defaultStaff.name,
        role: defaultStaff.role as UserRole,
      };
    }

    return {
      id: "super-admin-default",
      email: "superadmin@library.gov.in",
      name: "Dr. K. S. Thakur",
      role: "SUPER_ADMIN",
    };
  } catch {
    return {
      id: "super-admin-default",
      email: "superadmin@library.gov.in",
      name: "Dr. K. S. Thakur",
      role: "SUPER_ADMIN",
    };
  }
}
