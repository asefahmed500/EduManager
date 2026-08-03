"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { notify } from "@/lib/toast";

const DEMO_ACCOUNTS = [
  { role: "Admin", email: "admin@example.com", password: "Admin@123" },
  { role: "Teacher", email: "teacher@example.com", password: "Teacher@123" },
  { role: "Student", email: "student@example.com", password: "Student@123" },
] as const;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type LoginResponse = {
  error?: string;
  redirectTo?: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<{
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const next: typeof errors = {};
    if (!email) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email))
      next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as LoginResponse;
      if (!res.ok) {
        notify.error(data.error ?? "Unable to sign in.");
        return;
      }
      notify.success("Welcome back.");
      router.push(data.redirectTo ?? "/");
      router.refresh();
    } catch {
      notify.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function fill(account: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(account.email);
    setPassword(account.password);
    setErrors({});
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center bg-background px-5 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-serif text-2xl tracking-tight">EduManager</span>
          <p className="text-sm text-muted-foreground">
            Sign in to your workspace
          </p>
        </div>

        <div className="rounded-[calc(var(--radius)+4px)] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
              />
              <FieldError>{errors.email}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={!!errors.password}
              />
              <FieldError>{errors.password}</FieldError>
            </Field>

            <div className="-mt-1 flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              className="h-10 w-full"
              disabled={loading}
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>

        <div className="flex flex-col gap-3">
          <p className="text-center text-xs uppercase tracking-[0.08em] text-muted-foreground">
            Demo accounts — click to fill
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.role}
                type="button"
                onClick={() => fill(account)}
                className="rounded-lg border border-border bg-background px-2 py-2 text-center text-xs transition-colors hover:bg-muted"
              >
                <span className="block font-medium">{account.role}</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
