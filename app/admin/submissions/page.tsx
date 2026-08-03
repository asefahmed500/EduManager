import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/dashboard/status-badge";

export default async function AdminSubmissions() {
  await requireRole("ADMIN");
  const submissions = await prisma.submission.findMany({
    orderBy: { submittedAt: "desc" },
    include: {
      student: true,
      assignment: { include: { subject: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Submissions"
        description="Every submission across the system."
      />
      <Card>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No submissions yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {submissions.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3 md:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {s.student.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {s.assignment.title} · {s.assignment.subject.name}
                    </p>
                  </div>
                  <span className="hidden text-xs tabular-nums text-muted-foreground sm:inline">
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
