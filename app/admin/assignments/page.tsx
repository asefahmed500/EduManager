import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AssignmentStatusBadge } from "@/components/dashboard/status-badge";

export default async function AdminAssignments() {
  await requireRole("ADMIN");
  const assignments = await prisma.assignment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      class: true,
      subject: true,
      teacher: true,
      _count: { select: { submissions: true } },
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Assignments"
        description="Every assignment across the system."
      />
      <Card>
        <CardContent className="p-0">
          {assignments.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No assignments yet.
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
      </Card>
    </div>
  );
}
