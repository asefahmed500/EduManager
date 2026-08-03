"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { notify } from "@/lib/toast";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = React.useState("");
  const [confirm, setConfirm] = React.useState("");
  const [errors, setErrors] = React.useState<{
    password?: string;
    confirm?: string;
  }>({});
  const [loading, setLoading] = React.useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: typeof errors = {};
    if (password.length < 6)
      next.password = "Password must be at least 6 characters.";
    if (password !== confirm) next.confirm = "Passwords do not match.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    if (!token) {
      notify.error("This reset link is invalid.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        notify.error(data.error ?? "Unable to reset password.");
        return;
      }
      notify.success("Password updated. Please sign in.");
      router.push("/login");
      router.refresh();
    } catch {
      notify.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[calc(var(--radius)+4px)] border border-border bg-card p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      {!token ? (
        <p className="text-sm text-muted-foreground">
          This reset link is invalid or missing.
        </p>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field>
            <FieldLabel htmlFor="password">New password</FieldLabel>
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
          <Field>
            <FieldLabel htmlFor="confirm">Confirm password</FieldLabel>
            <Input
              id="confirm"
              type="password"
              className="h-10"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat password"
              aria-invalid={!!errors.confirm}
            />
            <FieldError>{errors.confirm}</FieldError>
          </Field>
          <Button
            type="submit"
            size="lg"
            className="h-10 w-full"
            disabled={loading}
          >
            {loading ? "Saving…" : "Reset password"}
          </Button>
        </form>
      )}
    </div>
  );
}
