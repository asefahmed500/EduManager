"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";
import { EMPTY_STATE } from "@/lib/forms";
import { updateProfile } from "@/app/actions/profile";

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; email: string };
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updateProfile,
    EMPTY_STATE,
  );

  React.useEffect(() => {
    if (state?.ok) {
      notify.success("Profile updated.");
      router.refresh();
    } else if (state?.error) {
      notify.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Field>
        <FieldLabel htmlFor="pf-name">Full name</FieldLabel>
        <Input
          id="pf-name"
          name="name"
          className="h-10"
          defaultValue={defaults.name}
          aria-invalid={!!state?.errors?.name}
        />
        <FieldError>{state?.errors?.name?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="pf-email">Email</FieldLabel>
        <Input
          id="pf-email"
          name="email"
          type="email"
          className="h-10"
          defaultValue={defaults.email}
          aria-invalid={!!state?.errors?.email}
        />
        <FieldError>{state?.errors?.email?.[0]}</FieldError>
      </Field>

      <div className="flex flex-col gap-4 border-t border-border pt-4">
        <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
          Change password (optional)
        </p>
        <Field>
          <FieldLabel htmlFor="pf-current">Current password</FieldLabel>
          <Input
            id="pf-current"
            name="currentPassword"
            type="password"
            className="h-10"
            placeholder="Leave blank to keep your password"
            aria-invalid={!!state?.errors?.currentPassword}
          />
          <FieldError>{state?.errors?.currentPassword?.[0]}</FieldError>
        </Field>
        <Field>
          <FieldLabel htmlFor="pf-new">New password</FieldLabel>
          <Input
            id="pf-new"
            name="newPassword"
            type="password"
            className="h-10"
            placeholder="Min 6 characters"
            aria-invalid={!!state?.errors?.newPassword}
          />
          <FieldError>{state?.errors?.newPassword?.[0]}</FieldError>
        </Field>
      </div>

      <Button type="submit" className="h-10 w-fit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
