/**
 * Pure business-rule predicates for the Assignment & Submission system.
 *
 * These are intentionally framework- and database-free so they can be unit
 * tested in isolation. The Server Actions and data-access layer call these to
 * enforce the rules documented in the PRD (see section 7 — Business Rules).
 */

export type Role = "ADMIN" | "TEACHER" | "STUDENT";

/** Rule 1 & 2: only PUBLISHED assignments of the student's own class are visible. */
export function isAssignmentVisibleToStudent(input: {
  status: string;
  classId: number;
  studentClassId: number | null;
}): boolean {
  return (
    input.status === "PUBLISHED" &&
    input.studentClassId !== null &&
    input.classId === input.studentClassId
  );
}

/** Rule 7: drafts are only visible to the teacher who created them. */
export function isDraftVisibleToCreator(input: {
  status: string;
  teacherId: number;
  viewerId: number;
}): boolean {
  if (input.status !== "DRAFT") return true;
  return input.teacherId === input.viewerId;
}

/** Rule 5: marks must be a whole number in [0, maxMarks]. */
export function isMarksValid(marks: number, maxMarks: number): boolean {
  return (
    Number.isInteger(marks) && marks >= 0 && marks <= maxMarks
  );
}

/** Rule 3: students may edit a submission only before the deadline (unless late allowed) and never after grading. */
export function canStudentEditSubmission(input: {
  status: string;
  deadline: number;
  allowLate: boolean;
  now: number;
}): boolean {
  if (input.status === "GRADED") return false;
  const beforeDeadline = input.now <= input.deadline;
  return beforeDeadline || input.allowLate;
}

/** Rule 4: a teacher can only grade submissions of assignments they own. */
export function canTeacherGrade(input: {
  assignmentTeacherId: number;
  viewerId: number;
}): boolean {
  return input.assignmentTeacherId === input.viewerId;
}

/** Rule 6: role-based access to a route area. */
export function canAccessRoleArea(role: Role, pathname: string): boolean {
  const area = pathname.split("/")[1];
  if (area === "admin") return role === "ADMIN";
  if (area === "teacher") return role === "TEACHER";
  if (area === "student") return role === "STUDENT";
  return true;
}
