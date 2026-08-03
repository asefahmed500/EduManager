"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

type Props = {
  id: number;
  action: (id: number) => Promise<{ ok?: boolean; error?: string }>;
  confirmMessage?: string;
};

export function RowDeleteButton({
  id,
  action,
  confirmMessage = "Are you sure you want to delete this?",
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function run() {
    if (!window.confirm(confirmMessage)) return;
    setBusy(true);
    const result = await action(id);
    setBusy(false);
    if (result?.error) {
      notify.error(result.error);
    } else {
      notify.success("Deleted.");
      router.refresh();
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={run}
      disabled={busy}
      aria-label="Delete"
    >
      <Trash2Icon className="size-4" />
    </Button>
  );
}
