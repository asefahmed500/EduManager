import "server-only";

import nodemailer from "nodemailer";

type MailOptions = {
  to: string;
  subject: string;
  html: string;
};

export async function sendMail({ to, subject, html }: MailOptions): Promise<void> {
  const host = process.env.EMAIL_HOST;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.EMAIL_PORT) || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: user && pass ? { user, pass } : undefined,
    });
    await transporter.sendMail({
      from: process.env.EMAIL_FROM ?? user ?? "EduManager <no-reply@localhost>",
      to,
      subject,
      html,
    });
  } catch (error) {
    // Never fail the request because of mail delivery; log for debugging.
    console.error("[mailer] failed to send email:", error);
    console.log(`[mailer] would have sent to ${to}: ${subject}`);
  }
}
