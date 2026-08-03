import { PlusIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserFormDialog } from "@/components/admin/user-form-dialog";
import { RowDeleteButton } from "@/components/admin/row-delete-button";
import { ActivateButton } from "@/components/admin/activate-button";
import { deleteUser } from "@/app/actions/admin";

export default async function AdminUsers() {
  await requireRole("ADMIN");
  const [users, classes] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.class.findMany({ orderBy: { name: "asc" } }),
  ]);
  const classMap = new Map(classes.map((c) => [c.id, c.name]));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Users" description="Manage admins, teachers and students.">
        <UserFormDialog
          classes={classes}
          trigger={
            <Button>
              <PlusIcon className="size-4" /> New user
            </Button>
          }
        />
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {users.map((u) => (
              <li
                key={u.id}
                className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-6"
              >
                <div className="min-w-[12rem] flex-1">
                  <p className="truncate text-sm font-medium">
                    {u.name}
                    <span className="text-muted-foreground"> · {u.email}</span>
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {u.role.toLowerCase()}
                    {u.classId
                      ? ` · ${classMap.get(u.classId) ?? "—"}`
                      : ""}
                  </p>
                </div>
                <Badge variant={u.isActive ? "default" : "secondary"}>
                  {u.isActive ? "Active" : "Inactive"}
                </Badge>
                <ActivateButton id={u.id} active={u.isActive} />
                <UserFormDialog
                  user={{
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    role: u.role,
                    classId: u.classId,
                    isActive: u.isActive,
                  }}
                  classes={classes}
                  trigger={<Button variant="ghost" size="sm" className="h-8">Edit</Button>}
                />
                <RowDeleteButton
                  id={u.id}
                  action={deleteUser}
                  confirmMessage={`Delete ${u.name}? This cannot be undone.`}
                />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
