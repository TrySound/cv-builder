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
  members: {
    did: string;
    name: string | null;
    email: string | null;
    location: string | null;
    headline: string | null;
    summary: string | null;
    industry: string | null;
    linkedin: string | null;
    github: string | null;
    website: string | null;
    created_at?: string;
    updated_at?: string;
  };
  member_positions: {
    id?: number;
    did: string;
    company: string;
    title: string;
    location: string | null;
    workplace_type: string | null;
    employment_type: string | null;
    started_at: string | null;
    ended_at: string | null;
    description: string | null;
  };
  member_education: {
    id?: number;
    did: string;
    institution: string;
    degree: string;
    field: string | null;
    started_at: string | null;
    ended_at: string | null;
    description: string | null;
  };
  member_projects: {
    id?: number;
    did: string;
    name: string;
    description: string | null;
    url: string | null;
    started_at: string | null;
    ended_at: string | null;
  };
  member_skills: {
    id?: number;
    did: string;
    skill: string;
  };
  member_languages: {
    id?: number;
    did: string;
    language: string;
  };
  member_preferred_workplaces: {
    id?: number;
    did: string;
    workplace_type: string;
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
