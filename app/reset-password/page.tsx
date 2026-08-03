import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center bg-background px-5 py-12">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-serif text-2xl tracking-tight">EduManager</span>
          <p className="text-sm text-muted-foreground">Choose a new password</p>
        </div>

        <ResetPasswordForm token={sp.token ?? ""} />

        <p className="text-center text-sm text-muted-foreground">
          <Link
            href="/login"
            className="font-medium text-foreground underline underline-offset-4"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
