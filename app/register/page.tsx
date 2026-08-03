"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type RegisterResponse = {
  error?: string;
  redirectTo?: string;
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState<{
    name?: string;
    email?: string;
    password?: string;
  }>({});
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (name.trim().length < 2) next.name = "Enter your full name.";
    if (!email) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email))
      next.email = "Enter a valid email address.";
    if (!password) next.password = "Password is required.";
    else if (password.length < 6)
      next.password = "Password must be at least 6 characters.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as RegisterResponse;
      if (!res.ok) {
        notify.error(data.error ?? "Unable to register.");
        return;
      }
      notify.success("Account created. Welcome to EduManager.");
      router.push(data.redirectTo ?? "/student/dashboard");
      router.refresh();
    } catch {
      notify.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center bg-background px-5 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-serif text-2xl tracking-tight">EduManager</span>
          <p className="text-sm text-muted-foreground">
            Create your student account
          </p>
        </div>

        <div className="rounded-[calc(var(--radius)+4px)] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Field>
              <FieldLabel htmlFor="name">Full name</FieldLabel>
              <Input
                id="name"
                className="h-10"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                aria-invalid={!!errors.name}
              />
              <FieldError>{errors.name}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                className="h-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
              />
              <FieldError>{errors.email}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <Input
                id="password"
                type="password"
                className="h-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                aria-invalid={!!errors.password}
              />
              <FieldError>{errors.password}</FieldError>
            </Field>
            <Button
              type="submit"
              size="lg"
              className="mt-1 h-10 w-full"
              disabled={loading}
            >
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
        <p className="text-center text-xs text-muted-foreground">
          New accounts register as students by default.
        </p>
      </div>
    </main>
  );
}
