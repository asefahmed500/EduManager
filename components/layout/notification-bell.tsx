"use client";

import * as React from "react";
import Link from "next/link";
import { BellIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Item = {
  id: number;
  title: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
};

export function NotificationBell() {
  const [unread, setUnread] = React.useState(0);
  const [items, setItems] = React.useState<Item[]>([]);
  const [open, setOpen] = React.useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setUnread(data.unreadCount ?? 0);
        setItems(data.items ?? []);
      }
    } catch {
      // ignore
    }
  }

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setUnread(data.unreadCount ?? 0);
        setItems(data.items ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Mark notifications read once the menu is opened.
      await fetch("/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }).catch(() => {});
      refresh();
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative"
            aria-label="Notifications"
          />
        }
      >
        <BellIcon className="size-4" />
        {unread > 0 ? (
          <span className="absolute top-1 right-1 flex size-3.5 items-center justify-center rounded-full bg-destructive text-[0.55rem] font-semibold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <div className="px-2 py-1.5 text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Notifications
          </div>
        </DropdownMenuGroup>
        {items.length === 0 ? (
          <div className="px-2 py-5 text-center text-sm text-muted-foreground">
            Nothing here yet.
          </div>
        ) : (
          items.map((n) => (
            <DropdownMenuGroup key={n.id}>
              <Link
                href={n.link ?? "/notifications"}
                className="flex flex-col gap-0.5 rounded-md px-2 py-2 hover:bg-muted"
              >
                <span className="text-sm font-medium">{n.title}</span>
                <span className="line-clamp-2 text-xs text-muted-foreground">
                  {n.message}
                </span>
              </Link>
            </DropdownMenuGroup>
          ))
        )}
        <DropdownMenuGroup>
          <Link
            href="/notifications"
            className="block rounded-md px-2 py-2 text-center text-xs font-medium text-primary underline underline-offset-4 hover:bg-muted"
          >
            View all notifications
          </Link>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
