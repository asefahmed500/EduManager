import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AssignmentForm } from "@/components/assignments/assignment-form";
import { createAssignment } from "@/app/actions/assignments";

export default async function NewAssignment() {
  const user = await requireRole("TEACHER");
  const tsc = await prisma.teacherSubjectClass.findMany({
    where: { teacherId: user.id },
    include: {
      classSubject: { include: { class: true, subject: true } },
    },
  });
  const classSubjects = tsc.map((t) => ({
    id: t.classSubject.id,
    className: t.classSubject.class.name,
    subjectName: t.classSubject.subject.name,
  }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="New assignment"
        description="Create an assignment for one of your classes."
      />
      <Card>
        <CardContent className="p-6">
          <AssignmentForm
            action={createAssignment}
            classSubjects={classSubjects}
            mode="create"
          />
        </CardContent>
      </Card>
    </div>
  );
}
