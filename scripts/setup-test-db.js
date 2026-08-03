// Creates + migrates + seeds the integration-test database.
// Usage: node scripts/setup-test-db.js
import { config } from "dotenv";
config({ path: ".env.local" });
import { execSync } from "node:child_process";
import pg from "pg";

function parseDb(url) {
  const parsed = new URL(url);
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  const server = new URL(url);
  server.pathname = "/postgres";
  return { dbName, serverUrl: server.toString(), safe: dbName.replace(/[^a-zA-Z0-9_]/g, "") };
}

async function ensureDatabase(url) {
  const { dbName, serverUrl, safe } = parseDb(url);
  const client = new pg.Client({ connectionString: serverUrl });
  try {
    await client.connect();
    const { rowCount } = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName],
    );
    if (rowCount === 0) {
      await client.query(`CREATE DATABASE "${safe}"`);
      console.log(`Created test database "${safe}".`);
    }
  } finally {
    await client.end();
  }
}

function run(cmd) {
  execSync(cmd, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: testUrl },
  });
}

const testUrl =
  process.env.TEST_DATABASE_URL ??
  process.env.DATABASE_URL + (process.env.DATABASE_URL.endsWith("/") ? "" : "/");
if (!testUrl || testUrl === process.env.DATABASE_URL) {
  console.error(
    "Set TEST_DATABASE_URL in .env.local (a database separate from DATABASE_URL).",
  );
  process.exit(1);
}

await ensureDatabase(testUrl);
console.log("Applying migrations to the test database...");
run("npx prisma migrate deploy");
console.log("Seeding the test database...");
run("npx tsx prisma/seed.ts");
console.log("Test database ready.");
