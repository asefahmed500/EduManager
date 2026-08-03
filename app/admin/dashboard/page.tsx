import Link from "next/link";
import { format } from "date-fns";
import {
  BookOpenIcon,
  ClipboardListIcon,
  FileTextIcon,
  GraduationCapIcon,
  UsersIcon,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboard() {
  const [
    users,
    teachers,
    students,
    classes,
    subjects,
    assignments,
    submissions,
    recent,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TEACHER" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.class.count(),
    prisma.subject.count(),
    prisma.assignment.count(),
    prisma.submission.count(),
    prisma.assignment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { class: true, subject: true, teacher: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Dashboard"
        description="System-wide overview of users, classes, assignments and submissions."
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Users" value={users} icon={UsersIcon} />
        <StatCard label="Teachers" value={teachers} icon={UsersIcon} />
        <StatCard label="Students" value={students} icon={UsersIcon} />
        <StatCard label="Classes" value={classes} icon={GraduationCapIcon} />
        <StatCard label="Subjects" value={subjects} icon={BookOpenIcon} />
        <StatCard label="Assignments" value={assignments} icon={ClipboardListIcon} />
        <StatCard label="Submissions" value={submissions} icon={FileTextIcon} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Recent assignments</CardTitle>
          <Link
            href="/admin/assignments"
            className="text-xs uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((a) => (
                <li key={a.id} className="flex items-center gap-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.class.name} · {a.subject.name} · {a.teacher.name}
                    </p>
                  </div>
                  <Badge variant={a.status === "PUBLISHED" ? "default" : "secondary"}>
                    {a.status === "PUBLISHED" ? "Published" : "Draft"}
                  </Badge>
                  <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">
                    {format(a.deadline, "d MMM yyyy")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
