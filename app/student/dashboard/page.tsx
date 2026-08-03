import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  ClipboardListIcon,
  FileCheckIcon,
  InboxIcon,
  MessageSquareIcon,
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

export default async function StudentDashboard() {
  const user = await requireRole("STUDENT");
  const studentId = user.id;

  if (!user.classId) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Dashboard"
          description="Your assignments, deadlines and feedback."
        />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <CheckCircle2Icon className="size-8 text-muted-foreground" />
            <p className="text-sm font-medium">
              You are not assigned to a class yet
            </p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Once an administrator assigns you to a class, your assignments
              will appear here. You can still view your account from the menu in
              the top right.
            </p>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/student/assignments" />}
            >
              Open assignments
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const classId = user.classId;

  const [openCount, submittedCount, gradedCount, upcoming, feedback] =
    await Promise.all([
      prisma.assignment.count({ where: { classId, status: "PUBLISHED" } }),
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

  const pendingCount = upcoming.filter(
    (a) => a.submissions[0]?.status !== "GRADED",
  ).length;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user.name.split(" ")[0]}. Here's what needs your attention.`}
      >
        <Button
          nativeButton={false}
          render={<Link href="/student/assignments" />}
        >
          <ClipboardListIcon className="size-4" /> View assignments
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickAction
          href="/student/assignments"
          title="Open assignments"
          body={
            pendingCount > 0
              ? `${pendingCount} assignment${pendingCount > 1 ? "s" : ""} still need${pendingCount === 1 ? "s" : ""} your work.`
              : "You are all caught up on assignments."
          }
          cta="Submit your work"
        />
        <QuickAction
          href="/student/submissions"
          title="My submissions"
          body={`${submittedCount} submitted · ${gradedCount} graded`}
          cta="Track your submissions"
        />
        <QuickAction
          href="/student/submissions"
          title="Recent feedback"
          body={
            feedback.length > 0
              ? `You have ${feedback.length} piece${feedback.length === 1 ? "" : "s"} of feedback.`
              : "No feedback yet — check back after grading."
          }
          cta="View feedback"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Open assignments" value={openCount} icon={ClipboardListIcon} />
        <StatCard label="Submitted" value={submittedCount} icon={FileCheckIcon} />
        <StatCard label="Graded" value={gradedCount} icon={FileCheckIcon} />
        <StatCard label="Feedback" value={feedback.length} icon={MessageSquareIcon} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Assignments</CardTitle>
            <Link
              href="/student/assignments"
              className="text-xs uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
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
                  const graded = mine?.status === "GRADED";
                  return (
                    <li key={a.id} className="flex items-center gap-3 py-3">
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
                      <Button
                        size="sm"
                        variant={graded ? "outline" : "default"}
                        className="h-8 shrink-0"
                        nativeButton={false}
                        render={<Link href={`/student/assignments/${a.id}`} />}
                      >
                        {graded ? "View" : mine ? "Edit" : "Submit"}
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent feedback</CardTitle>
            <Link
              href="/student/submissions"
              className="text-xs uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {feedback.length === 0 ? (
              <p className="text-sm text-muted-foreground">No feedback yet.</p>
            ) : (
              <ul className="flex flex-col gap-4">
                {feedback.map((s) => (
                  <li key={s.id} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/student/assignments/${s.assignmentId}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {s.assignment.title}
                      </Link>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {s.marks}/{s.assignment.maxMarks}
                      </span>
                    </div>
                    {s.feedback ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        &ldquo;{s.feedback}&rdquo;
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <InboxIcon className="size-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            Need help with an assignment? Open it and read the instructions.
          </span>
        </div>
        <Link
          href="/notifications"
          className="text-xs font-medium text-primary underline underline-offset-4"
        >
          View notifications
        </Link>
      </div>
    </div>
  );
}
