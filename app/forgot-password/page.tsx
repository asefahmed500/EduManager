"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [errors, setErrors] = React.useState<{ email?: string }>({});
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!email) next.email = "Email is required.";
    else if (!EMAIL_RE.test(email))
      next.email = "Enter a valid email address.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setSent(true);
  }

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center bg-background px-5 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-serif text-2xl tracking-tight">EduManager</span>
          <p className="text-sm text-muted-foreground">Reset your password</p>
        </div>

        <div className="rounded-[calc(var(--radius)+4px)] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          {sent ? (
            <div className="flex flex-col gap-2 text-center">
              <p className="text-sm font-medium">Check your email</p>
              <p className="text-sm text-muted-foreground">
                If an account exists for that address, we&apos;ve sent a reset
                link. It expires in 1 hour.
              </p>
              <Link
                href="/login"
                className="mt-2 text-sm font-medium text-foreground underline underline-offset-4"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={handleSubmit}
              className="flex flex-col gap-4"
            >
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
              <Button
                type="submit"
                size="lg"
                className="h-10 w-full"
                disabled={loading}
              >
                {loading ? "Sending…" : "Send reset link"}
              </Button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
