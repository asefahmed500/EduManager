import Link from "next/link";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/dashboard/status-badge";

export default async function StudentAssignments() {
  const user = await requireRole("STUDENT");

  if (!user.classId) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Assignments" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You have not been assigned to a class yet.
          </CardContent>
        </Card>
      </div>
    );
  }

  const assignments = await prisma.assignment.findMany({
    where: { classId: user.classId, status: "PUBLISHED" },
    orderBy: { deadline: "asc" },
    include: {
      subject: true,
      submissions: { where: { studentId: user.id } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assignments"
        description="Published assignments for your class."
      />
      <Card>
        <CardContent className="p-0">
          {assignments.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No assignments available right now.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {assignments.map((a) => {
                const mine = a.submissions[0];
                return (
                  <li
                    key={a.id}
                    className="flex items-center gap-3 px-4 py-3 md:px-6"
                  >
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/student/assignments/${a.id}`}
                        className="font-medium hover:underline"
                      >
                        {a.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.subject.name} · due{" "}
                        {format(a.deadline, "d MMM yyyy, HH:mm")}
                      </p>
                    </div>
                    <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                      /{a.maxMarks}
                    </span>
                    <SubmissionStatusBadge
                      status={mine?.status ?? "NOT_SUBMITTED"}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
