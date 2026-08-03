import Link from "next/link";
import { format } from "date-fns";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/dal";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { MarkAllReadButton } from "@/components/notifications/mark-all-read";
import { cn } from "@/lib/utils";

export default async function NotificationsPage() {
  const user = await requireUser();
  const [notifications, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 60,
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Notifications"
        description={
          unread > 0
            ? `You have ${unread} unread notification${unread > 1 ? "s" : ""}.`
            : "You're all caught up."
        }
      >
        {unread > 0 ? <MarkAllReadButton /> : null}
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <p className="p-10 text-center text-sm text-muted-foreground">
              No notifications yet.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "flex flex-wrap items-center gap-3 px-4 py-3 md:px-6",
                    !n.read && "bg-muted/50",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.message}</p>
                  </div>
                  {n.link ? (
                    <Link
                      href={n.link}
                      className="text-xs text-primary underline underline-offset-4"
                    >
                      View
                    </Link>
                  ) : null}
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {format(n.createdAt, "d MMM, HH:mm")}
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
