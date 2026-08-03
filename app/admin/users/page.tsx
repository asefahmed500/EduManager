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
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/generated/prisma/client";

const ROLES = ["ADMIN", "TEACHER", "STUDENT"] as const;

function buildUrl(
  current: URLSearchParams,
  overrides: Record<string, string>,
): string {
  const p = new URLSearchParams(current);
  for (const [key, value] of Object.entries(overrides)) {
    if (value) p.set(key, value);
    else p.delete(key);
  }
  const s = p.toString();
  return s ? `/admin/users?${s}` : "/admin/users";
}

function FilterChip({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted",
      )}
    >
      {children}
    </a>
  );
}

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string; q?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const role: Role | undefined = ROLES.includes(sp.role as Role)
    ? (sp.role as Role)
    : undefined;
  const status =
    sp.status === "active" || sp.status === "inactive" ? sp.status : undefined;
  const q = sp.q?.trim();

  const where = {
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

  const [users, classes] = await Promise.all([
    prisma.user.findMany({ where, orderBy: { createdAt: "desc" } }),
    prisma.class.findMany({ orderBy: { name: "asc" } }),
  ]);
  const classMap = new Map(classes.map((c) => [c.id, c.name]));
  const params = new URLSearchParams(sp);

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

      <div className="flex flex-col gap-3">
        <form method="get" className="flex w-full max-w-md items-center gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name or email…"
            className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <Button type="submit" variant="outline" className="h-9">
            Search
          </Button>
          {q ? (
            <Button
              type="submit"
              variant="ghost"
              className="h-9"
              name="q"
              value=""
            >
              Clear
            </Button>
          ) : null}
        </form>

        <div className="flex flex-wrap gap-1">
          <FilterChip
            href={buildUrl(params, { role: "" })}
            active={!role}
          >
            All roles
          </FilterChip>
          {ROLES.map((r) => (
            <FilterChip
              key={r}
              href={buildUrl(params, { role: r })}
              active={role === r}
            >
              {r.charAt(0) + r.slice(1).toLowerCase()}
            </FilterChip>
          ))}
        </div>

        <div className="flex flex-wrap gap-1">
          <FilterChip
            href={buildUrl(params, { status: "" })}
            active={!status}
          >
            All statuses
          </FilterChip>
          <FilterChip
            href={buildUrl(params, { status: "active" })}
            active={status === "active"}
          >
            Active
          </FilterChip>
          <FilterChip
            href={buildUrl(params, { status: "inactive" })}
            active={status === "inactive"}
          >
            Inactive
          </FilterChip>
        </div>
      </div>

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
                    confirmMessage={`Delete ${u.name}? This cannot be undone.`}
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
