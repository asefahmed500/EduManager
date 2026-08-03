import { cookies } from "next/headers";

import { requireRole } from "@/lib/dal";
import { AppShell } from "@/components/layout/app-shell";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("STUDENT");
  const sidebarCookie = (await cookies()).get("sidebar_state")?.value;
  const defaultOpen = sidebarCookie !== "false";

  return (
    <AppShell user={user} defaultOpen={defaultOpen}>
      {children}
    </AppShell>
  );
}
