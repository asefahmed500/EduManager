"use server";

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { submissionSchema, gradeSchema } from "@/lib/validations/submission";
import type { FormState } from "@/lib/forms";
import type { SubmissionStatus } from "@/lib/generated/prisma/client";
import { canStudentEditSubmission, isMarksValid } from "@/lib/rules";
import { createNotifications } from "@/lib/notify";

const MAX_BYTES = (Number(process.env.MAX_UPLOAD_MB) || 10) * 1024 * 1024;
const UPLOAD_DIR = process.env.UPLOAD_DIR || "public/uploads";
const ALLOWED_EXT = [
  ".pdf",
  ".doc",
  ".docx",
  ".txt",
  ".md",
  ".png",
  ".jpg",
  ".jpeg",
  ".zip",
];

export async function submitAssignment(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("STUDENT");
  const assignmentId = Number(formData.get("assignmentId"));
  if (!assignmentId) return { error: "Missing assignment." };

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
  });
  if (!assignment || assignment.status !== "PUBLISHED") {
    return { error: "This assignment is no longer available." };
  }
  if (user.classId !== assignment.classId) {
    return { error: "This assignment does not belong to your class." };
  }

  const raw = Object.fromEntries(
    [...formData.entries()].filter(([k]) => k !== "file"),
  );
  const parsed = submissionSchema.safeParse(raw);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const answer = parsed.data.answer.trim();

  const file = formData.get("file");
  const hasFile = file instanceof File && file.size > 0;
  if (!answer && !hasFile) {
    return { error: "Please provide an answer or attach a file." };
  }

  let fileUrl: string | undefined;
  if (hasFile) {
    const f = file as File;
    if (f.size > MAX_BYTES) {
      return {
        error: `File exceeds the ${process.env.MAX_UPLOAD_MB || 10}MB limit.`,
      };
    }
    const ext = path.extname(f.name).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return { error: "This file type is not allowed." };
    }
    const buffer = Buffer.from(await f.arrayBuffer());
    const dir = path.join(process.cwd(), UPLOAD_DIR);
    await mkdir(dir, { recursive: true });
    const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    await writeFile(path.join(dir, safeName), buffer);
    fileUrl = `/uploads/${safeName}`;
  }

  const now = new Date();
  const late = now.getTime() > assignment.deadline.getTime();

  const existing = await prisma.submission.findUnique({
    where: { assignmentId_studentId: { assignmentId, studentId: user.id } },
  });

  if (existing && existing.status === "GRADED") {
    return { error: "This submission has been graded and can no longer be edited." };
  }
  const editable = canStudentEditSubmission({
    status: existing?.status ?? "NOT_SUBMITTED",
    deadline: assignment.deadline.getTime(),
    allowLate: assignment.allowLate,
    now: now.getTime(),
  });
  if (!editable) {
    return {
      error:
        "The deadline has passed and this assignment does not allow late submissions.",
    };
  }

  const status: SubmissionStatus = late ? "LATE" : "SUBMITTED";
  const data = {
    answer,
    ...(fileUrl ? { fileUrl } : {}),
    status,
    submittedAt: now,
  };

  if (existing) {
    await prisma.submission.update({ where: { id: existing.id }, data });
  } else {
    await prisma.submission.create({
      data: { ...data, assignmentId, studentId: user.id, status: "SUBMITTED" },
    });
  }

  await createNotifications({
    userIds: [assignment.teacherId],
    title: "New submission",
    message: `${user.name} submitted "${assignment.title}".`,
    type: "SUBMISSION",
    link: `/teacher/assignments/${assignmentId}/submissions`,
  });

  revalidatePath(`/student/assignments/${assignmentId}`);
  revalidatePath("/student/submissions");
  revalidatePath("/student/dashboard");
  return { ok: true };
}

export async function gradeSubmission(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireRole("TEACHER");
  const submissionId = Number(formData.get("submissionId"));
  if (!submissionId) return { error: "Missing submission." };

  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { assignment: true },
  });
  if (!submission) return { error: "Submission not found." };
  if (submission.assignment.teacherId !== user.id) {
    return { error: "You can only grade your own assignments." };
  }

  const parsed = gradeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const { marks, feedback, status } = parsed.data;
  if (!isMarksValid(marks, submission.assignment.maxMarks)) {
    return {
      error: `Marks cannot exceed ${submission.assignment.maxMarks}.`,
      errors: {
        marks: [`Must be a whole number between 0 and ${submission.assignment.maxMarks}`],
      },
    };
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      marks,
      feedback,
      status,
      gradedAt: new Date(),
      gradedById: user.id,
    },
  });

  await createNotifications({
    userIds: [submission.studentId],
    title: "Submission graded",
    message: `Your submission for "${submission.assignment.title}" was graded: ${marks}/${submission.assignment.maxMarks}.`,
    type: "GRADE",
    link: `/student/assignments/${submission.assignmentId}`,
  });

  revalidatePath(
    `/teacher/assignments/${submission.assignmentId}/submissions`,
  );
  revalidatePath(
    `/teacher/assignments/${submission.assignmentId}/submissions/${submissionId}`,
  );
  revalidatePath("/student/dashboard");
  return { ok: true };
}
