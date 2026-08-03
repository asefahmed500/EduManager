import Link from "next/link";
import { notFound } from "next/navigation";
import { FileTextIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { updateAssignment } from "@/app/actions/assignments";
import { toDatetimeLocal } from "@/lib/validations/assignment";

export default async function EditAssignment({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireRole("TEACHER");
  const { id } = await params;

  const assignment = await prisma.assignment.findUnique({
    where: { id: Number(id) },
    include: { class: true, subject: true, _count: { select: { submissions: true } } },
  });
  if (!assignment || assignment.teacherId !== user.id) {
    notFound();
  }

  const tsc = await prisma.teacherSubjectClass.findMany({
    where: { teacherId: user.id },
    include: { classSubject: { include: { class: true, subject: true } } },
  });
  const classSubjects = tsc.map((t) => ({
    id: t.classSubject.id,
    className: t.classSubject.class.name,
    subjectName: t.classSubject.subject.name,
  }));
  const cs = await prisma.classSubject.findFirst({
    where: { classId: assignment.classId, subjectId: assignment.subjectId },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Edit assignment"
        description={`${assignment.class.name} · ${assignment.subject.name}`}
      >
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <Link href={`/teacher/assignments/${assignment.id}/submissions`} />
          }
        >
          <FileTextIcon className="size-4" /> Submissions (
          {assignment._count.submissions})
        </Button>
      </PageHeader>
      <Card>
        <CardContent className="p-6">
          <AssignmentForm
            action={updateAssignment}
            classSubjects={classSubjects}
            defaults={{
              id: assignment.id,
              title: assignment.title,
              description: assignment.description,
              classSubjectId: cs?.id ?? 0,
              deadline: toDatetimeLocal(assignment.deadline),
              maxMarks: assignment.maxMarks,
              allowLate: assignment.allowLate,
            }}
            mode="edit"
          />
        </CardContent>
      </Card>
    </div>
  );
}
