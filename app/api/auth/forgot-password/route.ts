import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { forgotPasswordSchema } from "@/lib/validations/auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    // Always respond generically to avoid user enumeration.
    return NextResponse.json({ ok: true });
  }

  const { email } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.isActive && !user.isDeleted) {
    const token = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const baseUrl = new URL(req.url).origin;
    const link = `${baseUrl}/reset-password?token=${token}`;
    await sendMail({
      to: user.email,
      subject: "Reset your EduManager password",
      html: `<p>Hi ${user.name},</p><p>You requested a password reset. Click the link below to choose a new password (valid for <strong>1 hour</strong>):</p><p><a href="${link}">${link}</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
    });
  }

  return NextResponse.json({ ok: true });
}
