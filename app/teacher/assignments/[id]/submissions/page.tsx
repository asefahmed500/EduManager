import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/dashboard/status-badge";

export default async function AssignmentSubmissions({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("TEACHER");
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: Number(id) },
    include: {
      class: true,
      subject: true,
      submissions: {
        include: { student: true },
        orderBy: { submittedAt: "desc" },
      },
    },
  });
  if (!assignment || assignment.teacherId !== user.id) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Submissions"
        description={`${assignment.title} — ${assignment.class.name} · ${assignment.subject.name}`}
      />
      <Card>
        <CardContent className="p-0">
          {assignment.submissions.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No submissions yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {assignment.submissions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3 md:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/teacher/assignments/${assignment.id}/submissions/${s.id}`}
                      className="font-medium hover:underline"
                    >
                      {s.student.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {s.submittedAt
                        ? `submitted ${format(s.submittedAt, "d MMM, HH:mm")}`
                        : "not submitted"}
                    </p>
                  </div>
                  <span className="hidden w-24 text-right text-xs text-muted-foreground tabular-nums sm:inline">
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
  );
}
