import Link from "next/link";
import {
  ArrowRightIcon,
  ClipboardListIcon,
  FileCheckIcon,
  GraduationCapIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import { getCurrentUser } from "@/lib/dal";
import { dashboardForRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MarketingNavbar } from "@/components/marketing/navbar";
import { MarketingFooter } from "@/components/marketing/footer";
import { DemoPreview } from "@/components/marketing/demo-preview";

const FEATURES = [
  {
    icon: ClipboardListIcon,
    title: "Assignments & deadlines",
    body: "Create rich assignments tied to a class and subject, set deadlines and max marks, then publish or keep drafts private.",
  },
  {
    icon: FileCheckIcon,
    title: "Submissions & grading",
    body: "Students submit text or files. Teachers review, award marks within limits, and leave clear, structured feedback.",
  },
  {
    icon: UsersIcon,
    title: "Role-based access",
    body: "Admins, teachers and students each get a tailored workspace — with strict, server-enforced authorization.",
  },
  {
    icon: GraduationCapIcon,
    title: "Classes & subjects",
    body: "Map subjects to classes, assign teachers to the combinations they teach, and enroll students with a click.",
  },
  {
    icon: LayoutDashboardIcon,
    title: "Insightful dashboards",
    body: "Every role lands on a focused dashboard with the counts, deadlines and actions that matter to them.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure by default",
    body: "JWT sessions in http-only cookies, hashed passwords, and validation on every form and endpoint.",
  },
];

const ROLES = [
  {
    name: "Admin",
    points: [
      "Manage users, classes and subjects",
      "Assign teachers to classes & subjects",
      "View all assignments and submissions",
      "Application-wide settings",
    ],
  },
  {
    name: "Teacher",
    points: [
      "Create, edit and publish assignments",
      "Collect submissions per assignment",
      "Grade with marks and feedback",
      "Track deadlines and pending work",
    ],
  },
  {
    name: "Student",
    points: [
      "See assignments for your class",
      "Submit answers and files",
      "Edit until the deadline",
      "View marks and feedback",
    ],
  },
];

const STEPS = [
  { step: "01", title: "Sign in", body: "Log in as an admin, teacher or student with a demo account." },
  { step: "02", title: "Create", body: "Teachers build assignments and publish them to a class." },
  { step: "03", title: "Submit", body: "Students review details and submit their work before the deadline." },
  { step: "04", title: "Grade", body: "Teachers award marks and feedback — students see results instantly." },
];

export default async function LandingPage() {
  const user = await getCurrentUser();
  const ctaHref = user ? dashboardForRole(user.role) : "/login";

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <MarketingNavbar authed={!!user} dashboardHref={ctaHref} />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center md:px-6 md:py-28">
            <span className="inline-flex items-center rounded-full border border-border bg-muted px-3 py-1 text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
              Role-based · Assignments · Grading
            </span>
            <h1 className="max-w-3xl font-serif text-4xl leading-[1.05] tracking-tight md:text-6xl">
              Assignment management, beautifully refined.
            </h1>
            <p className="max-w-xl text-base text-muted-foreground md:text-lg">
              A calm, premium workspace where teachers create assignments,
              students submit work, and admins keep everything organized.
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <Button
                size="lg"
                className="h-11 px-6"
                nativeButton={false}
                render={<Link href={ctaHref} />}
              >
                {user ? "Go to dashboard" : "Get started"}
                <ArrowRightIcon className="size-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 px-6"
                nativeButton={false}
                render={<Link href="/#how-it-works" />}
              >
                See how it works
              </Button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-6xl px-4 pb-20 md:px-6 md:pb-28">
            <DemoPreview />
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t border-border bg-muted">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
                Features
              </p>
              <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
                Everything the workflow needs, nothing it doesn&apos;t.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <Card
                  key={f.title}
                  className="transition-shadow duration-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
                >
                  <CardContent className="flex flex-col gap-3 p-6">
                    <div className="flex size-9 items-center justify-center rounded-lg border border-border bg-background">
                      <f.icon className="size-4" />
                    </div>
                    <h3 className="font-serif text-lg tracking-tight">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {f.body}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Roles */}
        <section id="roles" className="border-t border-border">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
                Built for every role
              </p>
              <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
                One system, three focused experiences.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {ROLES.map((role) => (
                <Card key={role.name}>
                  <CardContent className="flex flex-col gap-4 p-6">
                    <h3 className="font-serif text-xl tracking-tight">
                      {role.name}
                    </h3>
                    <ul className="flex flex-col gap-2.5 text-sm text-muted-foreground">
                      {role.points.map((p) => (
                        <li key={p} className="flex items-start gap-2">
                          <span className="mt-2 size-1 shrink-0 rounded-full bg-foreground/40" />
                          {p}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-border bg-muted">
          <div className="mx-auto w-full max-w-6xl px-4 py-20 md:px-6 md:py-28">
            <div className="max-w-2xl">
              <p className="text-[0.7rem] uppercase tracking-[0.08em] text-muted-foreground">
                How it works
              </p>
              <h2 className="mt-2 font-serif text-3xl tracking-tight md:text-4xl">
                A simple, end-to-end workflow.
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <div key={s.step} className="flex flex-col gap-2">
                  <span className="font-serif text-2xl tracking-tight text-muted-foreground">
                    {s.step}
                  </span>
                  <h3 className="font-medium">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 px-4 py-20 text-center md:px-6 md:py-28">
            <h2 className="font-serif text-3xl tracking-tight md:text-4xl">
              Ready to try it?
            </h2>
            <p className="max-w-md text-muted-foreground">
              Sign in with a demo account and explore the admin, teacher and
              student experiences.
            </p>
            <Button
              size="lg"
              className="h-11 px-6"
              nativeButton={false}
              render={<Link href="/login" />}
            >
              Open the demo
              <ArrowRightIcon className="size-4" />
            </Button>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
