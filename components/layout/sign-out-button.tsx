"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOutIcon } from "lucide-react";

import { SidebarMenuButton } from "@/components/ui/sidebar";
import { notify } from "@/lib/toast";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      notify.success("Signed out.");
      router.push("/login");
      router.refresh();
    } catch {
      notify.error("Could not sign out.");
      setBusy(false);
    }
  }

  return (
    <SidebarMenuButton tooltip="Sign out" onClick={signOut} disabled={busy}>
      <LogOutIcon className="size-4" />
      <span>{busy ? "Signing out…" : "Sign out"}</span>
    </SidebarMenuButton>
  );
}
