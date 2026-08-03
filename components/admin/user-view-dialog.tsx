"use client";

import * as React from "react";
import { format } from "date-fns";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export type UserViewData = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  className?: string | null;
  createdAt: string | Date;
  submissionCount?: number;
  assignmentCount?: number;
};

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border pb-2 last:border-0 last:pb-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}

export function UserViewDialog({
  user,
  trigger,
}: {
  user: UserViewData;
  trigger: React.ReactElement;
}) {
  const roleLabel =
    user.role.charAt(0) + user.role.slice(1).toLowerCase();
  return (
    <Dialog>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user.name}</DialogTitle>
          <DialogDescription>User profile details</DialogDescription>
        </DialogHeader>
        <dl className="flex flex-col gap-3 pt-1 text-sm">
          <Row label="Email" value={user.email} />
          <Row label="Role" value={roleLabel} />
          <Row
            label="Status"
            value={
              <Badge variant={user.isActive ? "default" : "secondary"}>
                {user.isActive ? "Active" : "Inactive"}
              </Badge>
            }
          />
          <Row label="Class" value={user.className ?? "—"} />
          <Row
            label="Joined"
            value={format(new Date(user.createdAt), "d MMM yyyy")}
          />
          {user.role === "STUDENT" ? (
            <Row label="Submissions" value={user.submissionCount ?? 0} />
          ) : null}
          {user.role === "TEACHER" ? (
            <Row label="Assignments created" value={user.assignmentCount ?? 0} />
          ) : null}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
