import { dirname, join } from "node:path";
import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { Kysely, Migrator, FileMigrationProvider } from "kysely";
import { seedDatabase } from "./seed.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    mode: {
      type: "string",
      default: "dev",
    },
  },
});

const mode = values.mode;

let db: Kysely<any>;

if (mode === "prod") {
  const connectionString = process.env.CONNECTION_STRING;
  if (!connectionString) {
    console.error(
      "Error: CONNECTION_STRING environment variable is required for prod mode",
    );
    process.exit(1);
  }

  const { PostgresDialect } = await import("kysely");
  const { Pool } = await import("pg");

  db = new Kysely({
    dialect: new PostgresDialect({
      pool: new Pool({
        connectionString,
      }),
    }),
  });
} else {
  const { PGlite } = await import("@electric-sql/pglite");
  const { PGliteDialect } = await import("kysely-pglite-dialect");
  const pglite = new PGlite("./.pgdata");
  db = new Kysely({
    dialect: new PGliteDialect(pglite),
  });
}

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs: {
      readdir: async (path: string) => {
        const files = await readdir(path);
        return files.filter((file) => file.endsWith(".ts"));
      },
    },
    path: {
      join,
    },
    migrationFolder: join(__dirname, "../migrations"),
  }),
});

const result = await migrator.migrateToLatest();

if (result.error) {
  console.error("Migration failed:", result.error);
  process.exit(1);
}

if (result.results && result.results.length > 0) {
  result.results.forEach((it) => {
    if (it.status === "Success") {
      console.log(`✓ Migration ${it.migrationName} executed successfully`);
    } else if (it.status === "Error") {
      console.error(`✗ Migration ${it.migrationName} failed`);
    } else if (it.status === "NotExecuted") {
      console.log(`- Migration ${it.migrationName} skipped`);
    }
  });
} else {
  console.log("No migrations to run");
}

// Seed database in dev mode if fresh
if (mode === "dev") {
  await seedDatabase(db);
}

await db.destroy();
