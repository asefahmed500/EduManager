import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SimpleForm } from "@/components/admin/simple-form";
import { RowDeleteButton } from "@/components/admin/row-delete-button";
import { EditEntityDialog } from "@/components/admin/edit-entity-dialog";
import { createSubject, deleteSubject, updateSubject } from "@/app/actions/admin";

export default async function AdminSubjects() {
  await requireRole("ADMIN");
  const subjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { classSubjects: true } } },
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Subjects"
        description="Create subjects, then map them to classes."
      />

      <Card>
        <CardHeader>
          <CardTitle>New subject</CardTitle>
        </CardHeader>
        <CardContent>
          <SimpleForm
            action={createSubject}
            fields={[
              { name: "name", label: "Name", placeholder: "e.g. Biology" },
              { name: "code", label: "Code (optional)", placeholder: "BIO" },
            ]}
            submitLabel="Create subject"
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {subjects.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No subjects yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {subjects.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center gap-3 px-4 py-3 md:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.code ? `${s.code} · ` : ""}
                      {s._count.classSubjects} class(es)
                    </p>
                  </div>
                  <EditEntityDialog
                    id={s.id}
                    title="Edit subject"
                    action={updateSubject}
                    fields={[
                      { name: "name", label: "Name", defaultValue: s.name },
                      {
                        name: "code",
                        label: "Code (optional)",
                        defaultValue: s.code ?? "",
                      },
                    ]}
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8">
                        Edit
                      </Button>
                    }
                  />
                  <RowDeleteButton
                    id={s.id}
                    action={deleteSubject}
                    confirmMessage={`Delete subject ${s.name}?`}
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
