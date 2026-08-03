import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  createAssignment,
  deleteAssignment,
  duplicateAssignment,
  togglePublish,
  updateAssignment,
} from "@/app/actions/assignments";
import {
  assignmentFormData,
  createFixtures,
  resetDatabase,
  setSession,
} from "./fixtures";

describe("teacher assignment module", () => {
  let fx: Awaited<ReturnType<typeof createFixtures>>;

  beforeEach(async () => {
    await resetDatabase();
    fx = await createFixtures();
    await setSession(fx.teacher.id, "TEACHER");
  });

  it("creates an assignment as a draft, then publishes it", async () => {
    const created = await createAssignment(
      {},
      assignmentFormData({ classSubjectId: String(fx.cs.id) }),
    );
    expect(created.ok).toBe(true);
    const assignment = await prisma.assignment.findUnique({ where: { id: created.id } });
    expect(assignment?.status).toBe("DRAFT");
    expect(assignment?.maxMarks).toBe(50);

    await togglePublish(assignment!.id);
    expect((await prisma.assignment.findUnique({ where: { id: assignment!.id } }))?.status).toBe("PUBLISHED");
  });

  it("blocks assignments for class-subjects the teacher is not assigned to", async () => {
    const csB = await prisma.classSubject.create({
      data: { classId: fx.clsB.id, subjectId: fx.subj.id },
    });
    const res = await createAssignment(
      {},
      assignmentFormData({ classSubjectId: String(csB.id) }),
    );
    expect(res.error).toMatch(/not assigned/);
  });

  it("rejects a deadline in the past", async () => {
    const res = await createAssignment(
      {},
      assignmentFormData({
        classSubjectId: String(fx.cs.id),
        deadline: new Date(Date.now() - 1000).toISOString(),
      }),
    );
    expect(res.errors?.deadline).toBeDefined();
  });

  it("edits, duplicates and deletes an assignment", async () => {
    const created = await createAssignment(
      {},
      assignmentFormData({ classSubjectId: String(fx.cs.id), title: "Original" }),
    );

    const edited = await updateAssignment(
      {},
      assignmentFormData({
        id: String(created.id),
        classSubjectId: String(fx.cs.id),
        title: "Edited Title",
        intent: "publish",
      }),
    );
    expect(edited.ok).toBe(true);
    const updated = await prisma.assignment.findUnique({ where: { id: created.id } });
    expect(updated?.title).toBe("Edited Title");
    expect(updated?.status).toBe("PUBLISHED");

    const duplicated = await duplicateAssignment(created.id!);
    expect(duplicated.ok).toBe(true);
    const copy = await prisma.assignment.findUnique({ where: { id: duplicated.id } });
    expect(copy?.title).toMatch(/\(Copy\)/);
    expect(copy?.status).toBe("DRAFT");

    await deleteAssignment(created.id!);
    expect(await prisma.assignment.findUnique({ where: { id: created.id } })).toBeNull();
  });

  it("notifies the class students when an assignment is published", async () => {
    const created = await createAssignment(
      {},
      assignmentFormData({ classSubjectId: String(fx.cs.id), intent: "publish" }),
    );
    expect(created.ok).toBe(true);
    const notif = await prisma.notification.findFirst({
      where: { userId: fx.student.id, type: "ASSIGNMENT" },
    });
    expect(notif?.link).toBe(`/student/assignments/${created.id}`);
  });
});
