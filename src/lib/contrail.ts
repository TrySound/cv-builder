import type { PGlite } from "@electric-sql/pglite";
import type { Pool } from "pg";
import { Contrail, type Database } from "@atmo-dev/contrail";
import { createPostgresDatabase } from "@atmo-dev/contrail/postgres";
import { config } from "./contrail.config.ts";
import { getPgliteDb, getPgpoolDb } from "./db.ts";

// Adapter that wraps PGlite to match pg.Pool interface
function createPGlitePoolAdapter(pglite: PGlite): Pool {
  const queryFn = async (sql: string, params?: any[]) => {
    const result = await pglite.query(sql, params);
    return {
      rows: result.rows,
      rowCount: result.affectedRows ?? 0,
    };
  };
  // PGlite handles connections internally, so connect() returns a mock client
  const mockClient = {
    query: queryFn,
    release: () => {
      // No-op: PGlite doesn't need explicit connection release
    },
  };
  return {
    query: queryFn,
    connect: async () => mockClient,
  } as Pool;
}

let db: Database | null = null;

async function getContrailDB(): Promise<Database> {
  if (db) {
    return db;
  }
  const isDev =
    process.env.NODE_ENV === "development" || !process.env.CONNECTION_STRING;
  if (isDev) {
    // Use shared PGlite for local dev
    const pglite = await getPgliteDb();
    const pool = createPGlitePoolAdapter(pglite);
    db = createPostgresDatabase(pool);
    console.info("[contrail] Using PGlite adapter (via Pool wrapper)");
  } else {
    const pool = await getPgpoolDb(process.env);
    db = createPostgresDatabase(pool);
    console.info("[contrail] Using PostgreSQL adapter");
  }
  return db;
}

let contrail: undefined | Contrail;

export const getContrail = async () => {
  if (!contrail) {
    contrail = new Contrail({ ...config, db: await getContrailDB() });
  }
  return contrail;
};
