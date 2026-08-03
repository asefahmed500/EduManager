"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/toast";
import { EMPTY_STATE, type FormState } from "@/lib/forms";

export type ClassSubjectOption = {
  id: number;
  className: string;
  subjectName: string;
};

export type AssignmentDefaults = {
  id: number;
  title: string;
  description: string;
  classSubjectId: number;
  deadline: string;
  maxMarks: number;
  allowLate: boolean;
};

type Props = {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  classSubjects: ClassSubjectOption[];
  defaults?: AssignmentDefaults;
  mode: "create" | "edit";
};

export function AssignmentForm({
  action,
  classSubjects,
  defaults,
  mode,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, EMPTY_STATE);
  const [classSubjectId, setClassSubjectId] = React.useState(
    String(defaults?.classSubjectId ?? ""),
  );
  const classSubjectLabels = Object.fromEntries(
    classSubjects.map((cs) => [
      String(cs.id),
      `${cs.className} · ${cs.subjectName}`,
    ]),
  );

  React.useEffect(() => {
    if (state?.ok) {
      notify.success(
        mode === "create" ? "Assignment created." : "Changes saved.",
      );
      router.push(
        state.id
          ? `/teacher/assignments/${state.id}`
          : "/teacher/assignments",
      );
      router.refresh();
    } else if (state?.error) {
      notify.error(state.error);
    }
  }, [state, mode, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      {defaults ? (
        <input type="hidden" name="id" value={defaults.id} />
      ) : null}
      <input type="hidden" name="classSubjectId" value={classSubjectId} />

      <Field>
        <FieldLabel htmlFor="title">Title</FieldLabel>
        <Input
          id="title"
          name="title"
          className="h-10"
          defaultValue={defaults?.title}
          placeholder="e.g. Algebra fundamentals worksheet"
          aria-invalid={!!state?.errors?.title}
        />
        <FieldError>{state?.errors?.title?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="description">Description</FieldLabel>
        <Textarea
          id="description"
          name="description"
          className="min-h-36"
          defaultValue={defaults?.description}
          placeholder="Instructions, deliverables, grading notes…"
          aria-invalid={!!state?.errors?.description}
        />
        <FieldError>{state?.errors?.description?.[0]}</FieldError>
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <FieldLabel>Class &amp; subject</FieldLabel>
          <Select
            value={classSubjectId}
            onValueChange={(v) => setClassSubjectId(v ?? "")}
            disabled={classSubjects.length === 0}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue>
                {(v) =>
                  v ? classSubjectLabels[v] ?? v : "Select class & subject"
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {classSubjects.map((cs) => (
                <SelectItem key={cs.id} value={String(cs.id)}>
                  {cs.className} · {cs.subjectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {classSubjects.length === 0 ? (
            <FieldDescription>
              An admin must assign you to a class and subject first.
            </FieldDescription>
          ) : null}
          <FieldError>{state?.errors?.classSubjectId?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="deadline">Deadline</FieldLabel>
          <Input
            id="deadline"
            name="deadline"
            type="datetime-local"
            className="h-10"
            defaultValue={defaults?.deadline}
            aria-invalid={!!state?.errors?.deadline}
          />
          <FieldError>{state?.errors?.deadline?.[0]}</FieldError>
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="maxMarks">Maximum marks</FieldLabel>
          <Input
            id="maxMarks"
            name="maxMarks"
            type="number"
            min={1}
            className="h-10"
            defaultValue={String(defaults?.maxMarks ?? 100)}
            aria-invalid={!!state?.errors?.maxMarks}
          />
          <FieldError>{state?.errors?.maxMarks?.[0]}</FieldError>
        </Field>

        <Field orientation="horizontal" className="mt-7">
          <Checkbox
            id="allowLate"
            name="allowLate"
            defaultChecked={defaults?.allowLate}
          />
          <FieldLabel htmlFor="allowLate">Allow late submissions</FieldLabel>
        </Field>
      </div>

      <div className="flex flex-col gap-2 border-t border-border pt-5 sm:flex-row sm:justify-end">
        <Button
          type="submit"
          name="intent"
          value="draft"
          variant="outline"
          className="h-10"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save as draft"}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="publish"
          className="h-10"
          disabled={pending}
        >
          {pending
            ? "Saving…"
            : mode === "edit"
              ? "Save & publish"
              : "Publish"}
        </Button>
      </div>
    </form>
  );
}
