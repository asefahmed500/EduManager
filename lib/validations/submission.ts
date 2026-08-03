import { z } from "zod";

export const submissionSchema = z.object({
  answer: z.string().max(20000),
});

export const gradeSchema = z.object({
  marks: z.coerce
    .number()
    .int("Marks must be a whole number")
    .min(0, "Marks cannot be negative"),
  feedback: z.string().max(5000).optional().default(""),
  status: z.enum(["GRADED", "RETURNED", "SUBMITTED", "LATE"]),
});

export type GradeInput = z.infer<typeof gradeSchema>;
