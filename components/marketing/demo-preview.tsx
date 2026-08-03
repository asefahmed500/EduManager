import { Badge } from "@/components/ui/badge";

const STATS = [
  { label: "Assignments", value: "12" },
  { label: "Published", value: "9" },
  { label: "Drafts", value: "3" },
  { label: "To grade", value: "7" },
];

const ROWS = [
  { title: "Algebra Fundamentals Worksheet", meta: "Grade 10-A · Mathematics", status: "Submitted" },
  { title: "Intro to Python — Mini Project", meta: "Grade 10-A · Computer Science", status: "Graded" },
  { title: "Newton's Laws — Lab Report", meta: "Grade 10-A · Physics", status: "Late" },
];

export function DemoPreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_4px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2 border-b border-border bg-muted/60 px-4 py-3">
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="size-2.5 rounded-full bg-foreground/15" />
        <span className="ml-3 truncate text-xs text-muted-foreground">
          edumanager.app/teacher/dashboard
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4 md:p-6">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-border bg-background p-4"
          >
            <p className="text-[0.65rem] uppercase tracking-[0.08em] text-muted-foreground">
              {s.label}
            </p>
            <p className="mt-1 font-serif text-2xl tracking-tight tabular-nums">
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div className="px-4 pb-4 md:px-6 md:pb-6">
        <div className="overflow-hidden rounded-lg border border-border">
          {ROWS.map((r, i) => (
            <div
              key={r.title}
              className={
                "flex items-center gap-3 px-4 py-3 " +
                (i > 0 ? "border-t border-border " : "")
              }
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">{r.meta}</p>
              </div>
              <Badge variant="outline">{r.status}</Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
