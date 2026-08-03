// Ensures the target PostgreSQL database exists before running migrations.
// Usage: node scripts/create-database.js
// Reads DATABASE_URL from .env.local and connects to the "postgres"
// maintenance database to CREATE DATABASE if it is missing.
import { config } from "dotenv";
import pg from "pg";

config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local");
  process.exit(1);
}

function main() {
  const parsed = new URL(url);
  const dbName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (!dbName) {
    console.error("Could not parse database name from DATABASE_URL");
    process.exit(1);
  }

  const serverUrl = new URL(url);
  serverUrl.pathname = "/postgres";

  const safe = dbName.replace(/[^a-zA-Z0-9_]/g, "");
  const client = new pg.Client({ connectionString: serverUrl.toString() });

  return client
    .connect()
    .then(() =>
      client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]),
    )
    .then(({ rowCount }) => {
      if (rowCount && rowCount > 0) {
        console.log(`Database "${dbName}" already exists.`);
        return;
      }
      return client.query(`CREATE DATABASE "${safe}"`).then(() => {
        console.log(`Created database "${safe}".`);
      });
    })
    .catch((err) => {
      console.error("Failed to ensure database exists:", err.message);
      process.exitCode = 1;
    })
    .finally(() => client.end());
}

main();
