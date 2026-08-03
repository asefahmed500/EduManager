import { notFound } from "next/navigation";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AssignmentStatusBadge,
  SubmissionStatusBadge,
} from "@/components/dashboard/status-badge";

export default async function AdminAssignmentDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole("ADMIN");
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: Number(id) },
    include: {
      class: true,
      subject: true,
      teacher: true,
      submissions: {
        include: { student: true },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!assignment) notFound();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={assignment.title}
        description={`${assignment.class.name} · ${assignment.subject.name} · by ${assignment.teacher.name}`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Details</CardTitle>
            <AssignmentStatusBadge status={assignment.status} />
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="whitespace-pre-wrap text-sm">
              {assignment.description}
            </p>
            <dl className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
              <div>
                Deadline:{" "}
                <span className="text-foreground">
                  {format(assignment.deadline, "d MMM yyyy, HH:mm")}
                </span>
              </div>
              <div>
                Max marks:{" "}
                <span className="tabular-nums text-foreground">
                  {assignment.maxMarks}
                </span>
              </div>
              <div>
                Late allowed:{" "}
                <span className="text-foreground">
                  {assignment.allowLate ? "Yes" : "No"}
                </span>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submissions ({assignment.submissions.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {assignment.submissions.length === 0 ? (
              <p className="px-5 py-6 text-center text-sm text-muted-foreground">
                No submissions yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {assignment.submissions.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {s.student.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.submittedAt
                          ? format(s.submittedAt, "d MMM, HH:mm")
                          : "—"}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {s.marks != null
                        ? `${s.marks}/${assignment.maxMarks}`
                        : "—"}
                    </span>
                    <SubmissionStatusBadge status={s.status} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
