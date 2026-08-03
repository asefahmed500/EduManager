import Link from "next/link";

const FOOTER_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Roles", href: "/#roles" },
      { label: "How it works", href: "/#how-it-works" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Admin demo", href: "/login" },
      { label: "Teacher demo", href: "/login" },
    ],
  },
];

export function MarketingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <div className="grid gap-10 py-14 md:grid-cols-4">
          <div className="md:col-span-2">
            <span className="font-serif text-lg tracking-tight">EduManager</span>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              A refined, role-based platform for assignments, submissions and
              grading — built for schools and colleges.
            </p>
          </div>
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
                {group.title}
              </p>
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {group.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="overflow-hidden border-t border-border py-10">
          <span
            aria-hidden="true"
            className="block select-none text-center font-serif font-medium leading-[0.9] tracking-tight text-foreground"
            style={{ fontSize: "clamp(3rem, 18vw, 16rem)" }}
          >
            EduManager
          </span>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 py-6 text-xs text-muted-foreground sm:flex-row">
          <span>© {year} EduManager. All rights reserved.</span>
          <span>Built with Next.js, Prisma &amp; shadcn/ui</span>
        </div>
      </div>
    </footer>
  );
}
