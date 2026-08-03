import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { createAssignment } from "@/app/actions/assignments";
import { createUser } from "@/app/actions/admin";
import { gradeSubmission } from "@/app/actions/submissions";
import {
  assignmentFormData,
  clearSession,
  createFixtures,
  resetDatabase,
  setSession,
} from "./fixtures";

describe("authorization guards", () => {
  let fx: Awaited<ReturnType<typeof createFixtures>>;

  beforeEach(async () => {
    await resetDatabase();
    fx = await createFixtures();
    clearSession();
  });

  it("rejects unauthenticated assignment creation", async () => {
    await expect(createAssignment({}, assignmentFormData())).rejects.toThrow(
      /NEXT_REDIRECT/,
    );
  });

  it("rejects students from teacher-only actions", async () => {
    await setSession(fx.student.id, "STUDENT");
    await expect(createAssignment({}, assignmentFormData())).rejects.toThrow(
      /NEXT_REDIRECT/,
    );
  });

  it("rejects teachers from admin-only actions", async () => {
    await setSession(fx.teacher.id, "TEACHER");
    const fd = new FormData();
    fd.set("name", "X");
    fd.set("email", "x@test.dev");
    fd.set("password", "123456");
    fd.set("role", "STUDENT");
    await expect(createUser({}, fd)).rejects.toThrow(/NEXT_REDIRECT/);
  });

  it("prevents a teacher from grading another teacher's assignment", async () => {
    await setSession(fx.teacher2.id, "TEACHER");
    const submission = await prisma.submission.create({
      data: {
        assignmentId: fx.published.id,
        studentId: fx.student.id,
        answer: "my answer",
        status: "SUBMITTED",
        submittedAt: new Date(),
      },
    });
    const fd = new FormData();
    fd.set("submissionId", String(submission.id));
    fd.set("marks", "10");
    fd.set("feedback", "ok");
    fd.set("status", "GRADED");

    const result = await gradeSubmission({}, fd);
    expect(result.error).toMatch(/only grade your own/);
    expect(result.ok).not.toBe(true);
  });

  it("prevents a student from seeing another class's assignment via submission", async () => {
    await setSession(fx.student.id, "STUDENT");
    // An assignment for a different class (student is enrolled in fx.cls, not fx.clsB).
    const other = await prisma.assignment.create({
      data: {
        title: "Other Class",
        description: "d",
        classId: fx.clsB.id,
        subjectId: fx.subj.id,
        teacherId: fx.teacher.id,
        deadline: new Date(Date.now() + 86_400_000),
        maxMarks: 10,
        status: "PUBLISHED",
        allowLate: false,
      },
    });
    const fd = new FormData();
    fd.set("assignmentId", String(other.id));
    fd.set("answer", "nope");
    const result = await (
      await import("@/app/actions/submissions")
    ).submitAssignment({}, fd);
    expect(result.error).toMatch(/does not belong to your class/);
  });
});
