"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { notify } from "@/lib/toast";
import { EMPTY_STATE } from "@/lib/forms";
import { createUser, updateUser } from "@/app/actions/admin";

type ClassItem = { id: number; name: string };
type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  classId: number | null;
  isActive: boolean;
};

type Props = {
  user?: UserRow;
  classes: ClassItem[];
  trigger: React.ReactElement;
};

export function UserFormDialog({ user, classes, trigger }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(
    user ? updateUser : createUser,
    EMPTY_STATE,
  );
  const [role, setRole] = React.useState(user?.role ?? "STUDENT");
  const [classId, setClassId] = React.useState(
    user?.classId ? String(user.classId) : "",
  );
  const roleLabels: Record<string, string> = {
    ADMIN: "Administrator",
    TEACHER: "Teacher",
    STUDENT: "Student",
  };
  const classLabels = Object.fromEntries(
    classes.map((c) => [String(c.id), c.name]),
  );

  React.useEffect(() => {
    if (state?.ok) {
      // Closing on async action success is an intentional side-effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      notify.success(user ? "User updated." : "User created.");
      router.refresh();
    } else if (state?.error) {
      notify.error(state.error);
    }
  }, [state, user, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{user ? "Edit user" : "New user"}</DialogTitle>
          <DialogDescription>
            {user ? "Update this account." : "Create a new account."}
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          {user ? (
            <input type="hidden" name="id" value={user.id} />
          ) : null}
          <input type="hidden" name="role" value={role} />
          <input
            type="hidden"
            name="classId"
            value={role === "STUDENT" ? classId : ""}
          />

          <Field>
            <FieldLabel htmlFor="uf-name">Name</FieldLabel>
            <Input
              id="uf-name"
              name="name"
              className="h-10"
              defaultValue={user?.name}
              aria-invalid={!!state?.errors?.name}
            />
            <FieldError>{state?.errors?.name?.[0]}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="uf-email">Email</FieldLabel>
            <Input
              id="uf-email"
              name="email"
              type="email"
              className="h-10"
              defaultValue={user?.email}
              aria-invalid={!!state?.errors?.email}
            />
            <FieldError>{state?.errors?.email?.[0]}</FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor="uf-password">
              {user ? "New password (optional)" : "Password"}
            </FieldLabel>
            <Input
              id="uf-password"
              name="password"
              type="password"
              className="h-10"
              placeholder={user ? "Leave blank to keep current" : "Min 6 characters"}
              aria-invalid={!!state?.errors?.password}
            />
            <FieldError>{state?.errors?.password?.[0]}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Role</FieldLabel>
            <Select value={role} onValueChange={(v) => setRole(v ?? "STUDENT")}>
              <SelectTrigger className="h-10 w-full">
                <SelectValue>
                  {(v) => (v ? roleLabels[v] ?? v : "Select role")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Administrator</SelectItem>
                <SelectItem value="TEACHER">Teacher</SelectItem>
                <SelectItem value="STUDENT">Student</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          {role === "STUDENT" ? (
            <Field>
              <FieldLabel>Class</FieldLabel>
              <Select
                value={classId}
                onValueChange={(v) => setClassId(v ?? "")}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue>
                    {(v) => (v ? classLabels[v] ?? v : "Select class")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {classes.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          <Field orientation="horizontal">
            <Checkbox
              id="uf-active"
              name="isActive"
              defaultChecked={user ? user.isActive : true}
            />
            <FieldLabel htmlFor="uf-active">Active</FieldLabel>
          </Field>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
