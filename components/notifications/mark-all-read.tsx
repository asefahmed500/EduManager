"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { notify } from "@/lib/toast";

export function MarkAllReadButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function markAllRead() {
    setBusy(true);
    await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("failed");
        notify.success("All notifications marked as read.");
        router.refresh();
      })
      .catch(() => notify.error("Could not update notifications."))
      .finally(() => setBusy(false));
  }

  return (
    <Button variant="outline" className="h-9" onClick={markAllRead} disabled={busy}>
      {busy ? "Updating…" : "Mark all read"}
    </Button>
  );
}
