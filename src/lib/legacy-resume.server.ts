import { Client, type DidString } from "@atproto/lex";
import type { DatabaseSchema } from "./db";
import type { Kysely } from "kysely";
import { updateResumeData } from "./jsonresume.server";
import type { EmploymentType, Resume, WorkplaceType } from "./jsonresume";
import * as weareonhire from "$lib/lexicons/com/weareonhire";
import { getOAuthClient } from "./auth";
import { Agent } from "@atproto/api";
import { getNow } from "./atproto";
import { getContrail } from "./contrail";
import { getDB } from "./dbkit";

export async function loadLegacyResume(did: DidString) {
  const db = await getDB();
  // Get all legacy data
  const [
    member,
    positions,
    education,
    projects,
    skills,
    languages,
    workplaces,
    profiles,
  ] = await Promise.all([
    db
      .selectFrom("members")
      .selectAll()
      .where("did", "=", did)
      .executeTakeFirst(),
    db
      .selectFrom("member_positions")
      .selectAll()
      .where("did", "=", did)
      .execute(),
    db
      .selectFrom("member_education")
      .selectAll()
      .where("did", "=", did)
      .execute(),
    db
      .selectFrom("member_projects")
      .selectAll()
      .where("did", "=", did)
      .execute(),
    db.selectFrom("member_skills").selectAll().where("did", "=", did).execute(),
    db
      .selectFrom("member_languages")
      .selectAll()
      .where("did", "=", did)
      .execute(),
    db
      .selectFrom("member_preferred_workplaces")
      .selectAll()
      .where("did", "=", did)
      .execute(),
    db
      .selectFrom("member_profiles")
      .selectAll()
      .where("did", "=", did)
      .execute(),
  ]);

  // If no legacy member data, nothing to migrate
  if (!member) {
    return;
  }

  // Build resume from legacy data
  const resume: Resume = {
    basics: {
      name: member.name ?? undefined,
      label: member.headline ?? undefined,
      summary: member.summary ?? undefined,
      location: member.location
        ? { countryCode: member.location.toUpperCase() }
        : undefined,
      profiles: profiles.map((p) => ({
        url: p.url,
      })),
    },
    work: positions.map((p) => ({
      name: p.company,
      position: p.title,
      startDate: p.started_at ?? undefined,
      endDate: p.ended_at ?? undefined,
      summary: p.description ?? undefined,
      location: p.location ?? undefined,
      extension: {
        employmentType: p.employment_type as EmploymentType | undefined,
        workplaceType: p.workplace_type as WorkplaceType | undefined,
      },
    })),
    education: education.map((e) => ({
      institution: e.institution,
      studyType: e.degree,
      area: e.field ?? undefined,
      startDate: e.started_at ?? undefined,
      endDate: e.ended_at ?? undefined,
      extension: {
        description: e.description ?? undefined,
      },
    })),
    projects: projects.map((p) => ({
      name: p.name,
      description: p.description ?? undefined,
      url: p.url ?? undefined,
      startDate: p.started_at ?? undefined,
      endDate: p.ended_at ?? undefined,
    })),
    skills: skills.map((s) => ({ name: s.skill })),
    languages: languages.map((l) => ({ language: l.language })),
    extension: {
      industry: member.industry ?? undefined,
      preferredWorkplaces: workplaces
        .map((w) => w.workplace_type as "onsite" | "remote" | "hybrid")
        .filter((w): w is "onsite" | "remote" | "hybrid" =>
          ["onsite", "remote", "hybrid"].includes(w),
        ),
    },
  };
  return resume;
}

/**
 * Cleanup all legacy member_* data for a given DID
 */
async function cleanupLegacyResume(db: Kysely<DatabaseSchema>, did: DidString) {
  await Promise.all([
    db.deleteFrom("member_positions").where("did", "=", did).execute(),
    db.deleteFrom("member_education").where("did", "=", did).execute(),
    db.deleteFrom("member_projects").where("did", "=", did).execute(),
    db.deleteFrom("member_skills").where("did", "=", did).execute(),
    db.deleteFrom("member_languages").where("did", "=", did).execute(),
    db
      .deleteFrom("member_preferred_workplaces")
      .where("did", "=", did)
      .execute(),
    db.deleteFrom("member_profiles").where("did", "=", did).execute(),
    db.deleteFrom("members").where("did", "=", did).execute(),
  ]);
}

/**
 * Migrate legacy member_* tables to AT Protocol records
 * This should be called when a user with legacy data logs in
 * and hasn't been migrated yet (no records_basics exists)
 */
export async function migrateLegacyResume(
  db: Kysely<DatabaseSchema>,
  did: DidString,
): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await db
      .selectFrom("members")
      .select("did")
      .where("did", "=", did)
      .executeTakeFirst();
    // No legacy data, no migration needed
    if (!member) {
      return { success: true };
    }

    // Get existing records to check if already migrated
    const existingProfile = await db
      .selectFrom("records_profile")
      .where("did", "=", did)
      .select("did")
      .executeTakeFirst();
    if (existingProfile) {
      // Already migrated, just cleanup legacy data
      await cleanupLegacyResume(db, did);
      return { success: true };
    }

    console.info(`Migrating legacy data for ${did}`);

    const resume = await loadLegacyResume(did);
    if (!resume) {
      return { success: true };
    }

    // Update sifa profile records using updateResumeData
    await updateResumeData(did, resume);

    // Create weareonhire profile separately (not part of updateResumeData)
    const oauthClient = await getOAuthClient();
    const session = await oauthClient.restore(did);
    const agent = new Agent(session);
    const client = new Client(agent);

    const profileResult = await client.put(weareonhire.profile, {
      name: resume.basics?.name,
      title: resume.basics?.label,
      countryCode: resume.basics?.location?.countryCode,
      introduction: resume.basics?.summary,
      createdAt: getNow(),
    });

    // Notify contrail of the weareonhire profile record
    const contrail = await getContrail();
    await contrail.notify(profileResult.uri);

    // Cleanup legacy data after successful migration
    await cleanupLegacyResume(db, did);

    return { success: true };
  } catch (error) {
    console.error("Migration failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown migration error",
    };
  }
}
