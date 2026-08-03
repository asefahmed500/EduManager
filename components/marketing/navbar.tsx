"use client";

import * as React from "react";
import Link from "next/link";
import { MenuIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Features", href: "/#features" },
  { label: "Roles", href: "/#roles" },
  { label: "How it works", href: "/#how-it-works" },
];

type Props = {
  authed: boolean;
  dashboardHref: string;
};

export function MarketingNavbar({ authed, dashboardHref }: Props) {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full px-4 pt-4">
      <div
        className={cn(
          "mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 rounded-xl border px-5 transition-all duration-300",
          scrolled
            ? "border-border bg-background/90 shadow-[0_2px_12px_rgba(0,0,0,0.08)] backdrop-blur"
            : "border-border/50 bg-background/70 backdrop-blur",
        )}
      >
        <Link
          href="/"
          className="font-serif text-lg tracking-tight"
          aria-label="EduManager home"
        >
          EduManager
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {authed ? (
            <Button nativeButton={false} render={<Link href={dashboardHref} />}>Go to dashboard</Button>
          ) : (
            <>
              <Button nativeButton={false} variant="ghost" render={<Link href="/login" />}>
                Log in
              </Button>
              <Button nativeButton={false} render={<Link href="/login" />}>Get started</Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="-mr-2 inline-flex size-9 items-center justify-center md:hidden"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-md px-2 py-2 text-sm text-muted-foreground hover:bg-muted"
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2">
              {authed ? (
                <Button nativeButton={false} className="flex-1" render={<Link href={dashboardHref} />}>
                  Go to dashboard
                </Button>
              ) : (
                <>
                  <Button
                    nativeButton={false}
                    variant="outline"
                    className="flex-1"
                    render={<Link href="/login" />}
                  >
                    Log in
                  </Button>
                  <Button nativeButton={false} className="flex-1" render={<Link href="/login" />}>
                    Get started
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
