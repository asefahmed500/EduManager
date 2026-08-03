import { describe, it, expect } from "vitest";

import {
  canAccessRoleArea,
  canStudentEditSubmission,
  canTeacherGrade,
  isAssignmentVisibleToStudent,
  isDraftVisibleToCreator,
  isMarksValid,
} from "../lib/rules";

const DAY = 24 * 60 * 60 * 1000;

describe("business rules", () => {
  describe("Rule 1 & 2: student assignment visibility", () => {
    const visible = isAssignmentVisibleToStudent;

    it("shows published assignments for the student's class", () => {
      expect(
        visible({ status: "PUBLISHED", classId: 1, studentClassId: 1 }),
      ).toBe(true);
    });

    it("hides draft assignments from students", () => {
      expect(
        visible({ status: "DRAFT", classId: 1, studentClassId: 1 }),
      ).toBe(false);
    });

    it("hides assignments from other classes", () => {
      expect(
        visible({ status: "PUBLISHED", classId: 1, studentClassId: 2 }),
      ).toBe(false);
    });

    it("hides assignments when the student has no class", () => {
      expect(
        visible({ status: "PUBLISHED", classId: 1, studentClassId: null }),
      ).toBe(false);
    });
  });

  describe("Rule 7: draft visibility is creator-only", () => {
    it("shows drafts to their creator", () => {
      expect(
        isDraftVisibleToCreator({
          status: "DRAFT",
          teacherId: 7,
          viewerId: 7,
        }),
      ).toBe(true);
    });

    it("hides drafts from other teachers", () => {
      expect(
        isDraftVisibleToCreator({
          status: "DRAFT",
          teacherId: 7,
          viewerId: 8,
        }),
      ).toBe(false);
    });

    it("shows published assignments to everyone (visibility gate handled elsewhere)", () => {
      expect(
        isDraftVisibleToCreator({
          status: "PUBLISHED",
          teacherId: 7,
          viewerId: 8,
        }),
      ).toBe(true);
    });
  });

  describe("Rule 5: marks validation", () => {
    it("accepts marks within range", () => {
      expect(isMarksValid(40, 50)).toBe(true);
      expect(isMarksValid(0, 50)).toBe(true);
      expect(isMarksValid(50, 50)).toBe(true);
    });

    it("rejects marks above maximum", () => {
      expect(isMarksValid(51, 50)).toBe(false);
    });

    it("rejects negative marks", () => {
      expect(isMarksValid(-1, 50)).toBe(false);
    });

    it("rejects fractional marks", () => {
      expect(isMarksValid(40.5, 50)).toBe(false);
    });
  });

  describe("Rule 3: student can edit submission", () => {
    const deadline = 1_000_000;

    it("allows editing before the deadline", () => {
      expect(
        canStudentEditSubmission({
          status: "SUBMITTED",
          deadline,
          allowLate: false,
          now: deadline - DAY,
        }),
      ).toBe(true);
    });

    it("blocks editing after the deadline when late is not allowed", () => {
      expect(
        canStudentEditSubmission({
          status: "SUBMITTED",
          deadline,
          allowLate: false,
          now: deadline + DAY,
        }),
      ).toBe(false);
    });

    it("allows editing after the deadline when late is allowed", () => {
      expect(
        canStudentEditSubmission({
          status: "SUBMITTED",
          deadline,
          allowLate: true,
          now: deadline + DAY,
        }),
      ).toBe(true);
    });

    it("blocks editing once graded", () => {
      expect(
        canStudentEditSubmission({
          status: "GRADED",
          deadline,
          allowLate: true,
          now: deadline - DAY,
        }),
      ).toBe(false);
    });
  });

  describe("Rule 4: teacher grading ownership", () => {
    it("allows the owner to grade", () => {
      expect(
        canTeacherGrade({ assignmentTeacherId: 5, viewerId: 5 }),
      ).toBe(true);
    });

    it("blocks other teachers from grading", () => {
      expect(
        canTeacherGrade({ assignmentTeacherId: 5, viewerId: 6 }),
      ).toBe(false);
    });
  });

  describe("Rule 6: role-based route access", () => {
    it("grants each role its own area", () => {
      expect(canAccessRoleArea("ADMIN", "/admin/users")).toBe(true);
      expect(canAccessRoleArea("TEACHER", "/teacher/assignments")).toBe(true);
      expect(canAccessRoleArea("STUDENT", "/student/assignments")).toBe(true);
    });

    it("denies cross-role access", () => {
      expect(canAccessRoleArea("STUDENT", "/admin/users")).toBe(false);
      expect(canAccessRoleArea("TEACHER", "/student/dashboard")).toBe(false);
      expect(canAccessRoleArea("ADMIN", "/teacher/assignments")).toBe(false);
    });

    it("leaves public areas open to all", () => {
      expect(canAccessRoleArea("STUDENT", "/")).toBe(true);
      expect(canAccessRoleArea("ADMIN", "/login")).toBe(true);
    });
  });
});
