import { afterAll, beforeAll, vi } from "vitest";

import { prisma } from "@/lib/prisma";

// `server-only` throws outside server components; it's a no-op in tests.
vi.mock("server-only", () => ({}));

// Simulate an authenticated session cookie (jose JWT).
vi.mock("next/headers", async () => {
  const store = await import("./session-store");
  return {
    cookies: vi.fn(async () => ({
      get: (name: string) =>
        store.getSessionToken()
          ? { name, value: store.getSessionToken() as string }
          : undefined,
      set: () => {},
      delete: () => store.setSessionToken(undefined),
    })),
    headers: vi.fn(async () => new Headers()),
  };
});

// Server actions redirect / notFound when unauthorized; translate to errors in tests.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  },
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

vi.mock("next/cache", () => ({
  revalidatePath: () => {},
}));

// React `cache` is a server-component-only API; make it a passthrough in tests.
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, cache: (fn: unknown) => fn };
});

beforeAll(async () => {
  await prisma.$connect();
  const rows = await prisma.$queryRaw<{ current_database: string }[]>`
    SELECT current_database();
  `;
  const db = rows[0]?.current_database;
  if (!db?.includes("_test")) {
    throw new Error(
      `Integration tests must run on a *_test database (got "${db}"). Refusing to proceed.`,
    );
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});
