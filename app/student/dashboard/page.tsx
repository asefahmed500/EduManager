import Link from "next/link";
import { format } from "date-fns";
import { ClipboardListIcon, FileCheckIcon, MessageSquareIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SubmissionStatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function StudentDashboard() {
  const user = await requireRole("STUDENT");
  const studentId = user.id;

  if (!user.classId) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Dashboard" />
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            You have not been assigned to a class yet. Please contact your
            administrator.
          </CardContent>
        </Card>
      </div>
    );
  }

  const classId = user.classId;

  const [openCount, submittedCount, gradedCount, upcoming, feedback] =
    await Promise.all([
      prisma.assignment.count({
        where: { classId, status: "PUBLISHED" },
      }),
      prisma.submission.count({
        where: { studentId, status: { in: ["SUBMITTED", "LATE"] } },
      }),
      prisma.submission.count({ where: { studentId, status: "GRADED" } }),
      prisma.assignment.findMany({
        where: { classId, status: "PUBLISHED" },
        orderBy: { deadline: "asc" },
        take: 6,
        include: {
          subject: true,
          submissions: { where: { studentId } },
        },
      }),
      prisma.submission.findMany({
        where: { studentId, status: "GRADED", feedback: { not: null } },
        orderBy: { gradedAt: "desc" },
        take: 4,
        include: { assignment: { include: { subject: true } } },
      }),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="Your assignments, deadlines and recent feedback."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Open assignments" value={openCount} icon={ClipboardListIcon} />
        <StatCard label="Submitted" value={submittedCount} icon={FileCheckIcon} />
        <StatCard label="Graded" value={gradedCount} icon={FileCheckIcon} />
        <StatCard label="Feedback" value={feedback.length} icon={MessageSquareIcon} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No assignments for your class yet.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((a) => {
                  const mine = a.submissions[0];
                  return (
                    <li key={a.id} className="flex items-center gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/student/assignments/${a.id}`}
                          className="truncate text-sm font-medium hover:underline"
                        >
                          {a.title}
                        </Link>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.subject.name} · due{" "}
                          {format(a.deadline, "d MMM, HH:mm")}
                        </p>
                      </div>
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

        <Card>
          <CardHeader>
            <CardTitle>Recent feedback</CardTitle>
          </CardHeader>
          <CardContent>
            {feedback.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No feedback yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-4">
                {feedback.map((s) => (
                  <li key={s.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">
                        {s.assignment.title}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {s.marks}/{s.assignment.maxMarks}
                      </span>
                    </div>
                    {s.feedback ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        “{s.feedback}”
                      </p>
                    ) : null}
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
