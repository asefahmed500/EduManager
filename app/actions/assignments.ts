"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { assignmentSchema } from "@/lib/validations/assignment";
import { createNotifications } from "@/lib/notify";
import type { FormState } from "@/lib/forms";

function fieldErrors(
  error: { fieldErrors?: Record<string, string[]> },
): Record<string, string[]> {
  return error.fieldErrors ?? {};
}

export async function createAssignment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("TEACHER");
  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error.flatten()) };
  }

  const { title, description, classSubjectId, deadline, maxMarks, allowLate } =
    parsed.data;
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return { errors: { deadline: ["Invalid deadline."] } };
  }
  if (deadlineDate.getTime() <= Date.now()) {
    return { errors: { deadline: ["Deadline must be in the future."] } };
  }

  const owns = await prisma.teacherSubjectClass.findFirst({
    where: { teacherId: user.id, classSubjectId },
  });
  if (!owns) {
    return { error: "You are not assigned to this class and subject." };
  }
  const cs = await prisma.classSubject.findUnique({
    where: { id: classSubjectId },
  });
  if (!cs) return { error: "Invalid class or subject." };

  const intent = formData.get("intent") === "publish" ? "PUBLISHED" : "DRAFT";
  const created = await prisma.assignment.create({
    data: {
      title,
      description,
      classId: cs.classId,
      subjectId: cs.subjectId,
      teacherId: user.id,
      deadline: deadlineDate,
      maxMarks,
      allowLate,
      status: intent,
    },
  });

  if (created.status === "PUBLISHED") {
    const students = await prisma.user.findMany({
      where: { classId: created.classId, role: "STUDENT" },
      select: { id: true },
    });
    await createNotifications({
      userIds: students.map((s) => s.id),
      title: "New assignment published",
      message: `"${created.title}" is now available. Submit before the deadline.`,
      type: "ASSIGNMENT",
      link: `/student/assignments/${created.id}`,
    });
  }

  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/assignments/${created.id}`);
  revalidatePath("/teacher/dashboard");
  return { ok: true, id: created.id };
}

export async function updateAssignment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("TEACHER");
  const id = Number(formData.get("id"));
  if (!id) return { error: "Missing assignment id." };

  const existing = await prisma.assignment.findUnique({ where: { id } });
  if (!existing || existing.teacherId !== user.id) {
    return { error: "Assignment not found." };
  }

  const parsed = assignmentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error.flatten()) };
  }
  const { title, description, classSubjectId, deadline, maxMarks, allowLate } =
    parsed.data;
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return { errors: { deadline: ["Invalid deadline."] } };
  }

  const owns = await prisma.teacherSubjectClass.findFirst({
    where: { teacherId: user.id, classSubjectId },
  });
  if (!owns) return { error: "You are not assigned to this class and subject." };
  const cs = await prisma.classSubject.findUnique({
    where: { id: classSubjectId },
  });
  if (!cs) return { error: "Invalid class or subject." };

  const intent = formData.get("intent") === "publish" ? "PUBLISHED" : "DRAFT";
  const updated = await prisma.assignment.update({
    where: { id },
    data: {
      title,
      description,
      classId: cs.classId,
      subjectId: cs.subjectId,
      deadline: deadlineDate,
      maxMarks,
      allowLate,
      status: intent,
    },
  });

  if (updated.status === "PUBLISHED") {
    const students = await prisma.user.findMany({
      where: { classId: updated.classId, role: "STUDENT" },
      select: { id: true },
    });
    await createNotifications({
      userIds: students.map((s) => s.id),
      title: "Assignment published",
      message: `"${updated.title}" has been published.`,
      type: "ASSIGNMENT",
      link: `/student/assignments/${updated.id}`,
    });
  }

  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/assignments/${id}`);
  revalidatePath(`/teacher/assignments/${id}/submissions`);
  return { ok: true, id };
}

export async function deleteAssignment(id: number): Promise<FormState> {
  const user = await requireRole("TEACHER");
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment || assignment.teacherId !== user.id) {
    return { error: "Assignment not found." };
  }
  await prisma.assignment.delete({ where: { id } });
  revalidatePath("/teacher/assignments");
  revalidatePath("/teacher/dashboard");
  return { ok: true };
}

export async function togglePublish(id: number): Promise<FormState> {
  const user = await requireRole("TEACHER");
  const assignment = await prisma.assignment.findUnique({ where: { id } });
  if (!assignment || assignment.teacherId !== user.id) {
    return { error: "Assignment not found." };
  }
  const next = assignment.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
  await prisma.assignment.update({ where: { id }, data: { status: next } });
  revalidatePath("/teacher/assignments");
  revalidatePath(`/teacher/assignments/${id}`);
  return { ok: true };
}
