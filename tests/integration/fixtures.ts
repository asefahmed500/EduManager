import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { encrypt } from "@/lib/jwt";
import { setSessionToken } from "./session-store";

export async function resetDatabase(): Promise<void> {
  await prisma.$transaction([
    prisma.notification.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.teacherSubjectClass.deleteMany(),
    prisma.classSubject.deleteMany(),
    prisma.setting.deleteMany(),
    prisma.user.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.class.deleteMany(),
  ]);
}

export async function setSession(userId: number, role: string): Promise<void> {
  const token = await encrypt({ userId, role: role as never, expiresAt: Date.now() + 3600_000 });
  setSessionToken(token);
}

export function clearSession(): void {
  setSessionToken(undefined);
}

export async function createFixtures() {
  const passwordHash = await hashPassword("Password@123");

  const admin = await prisma.user.create({
    data: { name: "Admin", email: "admin@test.dev", passwordHash, role: "ADMIN", isActive: true },
  });
  const teacher = await prisma.user.create({
    data: { name: "Teacher One", email: "teacher@test.dev", passwordHash, role: "TEACHER", isActive: true },
  });
  const teacher2 = await prisma.user.create({
    data: { name: "Teacher Two", email: "teacher2@test.dev", passwordHash, role: "TEACHER", isActive: true },
  });
  const student = await prisma.user.create({
    data: { name: "Student One", email: "student@test.dev", passwordHash, role: "STUDENT", isActive: true },
  });

  const cls = await prisma.class.create({ data: { name: "Test Class A" } });
  const clsB = await prisma.class.create({ data: { name: "Test Class B" } });
  const subj = await prisma.subject.create({ data: { name: "Test Subject", code: "TS" } });

  const cs = await prisma.classSubject.create({
    data: { classId: cls.id, subjectId: subj.id },
  });
  await prisma.teacherSubjectClass.create({
    data: { teacherId: teacher.id, classSubjectId: cs.id },
  });

  await prisma.user.update({ where: { id: student.id }, data: { classId: cls.id } });

  const published = await prisma.assignment.create({
    data: {
      title: "Published Assignment",
      description: "Description",
      classId: cls.id,
      subjectId: subj.id,
      teacherId: teacher.id,
      deadline: new Date(Date.now() + 86_400_000),
      maxMarks: 50,
      status: "PUBLISHED",
      allowLate: false,
    },
  });
  const draft = await prisma.assignment.create({
    data: {
      title: "Draft Assignment",
      description: "Description",
      classId: cls.id,
      subjectId: subj.id,
      teacherId: teacher.id,
      deadline: new Date(Date.now() + 86_400_000),
      maxMarks: 100,
      status: "DRAFT",
      allowLate: false,
    },
  });

  return { admin, teacher, teacher2, student, cls, clsB, subj, cs, published, draft };
}

export function assignmentFormData(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  const base: Record<string, string> = {
    title: "New Assignment",
    description: "Do the work",
    classSubjectId: "0",
    deadline: new Date(Date.now() + 86_400_000).toISOString(),
    maxMarks: "50",
    intent: "draft",
  };
  for (const [k, v] of Object.entries({ ...base, ...overrides })) {
    fd.append(k, v);
  }
  return fd;
}
