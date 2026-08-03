import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRightIcon,
  ClipboardListIcon,
  FileEditIcon,
  GraduationCapIcon,
  PlusIcon,
  SendIcon,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { SubmissionStatusBadge } from "@/components/dashboard/status-badge";

function QuickAction({
  href,
  title,
  body,
  cta,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Card className="gap-0 transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      <CardContent className="flex h-full flex-col gap-1 p-5">
        <p className="text-sm font-semibold">{title}</p>
        <p className="flex-1 text-xs text-muted-foreground">{body}</p>
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary underline underline-offset-4 hover:text-foreground"
        >
          {cta} <ArrowRightIcon className="size-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function TeacherDashboard() {
  const user = await requireRole("TEACHER");
  const teacherId = user.id;

  const [
    total,
    published,
    drafts,
    pendingCount,
    upcoming,
    toGrade,
    assigned,
  ] = await Promise.all([
    prisma.assignment.count({ where: { teacherId } }),
    prisma.assignment.count({ where: { teacherId, status: "PUBLISHED" } }),
    prisma.assignment.count({ where: { teacherId, status: "DRAFT" } }),
    prisma.submission.count({
      where: { assignment: { teacherId }, status: "SUBMITTED" },
    }),
    prisma.assignment.findMany({
      where: { teacherId, status: "PUBLISHED", deadline: { gte: new Date() } },
      orderBy: { deadline: "asc" },
      take: 5,
      include: { subject: true, class: true },
    }),
    prisma.submission.findMany({
      where: { assignment: { teacherId }, status: "SUBMITTED" },
      orderBy: { submittedAt: "desc" },
      take: 5,
      include: { student: true, assignment: { include: { subject: true } } },
    }),
    prisma.teacherSubjectClass.findMany({
      where: { teacherId },
      include: { classSubject: { include: { class: true, subject: true } } },
      orderBy: { id: "asc" },
      take: 8,
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name.split(" ")[0]}. Here's what to do next.`}
      >
        <Button
          nativeButton={false}
          render={<Link href="/teacher/assignments/create" />}
        >
          <PlusIcon className="size-4" /> New assignment
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickAction
          href="/teacher/assignments"
          title="Manage assignments"
          body={`${total} total · ${published} published · ${drafts} drafts`}
          cta="View all assignments"
        />
        <QuickAction
          href="/teacher/assignments"
          title="Grade submissions"
          body={
            pendingCount > 0
              ? `${pendingCount} submission${pendingCount > 1 ? "s" : ""} waiting for marks.`
              : "No submissions waiting to be graded."
          }
          cta="Open grading"
        />
        <QuickAction
          href="/teacher/assignments?status=overdue"
          title="Check deadlines"
          body={`${upcoming.length} upcoming deadline${upcoming.length === 1 ? "" : "s"} in the next period.`}
          cta="See deadlines"
        />
      </div>

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
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Upcoming deadlines</CardTitle>
            <Link
              href="/teacher/assignments"
              className="text-xs uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
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
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Awaiting grading</CardTitle>
            <Link
              href="/teacher/assignments"
              className="text-xs uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {toGrade.length === 0 ? (
              <p className="text-sm text-muted-foreground">All caught up.</p>
            ) : (
              <ul className="divide-y divide-border">
                {toGrade.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 py-3">
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/teacher/assignments/${s.assignmentId}/submissions/${s.id}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {s.student.name}
                      </Link>
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

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>My classes &amp; subjects</CardTitle>
          <Link
            href="/teacher/assignments"
            className="text-xs uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
          >
            View assignments
          </Link>
        </CardHeader>
        <CardContent>
          {assigned.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You are not assigned to any classes yet. Ask your administrator to
              assign you.
            </p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {assigned.map((t) => (
                <li key={t.id}>
                  <Link
                    href="/teacher/assignments"
                    className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                  >
                    <GraduationCapIcon className="size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {t.classSubject.class.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {t.classSubject.subject.name}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
