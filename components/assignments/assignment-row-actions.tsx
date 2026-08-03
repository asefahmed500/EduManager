"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CopyIcon,
  EyeIcon,
  MoreHorizontalIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import {
  deleteAssignment,
  duplicateAssignment,
  togglePublish,
} from "@/app/actions/assignments";

type Props = {
  id: number;
  published: boolean;
};

export function AssignmentRowActions({ id, published }: Props) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function run(
    fn: (id: number) => Promise<{ ok?: boolean; error?: string }>,
    okMessage: string,
  ) {
    setBusy(true);
    const result = await fn(id);
    setBusy(false);
    if (result?.error) {
      notify.error(result.error);
    } else {
      notify.success(okMessage);
      router.refresh();
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="More actions"
            title="More actions"
          />
        }
        disabled={busy}
      >
        <MoreHorizontalIcon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => router.push(`/teacher/assignments/${id}`)}>
          <EyeIcon className="size-4" /> View / edit
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            run(
              togglePublish,
              published ? "Moved to drafts." : "Assignment published.",
            )
          }
        >
          <SendIcon className="size-4" />
          {published ? "Unpublish" : "Publish"}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            run(duplicateAssignment, "Assignment duplicated as a draft.");
          }}
        >
          <CopyIcon className="size-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            if (window.confirm("Delete this assignment? This cannot be undone.")) {
              run(deleteAssignment, "Assignment deleted.");
            }
          }}
        >
          <Trash2Icon className="size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
