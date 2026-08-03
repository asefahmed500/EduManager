import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { SESSION_COOKIE, decrypt } from "@/lib/jwt";
import { ROLE_DASHBOARD, dashboardForRole } from "@/lib/roles";
export { ROLE_DASHBOARD, dashboardForRole };
import type { Role } from "@/lib/generated/prisma/client";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  classId: number | null;
};

export const verifySession = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return decrypt(token);
});

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const payload = await verifySession();
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId, isDeleted: false },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      classId: true,
    },
  });
  if (!user || !user.isActive) return null;
  return user;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireRole(
  ...roles: Role[]
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    redirect(dashboardForRole(user.role));
  }
  return user;
}
