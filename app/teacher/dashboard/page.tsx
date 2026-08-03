import Link from "next/link";
import { format } from "date-fns";
import { ClipboardListIcon, FileEditIcon, SendIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { SubmissionStatusBadge } from "@/components/dashboard/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeacherDashboard() {
  const user = await requireRole("TEACHER");
  const teacherId = user.id;

  const [total, published, drafts, pendingCount, upcoming, toGrade] =
    await Promise.all([
      prisma.assignment.count({ where: { teacherId } }),
      prisma.assignment.count({
        where: { teacherId, status: "PUBLISHED" },
      }),
      prisma.assignment.count({ where: { teacherId, status: "DRAFT" } }),
      prisma.submission.count({
        where: { assignment: { teacherId }, status: "SUBMITTED" },
      }),
      prisma.assignment.findMany({
        where: {
          teacherId,
          status: "PUBLISHED",
          deadline: { gte: new Date() },
        },
        orderBy: { deadline: "asc" },
        take: 5,
        include: { subject: true, class: true },
      }),
      prisma.submission.findMany({
        where: { assignment: { teacherId }, status: "SUBMITTED" },
        orderBy: { submittedAt: "desc" },
        take: 5,
        include: {
          student: true,
          assignment: { include: { subject: true } },
        },
      }),
    ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name.split(" ")[0]}. Here is what needs your attention.`}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Assignments" value={total} icon={ClipboardListIcon} />
        <StatCard label="Published" value={published} icon={SendIcon} />
        <StatCard label="Drafts" value={drafts} icon={FileEditIcon} />
        <StatCard
          label="Awaiting grading"
          value={pendingCount}
          icon={FileEditIcon}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No upcoming deadlines.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {upcoming.map((a) => (
                  <li key={a.id} className="flex items-center gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/teacher/assignments/${a.id}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {a.title}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {a.class.name} · {a.subject.name}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {format(a.deadline, "d MMM, HH:mm")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Awaiting grading</CardTitle>
          </CardHeader>
          <CardContent>
            {toGrade.length === 0 ? (
              <p className="text-sm text-muted-foreground">All caught up.</p>
            ) : (
              <ul className="divide-y divide-border">
                {toGrade.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {s.student.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.assignment.title}
                      </p>
                    </div>
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
