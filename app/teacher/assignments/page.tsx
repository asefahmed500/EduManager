import Link from "next/link";
import { format } from "date-fns";
import { PlusIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AssignmentStatusBadge } from "@/components/dashboard/status-badge";
import { AssignmentRowActions } from "@/components/assignments/assignment-row-actions";
import { cn } from "@/lib/utils";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Drafts" },
  { key: "overdue", label: "Overdue" },
] as const;

export default async function TeacherAssignments({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const user = await requireRole("TEACHER");
  const sp = await searchParams;
  const filter = sp.status ?? "all";

  const where = {
    teacherId: user.id,
    ...(filter === "draft"
      ? { status: "DRAFT" as const }
      : filter === "published"
        ? { status: "PUBLISHED" as const }
        : {}),
  };
  let assignments = await prisma.assignment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      class: true,
      subject: true,
      _count: { select: { submissions: true } },
    },
  });
  if (filter === "overdue") {
    const now = new Date();
    assignments = assignments.filter((a) => a.deadline < now);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assignments"
        description="Create, publish and manage your assignments."
      >
        <Button nativeButton={false} render={<Link href="/teacher/assignments/create" />}>
          <PlusIcon className="size-4" /> New assignment
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-1">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Link
              key={f.key}
              href={`/teacher/assignments?status=${f.key}`}
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
          {assignments.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No assignments here yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-4 py-3 md:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/teacher/assignments/${a.id}`}
                      className="font-medium hover:underline"
                    >
                      {a.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.class.name} · {a.subject.name} · due{" "}
                      {format(a.deadline, "d MMM yyyy, HH:mm")}
                    </p>
                  </div>
                  <span className="hidden w-24 text-right text-xs text-muted-foreground tabular-nums sm:inline">
                    {a._count.submissions} submitted
                  </span>
                  <AssignmentStatusBadge status={a.status} />
                  <AssignmentRowActions
                    id={a.id}
                    published={a.status === "PUBLISHED"}
                  />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
