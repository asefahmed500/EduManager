import { notFound } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/dashboard/status-badge";
import { SubmissionForm } from "@/components/assignments/submission-form";
import { DeleteSubmissionButton } from "@/components/assignments/delete-submission-button";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

export default async function StudentAssignmentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("STUDENT");
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: Number(id) },
    include: {
      subject: true,
      submissions: { where: { studentId: user.id } },
    },
  });
  if (
    !assignment ||
    assignment.status !== "PUBLISHED" ||
    assignment.classId !== user.classId
  ) {
    notFound();
  }

  const mine = assignment.submissions[0];
  const now = new Date();
  const deadlinePassed = assignment.deadline < now;
  const isGraded = mine?.status === "GRADED";
  const canEdit = !isGraded && (!deadlinePassed || assignment.allowLate);
  const maxUploadMb = Number(process.env.MAX_UPLOAD_MB) || 10;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={assignment.title}
        description={`${assignment.subject.name} · due ${format(
          assignment.deadline,
          "d MMM yyyy, HH:mm",
        )}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Brief</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm">
                {assignment.description}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                <span>
                  Max marks:{" "}
                  <span className="tabular-nums text-foreground">
                    {assignment.maxMarks}
                  </span>
                </span>
                <span>
                  Late allowed:{" "}
                  <span className="text-foreground">
                    {assignment.allowLate ? "Yes" : "No"}
                  </span>
                </span>
                {mine ? <SubmissionStatusBadge status={mine.status} /> : null}
              </div>
            </CardContent>
          </Card>

          {isGraded ? (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Your result</CardTitle>
                <span className="font-serif text-2xl tabular-nums">
                  {mine?.marks}/{assignment.maxMarks}
                </span>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {mine?.feedback || "No feedback provided."}
                </p>
              </CardContent>
            </Card>
          ) : canEdit ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {mine ? "Update your submission" : "Submit your work"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <SubmissionForm
                  assignmentId={assignment.id}
                  maxUploadMb={maxUploadMb}
                  existing={
                    mine
                      ? { answer: mine.answer, fileUrl: mine.fileUrl }
                      : undefined
                  }
                />
                {mine ? (
                  <div className="mt-2 flex justify-end">
                    <DeleteSubmissionButton submissionId={mine.id} />
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Your submission</CardTitle>
              </CardHeader>
              <CardContent>
                {mine?.answer ? (
                  <p className="whitespace-pre-wrap text-sm">{mine.answer}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    The deadline has passed and late submissions are not
                    allowed.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <Row
              label="Deadline"
              value={format(assignment.deadline, "d MMM, HH:mm")}
            />
            <Row
              label="Time left"
              value={
                deadlinePassed
                  ? "Passed"
                  : formatDistanceToNow(assignment.deadline, {
                      addSuffix: true,
                    })
              }
            />
            <Row
              label="Submission"
              value={
                mine
                  ? mine.status.replace("_", " ").toLowerCase()
                  : "not submitted"
              }
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
