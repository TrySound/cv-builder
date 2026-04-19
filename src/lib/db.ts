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
    handle: string;
    name: string | null;
    email: string | null;
    location: string | null;
    headline: string | null;
    summary: string | null;
    industry: string | null;
    linkedin: string | null;
    github: string | null;
    website: string | null;
    invited_by: string | null;
    created_at?: string;
    updated_at?: string;
  };
  member_positions: {
    id?: string;
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
    id?: string;
    did: string;
    institution: string;
    degree: string;
    field: string | null;
    started_at: string | null;
    ended_at: string | null;
    description: string | null;
  };
  member_projects: {
    id?: string;
    did: string;
    name: string;
    description: string | null;
    url: string | null;
    started_at: string | null;
    ended_at: string | null;
  };
  member_skills: {
    id?: string;
    did: string;
    skill: string;
  };
  member_languages: {
    id?: string;
    did: string;
    language: string;
  };
  member_preferred_workplaces: {
    id?: string;
    did: string;
    workplace_type: string;
  };
  member_profiles: {
    id?: string;
    did: string;
    url: string;
  };
  invitations: {
    id?: string;
    code: string;
    name: string;
    created_by: string;
    recommendation_text: string;
    max_uses?: number;
    used_count?: number;
    created_at?: string;
  };
  recommendations: {
    id?: string;
    author_did: string;
    subject_did: string;
    text: string;
    invitation_id?: string | null;
    created_at?: string;
  };
  pdf_jobs: {
    id?: string;
    status: "pending" | "completed" | "failed";
    result: any | null;
    error: string | null;
    retry_count: number;
    created_at?: string;
    updated_at?: string;
  };
  recommendation_index: {
    uri: string;
    author_did: string;
    subject_did: string;
    reason: string;
    created_at: string;
  };
  jetstream_cursor: {
    id: string;
    time_us: number;
    updated_at: string;
  };
  profile_index: {
    did: string;
    name: string | null;
    title: string | null;
    country_code: string | null;
    introduction: string | null;
    created_at: string;
  };
  profile_private: {
    did: string;
    email: string | null;
    status: "open_to_work" | "open_to_connect" | "hidden";
    created_at?: string;
    updated_at?: string;
  };
}

let db: Kysely<DatabaseSchema> | null = null;

async function createDB(): Promise<Kysely<DatabaseSchema>> {
  if (env.DEV) {
    const { PGlite } = await import("@electric-sql/pglite");
    const { PGliteDialect } = await import("kysely-pglite-dialect");
    const pglite = new PGlite("./.pgdata");
    return new Kysely<DatabaseSchema>({
      dialect: new PGliteDialect(pglite),
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
