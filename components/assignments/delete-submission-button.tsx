"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { deleteSubmission } from "@/app/actions/submissions";

export function DeleteSubmissionButton({
  submissionId,
}: {
  submissionId: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function run() {
    if (
      !window.confirm(
        "Delete this submission? This cannot be undone.",
      )
    ) {
      return;
    }
    setBusy(true);
    const result = await deleteSubmission(submissionId);
    setBusy(false);
    if (result?.error) {
      notify.error(result.error);
    } else {
      notify.success("Submission deleted.");
      router.refresh();
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 text-destructive"
      onClick={run}
      disabled={busy}
    >
      <Trash2Icon className="size-4" />
      {busy ? "Deleting…" : "Delete submission"}
    </Button>
  );
}
