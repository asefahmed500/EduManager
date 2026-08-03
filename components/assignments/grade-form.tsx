"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/toast";
import { EMPTY_STATE } from "@/lib/forms";
import { gradeSubmission } from "@/app/actions/submissions";

type Props = {
  submissionId: number;
  maxMarks: number;
  defaults: {
    marks?: number | null;
    feedback?: string | null;
    status: string;
  };
};

export function GradeForm({ submissionId, maxMarks, defaults }: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    gradeSubmission,
    EMPTY_STATE,
  );
  const [status, setStatus] = React.useState(defaults.status);

  React.useEffect(() => {
    if (state?.ok) {
      notify.success("Grade saved.");
      router.refresh();
    } else if (state?.error) {
      notify.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="submissionId" value={submissionId} />
      <input type="hidden" name="status" value={status} />

      <div className="grid gap-5 md:grid-cols-2">
        <Field>
          <FieldLabel htmlFor="marks">Marks (out of {maxMarks})</FieldLabel>
          <Input
            id="marks"
            name="marks"
            type="number"
            min={0}
            max={maxMarks}
            className="h-10"
            defaultValue={String(defaults.marks ?? 0)}
            aria-invalid={!!state?.errors?.marks}
          />
          <FieldError>{state?.errors?.marks?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel>Status</FieldLabel>
          <Select
            value={status}
            onValueChange={(v) => setStatus(v ?? "GRADED")}
          >
            <SelectTrigger className="h-10 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GRADED">Graded</SelectItem>
              <SelectItem value="RETURNED">Returned</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="LATE">Late</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor="feedback">Feedback</FieldLabel>
        <Textarea
          id="feedback"
          name="feedback"
          className="min-h-28"
          defaultValue={defaults.feedback ?? ""}
          placeholder="Constructive feedback for the student…"
        />
      </Field>

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" className="h-10" disabled={pending}>
          {pending ? "Saving…" : "Save grade"}
        </Button>
      </div>
    </form>
  );
}
