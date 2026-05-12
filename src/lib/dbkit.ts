import { Kysely, PGliteDialect, PostgresDialect } from "kysely";
import { env } from "$env/dynamic/private";
import { getPgliteDb, getPgpoolDb, type DatabaseSchema } from "./db";

let db: Kysely<DatabaseSchema> | null = null;

export async function getDB(): Promise<Kysely<DatabaseSchema>> {
  if (!db) {
    if (env.DEV) {
      const pglite = await getPgliteDb();
      db = new Kysely<DatabaseSchema>({
        dialect: new PGliteDialect({ pglite }),
      });
    } else {
      const pool = await getPgpoolDb(env);
      db = new Kysely<DatabaseSchema>({
        dialect: new PostgresDialect({ pool }),
      });
    }
  }
  return db;
}
