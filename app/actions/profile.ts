"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/dal";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { FormState } from "@/lib/forms";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.email("Enter a valid email"),
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
});

export async function updateProfile(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const { name, email, currentPassword, newPassword } = parsed.data;

  if (email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return { error: "That email is already in use." };
  }

  const data: { name: string; email: string; passwordHash?: string } = {
    name,
    email,
  };

  if (newPassword) {
    if (!currentPassword) {
      return {
        errors: { currentPassword: ["Enter your current password to change it."] },
      };
    }
    if (newPassword.length < 6) {
      return { errors: { newPassword: ["Password must be at least 6 characters."] } };
    }
    const current = await prisma.user.findUnique({ where: { id: user.id } });
    const valid = current
      ? await verifyPassword(currentPassword, current.passwordHash)
      : false;
    if (!valid) {
      return { errors: { currentPassword: ["Current password is incorrect."] } };
    }
    data.passwordHash = await hashPassword(newPassword);
  }

  await prisma.user.update({ where: { id: user.id }, data });
  revalidatePath("/profile");
  return { ok: true };
}
