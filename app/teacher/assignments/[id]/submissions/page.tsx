import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DataFilters } from "@/components/layout/data-filters";
import { SubmissionStatusBadge } from "@/components/dashboard/status-badge";
import type { SubmissionStatus } from "@/lib/generated/prisma/client";

const FILTERS = [
  { key: "", label: "All" },
  { key: "SUBMITTED", label: "Submitted" },
  { key: "GRADED", label: "Graded" },
  { key: "LATE", label: "Late" },
  { key: "RETURNED", label: "Returned" },
] as const;

export default async function AssignmentSubmissions({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const user = await requireRole("TEACHER");
  const { id } = await params;
  const sp = await searchParams;

  const assignment = await prisma.assignment.findUnique({
    where: { id: Number(id) },
    include: { class: true, subject: true },
  });
  if (!assignment || assignment.teacherId !== user.id) {
    notFound();
  }

  const status: SubmissionStatus | undefined = FILTERS.some(
    (f) => f.key === sp.status && f.key !== "",
  )
    ? (sp.status as SubmissionStatus)
    : undefined;
  const q = sp.q?.trim();

  const submissions = await prisma.submission.findMany({
    where: {
      assignmentId: assignment.id,
      ...(status ? { status } : {}),
      ...(q
        ? { student: { name: { contains: q, mode: "insensitive" as const } } }
        : {}),
    },
    orderBy: { submittedAt: "desc" },
    include: { student: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Submissions"
        description={`${assignment.title} — ${assignment.class.name} · ${assignment.subject.name}`}
      />

      <DataFilters
        basePath={`/teacher/assignments/${assignment.id}/submissions`}
        searchPlaceholder="Search by student name…"
        filters={[
          {
            key: "status",
            placeholder: "All statuses",
            options: FILTERS.filter((f) => f.key).map((f) => ({
              label: f.label,
              value: f.key,
            })),
          },
        ]}
        current={sp as Record<string, string>}
      />

      <Card>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No submissions{status ? ` with status "${status.toLowerCase()}"` : ""} yet.
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
