import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Single source of truth: Next.js and Prisma both read .env.local
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
