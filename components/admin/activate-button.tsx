"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";
import { setUserActive } from "@/app/actions/admin";

export function ActivateButton({
  id,
  active,
}: {
  id: number;
  active: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function toggle() {
    setBusy(true);
    const r = await setUserActive(id, !active);
    setBusy(false);
    if (r?.error) {
      notify.error(r.error);
    } else {
      notify.success(active ? "User deactivated." : "User activated.");
      router.refresh();
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8"
      onClick={toggle}
      disabled={busy}
    >
      {active ? "Deactivate" : "Activate"}
    </Button>
  );
}
