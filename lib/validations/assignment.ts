import { z } from "zod";

export const assignmentSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(200),
  description: z.string().min(1, "Description is required").max(20000),
  classSubjectId: z.coerce.number().int().positive("Select a class and subject"),
  deadline: z.string().min(1, "Deadline is required"),
  maxMarks: z.coerce
    .number()
    .int("Maximum marks must be a whole number")
    .min(1, "Maximum marks must be at least 1")
    .max(10000),
  allowLate: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export type AssignmentInput = z.infer<typeof assignmentSchema>;

export function toDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate(),
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
