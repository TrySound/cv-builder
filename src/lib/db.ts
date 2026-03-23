import { env } from "$env/dynamic/private";
import { Kysely } from "kysely";

export interface DatabaseSchema {
  states: {
    key: string;
    data: string;
    created_at?: string;
  };
  sessions: {
    key: string;
    data: string;
    created_at?: string;
  };
}

let db: Kysely<DatabaseSchema> | null = null;

async function createDB(): Promise<Kysely<DatabaseSchema>> {
  if (env.DEV) {
    const { NodeNativeSqliteDialect } =
      await import("kysely-node-native-sqlite");

    return new Kysely<DatabaseSchema>({
      dialect: new NodeNativeSqliteDialect("app.db"),
    });
  } else {
    const connectionString = env.CONNECTION_STRING;
    if (!connectionString) {
      throw new Error(
        "CONNECTION_STRING environment variable is required in production",
      );
    }

    const { PostgresDialect } = await import("kysely");
    const { Pool } = await import("pg");

    return new Kysely<DatabaseSchema>({
      dialect: new PostgresDialect({
        pool: new Pool({
          connectionString,
        }),
      }),
    });
  }
}

export async function getDB(): Promise<Kysely<DatabaseSchema>> {
  if (!db) {
    db = await createDB();
  }
  return db;
}
