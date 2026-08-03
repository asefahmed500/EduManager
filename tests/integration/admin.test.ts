import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import {
  addSubjectToClass,
  assignTeacher,
  createClass,
  createSubject,
  createUser,
  deleteClass,
  deleteSubject,
  deleteUser,
  removeSubjectFromClass,
  setUserActive,
  unassignTeacher,
  updateClass,
  updateSubject,
  updateUser,
} from "@/app/actions/admin";
import { createFixtures, resetDatabase, setSession } from "./fixtures";

function fd(obj: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.set(k, v);
  return f;
}

describe("admin module", () => {
  let fx: Awaited<ReturnType<typeof createFixtures>>;

  beforeEach(async () => {
    await resetDatabase();
    fx = await createFixtures();
    await setSession(fx.admin.id, "ADMIN");
  });

  it("creates, edits, activates/deactivates and deletes users", async () => {
    const created = await createUser(
      {},
      fd({ name: "User One", email: "user1@test.dev", password: "123456", role: "STUDENT" }),
    );
    expect(created.ok).toBe(true);
    const user = await prisma.user.findUnique({ where: { email: "user1@test.dev" } });
    expect(user?.role).toBe("STUDENT");
    expect(user?.isActive).toBe(true);

    await setUserActive(user!.id, false);
    expect((await prisma.user.findUnique({ where: { id: user!.id } }))?.isActive).toBe(false);

    const updated = await updateUser(
      {},
      fd({ id: String(user!.id), name: "User One Edit", email: "user1@test.dev", role: "STUDENT" }),
    );
    expect(updated.ok).toBe(true);
    expect((await prisma.user.findUnique({ where: { id: user!.id } }))?.name).toBe("User One Edit");

    await deleteUser(user!.id);
    expect(await prisma.user.findUnique({ where: { id: user!.id } })).toBeNull();
  });

  it("creates, edits and deletes classes with subject mapping and teacher assignment", async () => {
    const created = await createClass({}, fd({ name: "Class One", description: "desc" }));
    expect(created.ok).toBe(true);
    const cls = await prisma.class.findUnique({ where: { name: "Class One" } });

    const updated = await updateClass({}, fd({ id: String(cls!.id), name: "Class One Edit" }));
    expect(updated.ok).toBe(true);

    const mapped = await addSubjectToClass(cls!.id, fx.subj.id);
    expect(mapped.ok).toBe(true);
    const cs = await prisma.classSubject.findFirst({
      where: { classId: cls!.id, subjectId: fx.subj.id },
    });
    expect(cs).not.toBeNull();

    const assigned = await assignTeacher(fx.teacher.id, cs!.id);
    expect(assigned.ok).toBe(true);
    const tsc = await prisma.teacherSubjectClass.findFirst({ where: { classSubjectId: cs!.id } });
    expect(tsc?.teacherId).toBe(fx.teacher.id);

    await unassignTeacher(tsc!.id);
    await removeSubjectFromClass(cs!.id);
    await deleteClass(cls!.id);
    expect(await prisma.class.findUnique({ where: { id: cls!.id } })).toBeNull();
  });

  it("creates and edits subjects", async () => {
    const created = await createSubject({}, fd({ name: "Subject One", code: "S1" }));
    expect(created.ok).toBe(true);
    const s = await prisma.subject.findUnique({ where: { code: "S1" } });

    const updated = await updateSubject({}, fd({ id: String(s!.id), name: "Subject One Edit", code: "S1E" }));
    expect(updated.ok).toBe(true);
    expect((await prisma.subject.findUnique({ where: { id: s!.id } }))?.name).toBe("Subject One Edit");

    await deleteSubject(s!.id);
    expect(await prisma.subject.findUnique({ where: { id: s!.id } })).toBeNull();
  });
});
