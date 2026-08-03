import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/generated/prisma/client";

export const SESSION_COOKIE = "edumanager_session";

export type SessionPayload = {
  userId: number;
  role: Role;
  expiresAt: number;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

function expiryMs(): number {
  const raw = process.env.JWT_EXPIRES ?? "7d";
  const match = /^(\d+)([smhdw])$/.exec(raw);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
    w: 604_800_000,
  };
  return value * (multipliers[unit] ?? multipliers.d);
}

export function getSessionExpiry(): number {
  return expiryMs();
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES ?? "7d")
    .sign(getSecret());
}

export async function decrypt(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
    });
    const userId = payload.userId;
    const role = payload.role;
    if (typeof userId !== "number" || typeof role !== "string") {
      return null;
    }
    return {
      userId,
      role: role as Role,
      expiresAt: Number(payload.expiresAt ?? 0),
    };
  } catch {
    return null;
  }
}
