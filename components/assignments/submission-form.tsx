"use client";

import * as React from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { notify } from "@/lib/toast";
import { EMPTY_STATE } from "@/lib/forms";
import { submitAssignment } from "@/app/actions/submissions";

type Props = {
  assignmentId: number;
  maxUploadMb: number;
  existing?: {
    answer: string;
    fileUrl?: string | null;
  };
};

export function SubmissionForm({
  assignmentId,
  maxUploadMb,
  existing,
}: Props) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    submitAssignment,
    EMPTY_STATE,
  );

  React.useEffect(() => {
    if (state?.ok) {
      notify.success("Submission saved.");
      router.refresh();
    } else if (state?.error) {
      notify.error(state.error);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="assignmentId" value={assignmentId} />

      <Field>
        <FieldLabel htmlFor="answer">Your answer</FieldLabel>
        <Textarea
          id="answer"
          name="answer"
          className="min-h-40"
          defaultValue={existing?.answer}
          placeholder="Write your answer here…"
        />
        <FieldError>{state?.errors?.answer?.[0]}</FieldError>
      </Field>

      <Field>
        <FieldLabel htmlFor="file">Attach a file (optional)</FieldLabel>
        <Input
          id="file"
          name="file"
          type="file"
          className="h-10 cursor-pointer"
        />
        <FieldDescription>
          Max {maxUploadMb}MB · PDF, DOC, TXT, images, ZIP.
        </FieldDescription>
        {existing?.fileUrl ? (
          <FieldDescription>
            Current:{" "}
            <a
              className="underline underline-offset-4"
              href={existing.fileUrl}
              target="_blank"
              rel="noreferrer"
            >
              view file
            </a>
          </FieldDescription>
        ) : null}
        <FieldError>{state?.error}</FieldError>
      </Field>

      <div className="flex justify-end border-t border-border pt-5">
        <Button type="submit" className="h-10" disabled={pending}>
          {pending
            ? "Saving…"
            : existing
              ? "Update submission"
              : "Submit work"}
        </Button>
      </div>
    </form>
  );
}
