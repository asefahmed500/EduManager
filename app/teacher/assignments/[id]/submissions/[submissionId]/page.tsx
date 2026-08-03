import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/dashboard/status-badge";
import { GradeForm } from "@/components/assignments/grade-form";

export default async function GradeSubmissionPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const user = await requireRole("TEACHER");
  const { id, submissionId } = await params;

  const submission = await prisma.submission.findUnique({
    where: { id: Number(submissionId) },
    include: { assignment: true, student: true },
  });
  if (
    !submission ||
    submission.assignment.teacherId !== user.id ||
    submission.assignmentId !== Number(id)
  ) {
    notFound();
  }

  const editable = submission.status !== "GRADED" || true;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Grade · ${submission.student.name}`}
        description={submission.assignment.title}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Student&apos;s answer</CardTitle>
            <SubmissionStatusBadge status={submission.status} />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {submission.answer ? (
              <p className="whitespace-pre-wrap text-sm">
                {submission.answer}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                No written answer provided.
              </p>
            )}
            {submission.fileUrl ? (
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-primary underline underline-offset-4"
              >
                Download attached file
              </a>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Grading</CardTitle>
          </CardHeader>
          <CardContent>
            {editable ? (
              <GradeForm
                submissionId={submission.id}
                maxMarks={submission.assignment.maxMarks}
                defaults={{
                  marks: submission.marks,
                  feedback: submission.feedback,
                  status: submission.status,
                }}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                This submission is locked.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
