import Link from "next/link";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/dashboard/status-badge";

export default async function StudentSubmissions() {
  const user = await requireRole("STUDENT");

  const submissions = await prisma.submission.findMany({
    where: { studentId: user.id },
    orderBy: { submittedAt: "desc" },
    include: { assignment: { include: { subject: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="My submissions"
        description="Everything you have submitted, with marks and feedback."
      />
      <Card>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              You have not submitted anything yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {submissions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3 md:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/student/assignments/${s.assignmentId}`}
                      className="font-medium hover:underline"
                    >
                      {s.assignment.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.assignment.subject.name} ·{" "}
                      {s.submittedAt
                        ? format(s.submittedAt, "d MMM, HH:mm")
                        : ""}
                    </p>
                  </div>
                  <span className="hidden w-24 text-right text-xs tabular-nums text-muted-foreground sm:inline">
                    {s.marks != null
                      ? `${s.marks}/${s.assignment.maxMarks}`
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
