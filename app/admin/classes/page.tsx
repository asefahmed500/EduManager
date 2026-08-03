import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleForm } from "@/components/admin/simple-form";
import { RowDeleteButton } from "@/components/admin/row-delete-button";
import { EditEntityDialog } from "@/components/admin/edit-entity-dialog";
import { ClassManager } from "@/components/admin/class-manager";
import { createClass, deleteClass, updateClass } from "@/app/actions/admin";

export default async function AdminClasses() {
  await requireRole("ADMIN");
  const [classes, subjects, teachers] = await Promise.all([
    prisma.class.findMany({
      orderBy: { name: "asc" },
      include: {
        classSubjects: {
          include: {
            subject: true,
            teachers: { include: { teacher: true } },
          },
        },
        _count: { select: { students: true } },
      },
    }),
    prisma.subject.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({
      where: { role: "TEACHER" },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Classes"
        description="Create classes, map subjects, and assign teachers."
      />

      <Card>
        <CardHeader>
          <CardTitle>New class</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleForm
            action={createClass}
            fields={[
              { name: "name", label: "Name", placeholder: "e.g. Grade 11 - B" },
              { name: "description", label: "Description (optional)" },
            ]}
            submitLabel="Create class"
          />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        {classes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No classes yet.</p>
        ) : null}
        {classes.map((c) => (
          <Card key={c.id}>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>{c.name}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {c.description ?? "—"} · {c._count.students} students
                </p>
              </div>
              <div className="flex items-center gap-1">
                <EditEntityDialog
                  id={c.id}
                  title="Edit class"
                  action={updateClass}
                  fields={[
                    { name: "name", label: "Name", defaultValue: c.name },
                    {
                      name: "description",
                      label: "Description (optional)",
                      defaultValue: c.description ?? "",
                    },
                  ]}
                  trigger={
                    <Button variant="ghost" size="sm" className="h-8">
                      Edit
                    </Button>
                  }
                />
                <RowDeleteButton
                  id={c.id}
                  action={deleteClass}
                  confirmMessage={`Delete class ${c.name}?`}
                />
              </div>
            </CardHeader>
            <CardContent>
              <ClassManager
                classId={c.id}
                subjects={subjects.map((s) => ({ id: s.id, name: s.name }))}
                teachers={teachers.map((t) => ({ id: t.id, name: t.name }))}
                rows={c.classSubjects.map((cs) => ({
                  id: cs.id,
                  subjectId: cs.subjectId,
                  subjectName: cs.subject.name,
                  teachers: cs.teachers.map((t) => ({
                    id: t.id,
                    teacherName: t.teacher.name,
                  })),
                }))}
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
