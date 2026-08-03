import { beforeEach, describe, expect, it } from "vitest";

import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import { POST as loginPOST } from "@/app/api/auth/login/route";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { POST as resetPOST } from "@/app/api/auth/reset-password/route";
import { createFixtures, resetDatabase } from "./fixtures";

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("auth (route handlers)", () => {
  beforeEach(async () => {
    await resetDatabase();
    await createFixtures();
  });

  it("logs in a valid user and returns their dashboard", async () => {
    const res = await loginPOST(
      jsonRequest({ email: "student@test.dev", password: "Password@123" }),
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.redirectTo).toBe("/student/dashboard");
  });

  it("rejects invalid credentials", async () => {
    const res = await loginPOST(
      jsonRequest({ email: "student@test.dev", password: "wrong-password" }),
    );
    expect(res.status).toBe(401);
  });

  it("registers a student account and rejects duplicate emails", async () => {
    const res = await registerPOST(
      jsonRequest({ name: "New Person", email: "new@test.dev", password: "Password@123" }),
    );
    expect(res.status).toBe(200);
    const user = await prisma.user.findUnique({ where: { email: "new@test.dev" } });
    expect(user?.role).toBe("STUDENT");
    expect(user?.classId).toBeNull();

    const dup = await registerPOST(
      jsonRequest({ name: "New Person", email: "new@test.dev", password: "Password@123" }),
    );
    expect(dup.status).toBe(409);
  });

  it("resets a password with a valid token", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Reset User",
        email: "reset@test.dev",
        passwordHash: await hashPassword("Old@123"),
        role: "STUDENT",
        isActive: true,
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: "tok-123",
        resetTokenExpires: new Date(Date.now() + 3_600_000),
      },
    });

    const res = await resetPOST(
      jsonRequest({ token: "tok-123", password: "NewPass@123" }),
    );
    expect(res.status).toBe(200);

    const updated = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updated?.resetToken).toBeNull();
    expect(await verifyPassword("NewPass@123", updated!.passwordHash)).toBe(true);
  });

  it("rejects an expired or unknown reset token", async () => {
    const user = await prisma.user.create({
      data: {
        name: "Reset User",
        email: "reset2@test.dev",
        passwordHash: "x",
        role: "STUDENT",
        isActive: true,
      },
    });
    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: "expired", resetTokenExpires: new Date(Date.now() - 1000) },
    });

    const res = await resetPOST(
      jsonRequest({ token: "expired", password: "NewPass@123" }),
    );
    expect(res.status).toBe(400);
  });
});
