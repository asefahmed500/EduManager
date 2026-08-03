import Link from "next/link";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { buildUrl } from "@/lib/url";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DataFilters } from "@/components/layout/data-filters";
import { Pagination } from "@/components/layout/pagination";
import { SubmissionStatusBadge } from "@/components/dashboard/status-badge";
import type { SubmissionStatus } from "@/lib/generated/prisma/client";

const PER_PAGE = 10;

const STATUSES: { label: string; value: SubmissionStatus }[] = [
  { label: "Submitted", value: "SUBMITTED" },
  { label: "Graded", value: "GRADED" },
  { label: "Late", value: "LATE" },
  { label: "Returned", value: "RETURNED" },
];

export default async function AdminSubmissions({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const status = STATUSES.some((s) => s.value === sp.status)
    ? (sp.status as SubmissionStatus)
    : undefined;
  const page = Math.max(1, Number(sp.page) || 1);

  const where = { ...(status ? { status } : {}) };

  const [submissions, total] = await Promise.all([
    prisma.submission.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        student: true,
        assignment: { include: { subject: true } },
      },
    }),
    prisma.submission.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const params = new URLSearchParams(sp);
  const makeHref = (p: number) =>
    buildUrl("/admin/submissions", params, { page: String(p) });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Submissions"
        description="Every submission across the system."
      />

      <DataFilters
        basePath="/admin/submissions"
        filters={[
          {
            key: "status",
            placeholder: "All statuses",
            options: STATUSES.map((s) => ({ label: s.label, value: s.value })),
          },
        ]}
        current={sp as Record<string, string>}
      />

      <Card>
        <CardContent className="p-0">
          {submissions.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No submissions match these filters.
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
                      <Link
                        href={`/admin/assignments/${s.assignmentId}`}
                        className="hover:underline"
                      >
                        {s.assignment.title}
                      </Link>{" "}
                      · {s.assignment.subject.name}
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
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={total}
          makeHref={makeHref}
        />
      </Card>
    </div>
  );
}
