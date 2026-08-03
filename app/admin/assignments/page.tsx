import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { buildUrl } from "@/lib/url";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { DataFilters } from "@/components/layout/data-filters";
import { Pagination } from "@/components/layout/pagination";
import { AssignmentStatusBadge } from "@/components/dashboard/status-badge";

const PER_PAGE = 10;

export default async function AdminAssignments({
  searchParams,
}: {
  searchParams: Promise<{
    classId?: string;
    subjectId?: string;
    teacherId?: string;
    q?: string;
    page?: string;
  }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const classId = sp.classId && !isNaN(Number(sp.classId)) ? Number(sp.classId) : undefined;
  const subjectId =
    sp.subjectId && !isNaN(Number(sp.subjectId)) ? Number(sp.subjectId) : undefined;
  const teacherId =
    sp.teacherId && !isNaN(Number(sp.teacherId)) ? Number(sp.teacherId) : undefined;
  const q = sp.q?.trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where = {
    ...(classId ? { classId } : {}),
    ...(subjectId ? { subjectId } : {}),
    ...(teacherId ? { teacherId } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [assignments, classes, subjects, teachers, total] = await Promise.all([
    prisma.assignment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: {
        class: true,
        subject: true,
        teacher: true,
        _count: { select: { submissions: true } },
      },
    }),
    prisma.class.findMany({ orderBy: { name: "asc" } }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { name: "asc" },
    }),
    prisma.assignment.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const params = new URLSearchParams(sp);
  const makeHref = (p: number) =>
    buildUrl("/admin/assignments", params, { page: String(p) });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assignments"
        description="Every assignment across the system."
      />

      <DataFilters
        basePath="/admin/assignments"
        searchPlaceholder="Search by title…"
        filters={[
          {
            key: "classId",
            placeholder: "All classes",
            options: classes.map((c) => ({
              label: c.name,
              value: String(c.id),
            })),
          },
          {
            key: "subjectId",
            placeholder: "All subjects",
            options: subjects.map((s) => ({
              label: s.name,
              value: String(s.id),
            })),
          },
          {
            key: "teacherId",
            placeholder: "All teachers",
            options: teachers.map((t) => ({
              label: t.name,
              value: String(t.id),
            })),
          },
        ]}
        current={sp as Record<string, string>}
      />

      <Card>
        <CardContent className="p-0">
          {assignments.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No assignments match these filters.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {assignments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center gap-3 px-4 py-3 md:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.class.name} · {a.subject.name} · by {a.teacher.name} ·
                      due {format(a.deadline, "d MMM yyyy")}
                    </p>
                  </div>
                  <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                    {a._count.submissions} subs
                  </span>
                  <AssignmentStatusBadge status={a.status} />
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
