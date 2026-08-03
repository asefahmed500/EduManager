"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { hashPassword } from "@/lib/password";
import type { FormState } from "@/lib/forms";

function flatten(error: { fieldErrors?: Record<string, string[]> }) {
  return error.fieldErrors ?? {};
}

const userSchema = z.object({
  name: z.string().min(2, "Name is too short"),
  email: z.email("Enter a valid email"),
  password: z.string().optional(),
  role: z.enum(["ADMIN", "TEACHER", "STUDENT"]),
  classId: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null)),
  isActive: z
    .string()
    .optional()
    .transform((v) => v === "on"),
});

export async function createUser(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()) };
  const { name, email, password, role, classId, isActive } = parsed.data;
  if (!password || password.length < 6) {
    return { errors: { password: ["Password must be at least 6 characters"] } };
  }
  if ((await prisma.user.findUnique({ where: { email } }))) {
    return { error: "That email is already in use." };
  }
  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hashPassword(password),
      role,
      classId: role === "STUDENT" ? classId : null,
      isActive: isActive ?? true,
    },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateUser(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");
  const id = Number(formData.get("id"));
  if (!id) return { error: "Missing user." };
  const parsed = userSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()) };
  const { name, email, password, role, classId, isActive } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };
  if (
    email !== target.email &&
    (await prisma.user.findUnique({ where: { email } }))
  ) {
    return { error: "That email is already in use." };
  }

  await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      role,
      classId: role === "STUDENT" ? classId : null,
      isActive: isActive ?? false,
      ...(password && password.length >= 6
        ? { passwordHash: await hashPassword(password) }
        : {}),
    },
  });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserActive(
  id: number,
  active: boolean,
): Promise<FormState> {
  await requireRole("ADMIN");
  await prisma.user.update({ where: { id }, data: { isActive: active } });
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function deleteUser(id: number): Promise<FormState> {
  await requireRole("ADMIN");
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: "User not found." };
  await prisma.user.delete({ where: { id } });
  revalidatePath("/admin/users");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

const nameSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional().transform((v) => v || null),
});

export async function createClass(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");
  const parsed = nameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()) };
  const { name, description } = parsed.data;
  if ((await prisma.class.findUnique({ where: { name } }))) {
    return { error: "A class with this name already exists." };
  }
  await prisma.class.create({ data: { name, description } });
  revalidatePath("/admin/classes");
  return { ok: true };
}

export async function deleteClass(id: number): Promise<FormState> {
  await requireRole("ADMIN");
  await prisma.class.delete({ where: { id } });
  revalidatePath("/admin/classes");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

const subjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  code: z.string().max(20).optional().transform((v) => v || null),
});

export async function createSubject(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole("ADMIN");
  const parsed = subjectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: flatten(parsed.error.flatten()) };
  const { name, code } = parsed.data;
  await prisma.subject.create({ data: { name, code } });
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/classes");
  return { ok: true };
}

export async function deleteSubject(id: number): Promise<FormState> {
  await requireRole("ADMIN");
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/admin/subjects");
  revalidatePath("/admin/classes");
  return { ok: true };
}

export async function addSubjectToClass(
  classId: number,
  subjectId: number,
): Promise<FormState> {
  await requireRole("ADMIN");
  const existing = await prisma.classSubject.findUnique({
    where: { classId_subjectId: { classId, subjectId } },
  });
  if (existing) return { error: "Already mapped." };
  await prisma.classSubject.create({ data: { classId, subjectId } });
  revalidatePath("/admin/classes");
  return { ok: true };
}

export async function removeSubjectFromClass(
  classSubjectId: number,
): Promise<FormState> {
  await requireRole("ADMIN");
  await prisma.classSubject.delete({ where: { id: classSubjectId } });
  revalidatePath("/admin/classes");
  return { ok: true };
}

export async function assignTeacher(
  teacherId: number,
  classSubjectId: number,
): Promise<FormState> {
  await requireRole("ADMIN");
  const existing = await prisma.teacherSubjectClass.findUnique({
    where: { teacherId_classSubjectId: { teacherId, classSubjectId } },
  });
  if (existing) return { error: "Teacher already assigned." };
  await prisma.teacherSubjectClass.create({
    data: { teacherId, classSubjectId },
  });
  revalidatePath("/admin/classes");
  return { ok: true };
}

export async function unassignTeacher(id: number): Promise<FormState> {
  await requireRole("ADMIN");
  await prisma.teacherSubjectClass.delete({ where: { id } });
  revalidatePath("/admin/classes");
  return { ok: true };
}

export async function updateSetting(
  key: string,
  value: string,
): Promise<FormState> {
  await requireRole("ADMIN");
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  revalidatePath("/admin/settings");
  return { ok: true };
}
