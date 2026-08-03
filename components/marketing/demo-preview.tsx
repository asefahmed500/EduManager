import { Badge } from "@/components/ui/badge";

const STATS = [
  { label: "Assignments", value: "12" },
  { label: "Published", value: "9" },
  { label: "Drafts", value: "3" },
  { label: "To grade", value: "7" },
];

const NAV_ITEMS = [
  { label: "Dashboard", active: true },
  { label: "Assignments", active: false },
  { label: "Submissions", active: false },
  { label: "Profile", active: false },
];

const ROWS = [
  {
    title: "Algebra Fundamentals Worksheet",
    meta: "Grade 10-A · Mathematics",
    status: "Submitted",
  },
  {
    title: "Intro to Python — Mini Project",
    meta: "Grade 10-A · Computer Science",
    status: "Graded",
  },
  {
    title: "Newton's Laws — Lab Report",
    meta: "Grade 10-A · Physics",
    status: "Late",
  },
  {
    title: "Chemical Bonds Quiz",
    meta: "Grade 10-A · Chemistry",
    status: "Submitted",
  },
  {
    title: "Essay: Climate Change",
    meta: "Grade 10-A · English",
    status: "Graded",
  },
];

const DEADLINES = [
  { title: "Algebra Worksheet", date: "Aug 10" },
  { title: "Python Project", date: "Aug 7" },
  { title: "Physics Lab", date: "Aug 9" },
];

export function DemoPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_4px_30px_rgba(0,0,0,0.06)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="ml-3 truncate text-xs text-muted-foreground">
          edumanager.app/teacher/dashboard
        </span>
      </div>

      {/* App layout: sidebar + main */}
      <div className="flex min-h-[520px]">
        {/* Mock sidebar */}
        <aside className="hidden w-48 shrink-0 flex-col border-r border-border bg-muted/30 p-3 sm:flex">
          <div className="mb-5 flex items-center gap-2 px-1">
            <div className="flex size-7 items-center justify-center rounded-md bg-primary font-serif text-sm text-primary-foreground">
              E
            </div>
            <span className="font-serif text-sm tracking-tight">EduManager</span>
          </div>

          <p className="mb-1 px-2.5 text-[0.55rem] uppercase tracking-[0.08em] text-muted-foreground">
            Overview
          </p>
          <nav className="mb-4 flex flex-col gap-0.5">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className={
                  "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs " +
                  (item.active
                    ? "bg-primary font-medium text-primary-foreground"
                    : "text-muted-foreground")
                }
              >
                <span
                  className={
                    "size-3.5 rounded-sm " +
                    (item.active
                      ? "bg-primary-foreground/40"
                      : "bg-foreground/15")
                  }
                />
                {item.label}
              </div>
            ))}
          </nav>

          <p className="mb-1 px-2.5 text-[0.55rem] uppercase tracking-[0.08em] text-muted-foreground">
            Upcoming
          </p>
          <div className="flex flex-col gap-1.5 px-1">
            {DEADLINES.map((d) => (
              <div
                key={d.title}
                className="flex items-center justify-between rounded-md px-1.5 py-1.5 text-[0.65rem] text-muted-foreground"
              >
                <span className="truncate">{d.title}</span>
                <span className="shrink-0 tabular-nums">{d.date}</span>
              </div>
            ))}
          </div>

          <div className="mt-auto flex items-center gap-2 rounded-md px-2.5 py-2 text-xs text-muted-foreground">
            <span className="size-6 rounded-full bg-foreground/10" />
            <span className="truncate">Teacher</span>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-5">
          {/* Page heading */}
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <p className="font-serif text-lg tracking-tight">Dashboard</p>
              <p className="text-[0.65rem] text-muted-foreground">
                Welcome back, Sarah.
              </p>
            </div>
            <div className="flex h-7 items-center gap-1.5 rounded-md bg-primary px-3 text-[0.65rem] font-medium text-primary-foreground">
              New assignment
            </div>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-lg border border-border bg-background p-3"
              >
                <p className="text-[0.6rem] uppercase tracking-[0.08em] text-muted-foreground">
                  {s.label}
                </p>
                <p className="mt-1 font-serif text-xl tracking-tight tabular-nums">
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Quick action cards */}
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {[
              { t: "Manage assignments", b: "12 total · 9 published" },
              { t: "Grade submissions", b: "7 waiting for marks" },
              { t: "Check deadlines", b: "3 upcoming" },
            ].map((q) => (
              <div
                key={q.t}
                className="rounded-lg border border-border bg-background p-3"
              >
                <p className="text-xs font-semibold">{q.t}</p>
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                  {q.b}
                </p>
                <span className="mt-2 inline-block text-[0.6rem] text-primary underline underline-offset-2">
                  View all →
                </span>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="flex items-center justify-between border-b border-border bg-muted/30 px-3 py-2">
              <span className="text-[0.65rem] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Recent assignments
              </span>
              <span className="text-[0.6rem] text-muted-foreground">
                View all
              </span>
            </div>
            {ROWS.map((r, i) => (
              <div
                key={r.title}
                className={
                  "flex items-center gap-3 px-3 py-2.5 " +
                  (i > 0 ? "border-t border-border " : "")
                }
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{r.title}</p>
                  <p className="truncate text-[0.65rem] text-muted-foreground">
                    {r.meta}
                  </p>
                </div>
                <Badge variant="outline" className="text-[0.6rem]">
                  {r.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
