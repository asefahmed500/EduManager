"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpenIcon,
  ClipboardListIcon,
  FileTextIcon,
  GraduationCapIcon,
  InboxIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UsersIcon,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ROLE_DASHBOARD, ROLE_LABEL } from "@/lib/roles";
import type { CurrentUser } from "@/lib/dal";

type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
};

type NavGroup = {
  label?: string;
  items: NavItem[];
};

const NAV: Record<string, NavGroup[]> = {
  ADMIN: [
    {
      label: "Management",
      items: [
        { title: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboardIcon },
        { title: "Users", href: "/admin/users", icon: UsersIcon },
        { title: "Classes", href: "/admin/classes", icon: GraduationCapIcon },
        { title: "Subjects", href: "/admin/subjects", icon: BookOpenIcon },
      ],
    },
    {
      label: "Overview",
      items: [
        { title: "Assignments", href: "/admin/assignments", icon: ClipboardListIcon },
        { title: "Submissions", href: "/admin/submissions", icon: FileTextIcon },
        { title: "Settings", href: "/admin/settings", icon: SettingsIcon },
      ],
    },
  ],
  TEACHER: [
    {
      items: [
        { title: "Dashboard", href: "/teacher/dashboard", icon: LayoutDashboardIcon },
        { title: "Assignments", href: "/teacher/assignments", icon: ClipboardListIcon },
      ],
    },
  ],
  STUDENT: [
    {
      items: [
        { title: "Dashboard", href: "/student/dashboard", icon: LayoutDashboardIcon },
        { title: "Assignments", href: "/student/assignments", icon: ClipboardListIcon },
        { title: "My Submissions", href: "/student/submissions", icon: InboxIcon },
      ],
    },
  ],
};

function AppSidebar({ role }: { role: CurrentUser["role"] }) {
  const pathname = usePathname();
  const groups = NAV[role] ?? [];

  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="gap-2.5"
              render={<Link href={ROLE_DASHBOARD[role]} />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary font-serif text-base text-primary-foreground">
                E
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-serif text-base tracking-tight">
                  EduManager
                </span>
                <span className="text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
                  {ROLE_LABEL[role]}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((group, index) => (
          <SidebarGroup key={index}>
            {group.label ? (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            ) : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        render={<Link href={item.href} />}
                      >
                        <Icon className="size-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SignOutButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

type AppShellProps = {
  user: CurrentUser;
  defaultOpen: boolean;
  children: React.ReactNode;
};

export function AppShell({ user, defaultOpen, children }: AppShellProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar role={user.role} />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-border bg-background/85 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
          <SidebarTrigger />
          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <ThemeToggle />
            <UserMenu
              name={user.name}
              email={user.email}
              role={user.role}
            />
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-6 md:py-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
