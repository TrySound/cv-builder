import type { PGlite } from "@electric-sql/pglite";
import type { Pool } from "pg";
import type { weareonhire } from "./lexicons/com";
import type { sifa } from "./lexicons/id";

// Base record table structure from contrail
interface RecordRow<Record> {
  uri: string;
  did: string;
  rkey: string;
  cid: string | null;
  record: Record;
  time_us: number;
  indexed_at: number;
}

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
  pdf_jobs: {
    id?: string;
    status: "pending" | "completed" | "failed";
    result: any | null;
    error: string | null;
    retry_count: number;
    created_at?: string;
    updated_at?: string;
  };
  profile_private: {
    did: string;
    email: string | null;
    status: "open_to_work" | "open_to_connect" | "hidden";
    created_at?: string;
    updated_at?: string;
  };

  // contrail tables
  identities: {
    did: string;
    handle: string | null;
    pds: string | null;
    resolved_at: number;
  };
  records_profile: RecordRow<weareonhire.profile.Main>;
  records_recommendation: RecordRow<weareonhire.recommendation.Main>;
  records_basics: RecordRow<sifa.profile.self.Main>;
  records_position: RecordRow<sifa.profile.position.Main>;
  records_education: RecordRow<sifa.profile.education.Main>;
  records_skill: RecordRow<sifa.profile.skill.Main>;
  records_project: RecordRow<sifa.profile.project.Main>;
  records_language: RecordRow<sifa.profile.language.Main>;
  records_account: RecordRow<sifa.profile.externalAccount.Main>;
}

let pglite: undefined | PGlite;
export const getPgliteDb = async () => {
  if (!pglite) {
    const { PGlite } = await import("@electric-sql/pglite");
    pglite = await PGlite.create("./.pgdata");
  }
  return pglite;
};

let pgpool: undefined | Pool;
export const getPgpoolDb = async (env: Record<string, undefined | string>) => {
  if (!pgpool) {
    const connectionString = env.CONNECTION_STRING;
    if (!connectionString) {
      throw new Error(
        "CONNECTION_STRING environment variable is required in production",
      );
    }
    const { Pool } = await import("pg");
    pgpool = new Pool({
      connectionString,
    });
  }
  return pgpool;
};
