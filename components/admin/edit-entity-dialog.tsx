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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";
import { EMPTY_STATE, type FormState } from "@/lib/forms";

type Field = {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
};

type Props = {
  id: number;
  title: string;
  description?: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  fields: Field[];
  trigger: React.ReactElement;
};

export function EditEntityDialog({
  id,
  title,
  description,
  action,
  fields,
  trigger,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);

  React.useEffect(() => {
    if (state?.ok) {
      // Closing on async action success is an intentional side-effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
      notify.success("Saved.");
      router.refresh();
    } else if (state?.error) {
      notify.error(state.error);
    }
  }, [state, router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="id" value={id} />
          {fields.map((f) => (
            <Field key={f.name}>
              <FieldLabel htmlFor={`ef-${f.name}`}>{f.label}</FieldLabel>
              <Input
                id={`ef-${f.name}`}
                name={f.name}
                className="h-10"
                defaultValue={f.defaultValue}
                placeholder={f.placeholder}
                aria-invalid={!!state?.errors?.[f.name]}
              />
              <FieldError>{state?.errors?.[f.name]?.[0]}</FieldError>
            </Field>
          ))}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
