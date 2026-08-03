import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/dal";
import { ROLE_LABEL } from "@/lib/roles";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm } from "@/components/profile/profile-form";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3 text-center">
      <p className="font-serif text-2xl tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export async function ProfileView() {
  const user = await requireUser();

  const [me, unread] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: { createdAt: true },
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  let stats: { label: string; value: number }[] = [];
  let className: string | null = null;

  if (user.role === "ADMIN") {
    const [users, classes, subjects, assignments, submissions] =
      await Promise.all([
        prisma.user.count(),
        prisma.class.count(),
        prisma.subject.count(),
        prisma.assignment.count(),
        prisma.submission.count(),
      ]);
    stats = [
      { label: "Users", value: users },
      { label: "Classes", value: classes },
      { label: "Subjects", value: subjects },
      { label: "Assignments", value: assignments },
      { label: "Submissions", value: submissions },
      { label: "Unread", value: unread },
    ];
  } else if (user.role === "TEACHER") {
    const [assignments, published, pendingGrading, assigned] =
      await Promise.all([
        prisma.assignment.count({ where: { teacherId: user.id } }),
        prisma.assignment.count({
          where: { teacherId: user.id, status: "PUBLISHED" },
        }),
        prisma.submission.count({
          where: { assignment: { teacherId: user.id }, status: "SUBMITTED" },
        }),
        prisma.teacherSubjectClass.count({ where: { teacherId: user.id } }),
      ]);
    stats = [
      { label: "Assignments", value: assignments },
      { label: "Published", value: published },
      { label: "Awaiting grading", value: pendingGrading },
      { label: "Class & subject pairs", value: assigned },
      { label: "Unread", value: unread },
    ];
  } else {
    const [submissions, graded, cls] = await Promise.all([
      prisma.submission.count({ where: { studentId: user.id } }),
      prisma.submission.count({
        where: { studentId: user.id, status: "GRADED" },
      }),
      user.classId
        ? prisma.class.findUnique({ where: { id: user.classId } })
        : null,
    ]);
    className = cls?.name ?? null;
    stats = [
      { label: "Submissions", value: submissions },
      { label: "Graded", value: graded },
      { label: "Unread", value: unread },
    ];
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Profile"
        description="Your account details, statistics and settings."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="gap-0">
            <CardContent className="flex items-center gap-4 p-6">
              <Avatar size="lg">
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-serif text-xl tracking-tight">{user.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {user.email}
                </p>
              </div>
              <Badge className="ml-auto shrink-0">
                {ROLE_LABEL[user.role]}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <dl className="flex flex-col gap-3">
                <Row label="Role" value={ROLE_LABEL[user.role]} />
                <Row
                  label="Status"
                  value={user.isActive ? "Active" : "Inactive"}
                />
                <Row label="Class" value={className ?? "—"} />
                <Row
                  label="Joined"
                  value={
                    me?.createdAt
                      ? format(new Date(me.createdAt), "d MMM yyyy")
                      : "—"
                  }
                />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {stats.map((s) => (
                  <Stat key={s.label} label={s.label} value={s.value} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileForm defaults={{ name: user.name, email: user.email }} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
