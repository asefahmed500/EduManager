import "server-only";

import { cookies } from "next/headers";
import type { Role } from "@/lib/generated/prisma/client";
import {
  SESSION_COOKIE,
  decrypt,
  encrypt,
  getSessionExpiry,
  type SessionPayload,
} from "@/lib/jwt";

export type { SessionPayload };

export async function createSession(userId: number, role: Role): Promise<void> {
  const expiresAt = Date.now() + getSessionExpiry();
  const token = await encrypt({ userId, role, expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function updateSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return;
  const payload = await decrypt(token);
  if (!payload) return;
  const expiresAt = Date.now() + getSessionExpiry();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(expiresAt),
    path: "/",
  });
}
