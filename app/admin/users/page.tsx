import { PlusIcon } from "lucide-react";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/dal";
import { buildUrl } from "@/lib/url";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataFilters } from "@/components/layout/data-filters";
import { Pagination } from "@/components/layout/pagination";
import { UserFormDialog } from "@/components/admin/user-form-dialog";
import { RowDeleteButton } from "@/components/admin/row-delete-button";
import { ActivateButton } from "@/components/admin/activate-button";
import { deleteUser } from "@/app/actions/admin";
import type { Role } from "@/lib/generated/prisma/client";

const ROLES = ["ADMIN", "TEACHER", "STUDENT"] as const;
const PER_PAGE = 10;

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string; q?: string; page?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const role: Role | undefined = ROLES.includes(sp.role as Role)
    ? (sp.role as Role)
    : undefined;
  const status =
    sp.status === "active" || sp.status === "inactive" ? sp.status : undefined;
  const q = sp.q?.trim();
  const page = Math.max(1, Number(sp.page) || 1);

  const where = {
    isDeleted: false,
    ...(role ? { role } : {}),
    ...(status === "active"
      ? { isActive: true }
      : status === "inactive"
        ? { isActive: false }
        : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [users, classes, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    prisma.class.findMany({ orderBy: { name: "asc" } }),
    prisma.user.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const params = new URLSearchParams(sp);
  const makeHref = (p: number) =>
    buildUrl("/admin/users", params, { page: String(p) });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Users"
        description="Manage admins, teachers and students."
      >
        <UserFormDialog
          classes={classes}
          trigger={
            <Button>
              <PlusIcon className="size-4" /> New user
            </Button>
          }
        />
      </PageHeader>

      <DataFilters
        basePath="/admin/users"
        searchPlaceholder="Search by name or email…"
        filters={[
          {
            key: "role",
            placeholder: "All roles",
            options: ROLES.map((r) => ({
              label: r.charAt(0) + r.slice(1).toLowerCase(),
              value: r,
            })),
          },
          {
            key: "status",
            placeholder: "All statuses",
            options: [
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
            ],
          },
        ]}
        current={sp as Record<string, string>}
      />

      <Card>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No users match these filters.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li
                  key={u.id}
                  className="flex flex-wrap items-center gap-2 px-4 py-3 md:px-6"
                >
                  <div className="min-w-[12rem] flex-1">
                    <p className="truncate text-sm font-medium">
                      {u.name}
                      <span className="text-muted-foreground">
                        {" "}
                        · {u.email}
                      </span>
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
                    trigger={
                      <Button variant="ghost" size="sm" className="h-8">
                        Edit
                      </Button>
                    }
                  />
                  <RowDeleteButton
                    id={u.id}
                    action={deleteUser}
                    confirmMessage={`Delete ${u.name}? This account will be deactivated.`}
                  />
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
