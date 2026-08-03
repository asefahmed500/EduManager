import { config } from "dotenv";
import { PrismaClient } from "../lib/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PASSWORD = "Admin@123".replace("Admin", "Teacher"); // Teacher@123 used for teachers
const STUDENT_PASSWORD = "Student@123";
const ADMIN_PASSWORD = "Admin@123";

async function hash(pw: string) {
  return bcrypt.hash(pw, 10);
}

async function main() {
  console.log("Clearing existing data...");
  await prisma.$transaction([
    prisma.submission.deleteMany(),
    prisma.assignment.deleteMany(),
    prisma.teacherSubjectClass.deleteMany(),
    prisma.classSubject.deleteMany(),
    prisma.setting.deleteMany(),
    prisma.user.deleteMany(),
    prisma.subject.deleteMany(),
    prisma.class.deleteMany(),
  ]);

  // ---------- Users ----------
  const [admin, teacher, teacher2, ...students] = await Promise.all([
    prisma.user.create({
      data: {
        name: "System Admin",
        email: "admin@example.com",
        passwordHash: await hash(ADMIN_PASSWORD),
        role: "ADMIN",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Sarah Mitchell",
        email: "teacher@example.com",
        passwordHash: await hash(PASSWORD),
        role: "TEACHER",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "David Chen",
        email: "teacher2@example.com",
        passwordHash: await hash(PASSWORD),
        role: "TEACHER",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Alex Johnson",
        email: "student@example.com",
        passwordHash: await hash(STUDENT_PASSWORD),
        role: "STUDENT",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Maria Garcia",
        email: "student2@example.com",
        passwordHash: await hash(STUDENT_PASSWORD),
        role: "STUDENT",
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "James Wilson",
        email: "student3@example.com",
        passwordHash: await hash(STUDENT_PASSWORD),
        role: "STUDENT",
        isActive: true,
      },
    }),
  ]);

  const [alex, maria] = students;

  // ---------- Classes ----------
  const [classA, classB] = await Promise.all([
    prisma.class.create({
      data: { name: "Grade 10 - A", description: "Grade 10, Section A" },
    }),
    prisma.class.create({
      data: { name: "Grade 10 - B", description: "Grade 10, Section B" },
    }),
  ]);

  // ---------- Subjects ----------
  const [math, physics, cs] = await Promise.all([
    prisma.subject.create({ data: { name: "Mathematics", code: "MATH" } }),
    prisma.subject.create({ data: { name: "Physics", code: "PHYS" } }),
    prisma.subject.create({ data: { name: "Computer Science", code: "CS" } }),
  ]);

  // ---------- Assign students to class A ----------
  await prisma.user.updateMany({
    where: { id: { in: [alex.id, maria.id, students[2].id] } },
    data: { classId: classA.id },
  });

  // ---------- Map subjects to classes ----------
  const csMap = await prisma.classSubject.create({
    data: { classId: classA.id, subjectId: cs.id },
  });
  const mathAMap = await prisma.classSubject.create({
    data: { classId: classA.id, subjectId: math.id },
  });
  const physicsAMap = await prisma.classSubject.create({
    data: { classId: classA.id, subjectId: physics.id },
  });
  await prisma.classSubject.create({
    data: { classId: classB.id, subjectId: math.id },
  });

  // ---------- Assign teachers to (class + subject) ----------
  await prisma.teacherSubjectClass.create({
    data: { teacherId: teacher.id, classSubjectId: mathAMap.id },
  });
  await prisma.teacherSubjectClass.create({
    data: { teacherId: teacher.id, classSubjectId: csMap.id },
  });
  await prisma.teacherSubjectClass.create({
    data: { teacherId: teacher2.id, classSubjectId: physicsAMap.id },
  });

  // ---------- Assignments ----------
  const days = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);

  const a1 = await prisma.assignment.create({
    data: {
      title: "Algebra Fundamentals Worksheet",
      description:
        "Solve all problems in Section 3.2. Show your working for each question and submit as text.",
      classId: classA.id,
      subjectId: math.id,
      teacherId: teacher.id,
      deadline: days(7),
      maxMarks: 50,
      status: "PUBLISHED",
      allowLate: true,
    },
  });
  const a2 = await prisma.assignment.create({
    data: {
      title: "Intro to Python — Mini Project",
      description:
        "Build a small CLI program (calculator or todo list) and submit your source code and a short write-up.",
      classId: classA.id,
      subjectId: cs.id,
      teacherId: teacher.id,
      deadline: days(3),
      maxMarks: 100,
      status: "PUBLISHED",
      allowLate: false,
    },
  });
  await prisma.assignment.create({
    data: {
      title: "Quadratic Equations Quiz (Draft)",
      description: "Short quiz on quadratic equations. Not yet published.",
      classId: classA.id,
      subjectId: math.id,
      teacherId: teacher.id,
      deadline: days(10),
      maxMarks: 25,
      status: "DRAFT",
      allowLate: false,
    },
  });
  const a4 = await prisma.assignment.create({
    data: {
      title: "Newton's Laws — Lab Report",
      description:
        "Write up the experiment on Newton's laws of motion. Include your observations and conclusions.",
      classId: classA.id,
      subjectId: physics.id,
      teacherId: teacher2.id,
      deadline: days(5),
      maxMarks: 40,
      status: "PUBLISHED",
      allowLate: false,
    },
  });

  // ---------- Submissions ----------
  await prisma.submission.create({
    data: {
      assignmentId: a1.id,
      studentId: alex.id,
      answer:
        "Q1: x = 3 or x = -2 (using the quadratic formula).\nQ2: factor: (x-1)(x-4).\nQ3: discriminant = 49.",
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });
  await prisma.submission.create({
    data: {
      assignmentId: a1.id,
      studentId: maria.id,
      answer:
        "Q1: x = 3 or x = -2.\nQ2: (x-1)(x-4).\nQ3: discriminant = 49, two real roots.",
      status: "GRADED",
      marks: 44,
      feedback: "Excellent work, Maria. Careful with notation in Q3 — otherwise perfect.",
      gradedAt: new Date(),
      gradedById: teacher.id,
      submittedAt: days(-1),
    },
  });

  // ---------- Notifications ----------
  await prisma.notification.createMany({
    data: [
      {
        userId: alex.id,
        title: "New assignment published",
        message: `"${a1.title}" is now available. Submit before the deadline.`,
        type: "ASSIGNMENT",
        link: `/student/assignments/${a1.id}`,
      },
      {
        userId: alex.id,
        title: "Submission graded",
        message: `Your submission for "${a1.title}" was graded.`,
        type: "GRADE",
        link: `/student/assignments/${a1.id}`,
        read: true,
      },
      {
        userId: teacher.id,
        title: "New submission",
        message: `${maria.name} submitted "${a1.title}".`,
        type: "SUBMISSION",
        link: `/teacher/assignments/${a1.id}/submissions`,
      },
    ],
  });

  // ---------- Settings ----------
  await prisma.setting.create({ data: { key: "siteName", value: "EduManager" } });
  await prisma.setting.create({ data: { key: "maxUploadMb", value: "10" } });
  await prisma.setting.create({ data: { key: "allowLateDefault", value: "false" } });

  // Silence unused warnings for demo breadth
  void admin;
  void classB;
  void a2;
  void a4;

  console.log("Seed complete.");
  console.log("  Admin:    admin@example.com / Admin@123");
  console.log("  Teacher:  teacher@example.com / Teacher@123");
  console.log("  Student:  student@example.com / Student@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
