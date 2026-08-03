"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";
import { EMPTY_STATE, type FormState } from "@/lib/forms";

type FieldDef = {
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
};

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  fields: FieldDef[];
  submitLabel?: string;
};

export function SimpleForm({ action, fields, submitLabel = "Add" }: Props) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);

  React.useEffect(() => {
    if (state?.ok) {
      notify.success("Saved.");
      formRef.current?.reset();
      router.refresh();
    } else if (state?.error) {
      notify.error(state.error);
    }
  }, [state, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3"
    >
      {fields.map((f) => (
        <Field key={f.name} className="min-w-40 flex-1">
          <FieldLabel htmlFor={`sf-${f.name}`}>{f.label}</FieldLabel>
          <Input
            id={`sf-${f.name}`}
            name={f.name}
            type={f.type ?? "text"}
            className="h-10"
            placeholder={f.placeholder}
            aria-invalid={!!state?.errors?.[f.name]}
          />
          <FieldError>{state?.errors?.[f.name]?.[0]}</FieldError>
        </Field>
      ))}
      <Button type="submit" className="h-10" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
