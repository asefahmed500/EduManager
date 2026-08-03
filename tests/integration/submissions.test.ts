import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { gradeSubmission, submitAssignment } from "@/app/actions/submissions";
import { createFixtures, resetDatabase, setSession } from "./fixtures";

function subFd(assignmentId: number, answer: string, file?: File): FormData {
  const f = new FormData();
  f.set("assignmentId", String(assignmentId));
  f.set("answer", answer);
  if (file) f.append("file", file, file.name);
  return f;
}

function gradeFd(submissionId: number, marks: string, status = "GRADED", feedback = ""): FormData {
  const f = new FormData();
  f.set("submissionId", String(submissionId));
  f.set("marks", marks);
  f.set("status", status);
  f.set("feedback", feedback);
  return f;
}

describe("submissions module", () => {
  let fx: Awaited<ReturnType<typeof createFixtures>>;

  beforeEach(async () => {
    await resetDatabase();
    fx = await createFixtures();
  });

  it("student submits and the teacher receives a notification", async () => {
    await setSession(fx.student.id, "STUDENT");
    const res = await submitAssignment({}, subFd(fx.published.id, "My answer"));
    expect(res.ok).toBe(true);

    const sub = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: fx.published.id, studentId: fx.student.id } },
    });
    expect(sub?.status).toBe("SUBMITTED");
    expect(sub?.answer).toBe("My answer");

    const notif = await prisma.notification.findFirst({
      where: { userId: fx.teacher.id, type: "SUBMISSION" },
    });
    expect(notif).not.toBeNull();
  });

  it("blocks submission after the deadline unless late is allowed", async () => {
    const past = await prisma.assignment.create({
      data: {
        title: "Past Assignment",
        description: "d",
        classId: fx.cls.id,
        subjectId: fx.subj.id,
        teacherId: fx.teacher.id,
        deadline: new Date(Date.now() - 1000),
        maxMarks: 10,
        status: "PUBLISHED",
        allowLate: false,
      },
    });
    await setSession(fx.student.id, "STUDENT");
    const res = await submitAssignment({}, subFd(past.id, "too late"));
    expect(res.error).toMatch(/deadline has passed/);
  });

  it("allows a late submission when the teacher enables it", async () => {
    const late = await prisma.assignment.create({
      data: {
        title: "Late Allowed",
        description: "d",
        classId: fx.cls.id,
        subjectId: fx.subj.id,
        teacherId: fx.teacher.id,
        deadline: new Date(Date.now() - 1000),
        maxMarks: 10,
        status: "PUBLISHED",
        allowLate: true,
      },
    });
    await setSession(fx.student.id, "STUDENT");
    const res = await submitAssignment({}, subFd(late.id, "late but ok"));
    expect(res.ok).toBe(true);
    const sub = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: late.id, studentId: fx.student.id } },
    });
    expect(sub?.status).toBe("LATE");
  });

  it("accepts a file upload and stores the file URL", async () => {
    await setSession(fx.student.id, "STUDENT");
    const file = new File([Buffer.from("hello")], "answer.txt", { type: "text/plain" });
    const res = await submitAssignment({}, subFd(fx.published.id, "", file));
    expect(res.ok).toBe(true);
    const sub = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: fx.published.id, studentId: fx.student.id } },
    });
    expect(sub?.fileUrl).toMatch(/^\/uploads\//);
  });

  it("enforces the marks limit when grading", async () => {
    await setSession(fx.student.id, "STUDENT");
    await submitAssignment({}, subFd(fx.published.id, "answer"));
    const sub = await prisma.submission.findUnique({
      where: { assignmentId_studentId: { assignmentId: fx.published.id, studentId: fx.student.id } },
    });

    await setSession(fx.teacher.id, "TEACHER");
    const tooHigh = await gradeSubmission({}, gradeFd(sub!.id, "51"));
    expect(tooHigh.error).toMatch(/cannot exceed/i);
    expect(tooHigh.ok).not.toBe(true);

    const ok = await gradeSubmission({}, gradeFd(sub!.id, "45", "GRADED", "Great work"));
    expect(ok.ok).toBe(true);
    const graded = await prisma.submission.findUnique({ where: { id: sub!.id } });
    expect(graded?.marks).toBe(45);
    expect(graded?.feedback).toBe("Great work");

    const notif = await prisma.notification.findFirst({
      where: { userId: fx.student.id, type: "GRADE" },
    });
    expect(notif).not.toBeNull();
  });

  it("blocks editing a graded submission", async () => {
    const sub = await prisma.submission.create({
      data: {
        assignmentId: fx.published.id,
        studentId: fx.student.id,
        answer: "original",
        status: "GRADED",
        marks: 40,
        submittedAt: new Date(),
      },
    });
    await setSession(fx.student.id, "STUDENT");
    const res = await submitAssignment({}, subFd(fx.published.id, "edit attempt"));
    expect(res.error).toMatch(/graded/);
    expect(sub.status).toBe("GRADED");
  });
});
