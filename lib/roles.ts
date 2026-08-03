import type { Role } from "@/lib/generated/prisma/client";

export const ROLE_DASHBOARD: Record<Role, string> = {
  ADMIN: "/admin/dashboard",
  TEACHER: "/teacher/dashboard",
  STUDENT: "/student/dashboard",
};

export const ROLE_LABEL: Record<Role, string> = {
  ADMIN: "Administrator",
  TEACHER: "Teacher",
  STUDENT: "Student",
};

export function dashboardForRole(role: Role): string {
  return ROLE_DASHBOARD[role];
}
