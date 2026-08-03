import Link from "next/link";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SubmissionStatusBadge } from "@/components/dashboard/status-badge";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "past", label: "Past" },
  { key: "graded", label: "Graded" },
] as const;

export default async function StudentAssignments({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await requireRole("STUDENT");
  const sp = await searchParams;
  const filter = FILTERS.some((f) => f.key === sp.status)
    ? (sp.status as string)
    : "all";
  const q = sp.q?.trim();

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
    where: {
      classId: user.classId,
      status: "PUBLISHED",
      ...(q
        ? { title: { contains: q, mode: "insensitive" as const } }
        : {}),
    },
    orderBy: { deadline: "asc" },
    include: {
      subject: true,
      submissions: { where: { studentId: user.id } },
    },
  });

  const now = new Date();
  let filtered = assignments;
  if (filter === "past") {
    filtered = assignments.filter((a) => a.deadline < now);
  } else if (filter === "graded") {
    filtered = assignments.filter(
      (a) => a.submissions[0]?.status === "GRADED",
    );
  } else if (filter === "active") {
    filtered = assignments.filter(
      (a) =>
        a.deadline >= now && a.submissions[0]?.status !== "GRADED",
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assignments"
        description="Published assignments for your class."
      />

      <form method="get" className="flex w-full max-w-md items-center gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by title…"
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button type="submit" variant="outline" className="h-9">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={
                f.key === "all"
                  ? "/student/assignments"
                  : `/student/assignments?status=${f.key}`
              }
              className={cn(
                "rounded-md px-3 py-1.5 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No assignments match this filter.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((a) => {
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
