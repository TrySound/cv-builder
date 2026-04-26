import type { Kysely } from "kysely";
import { Agent } from "@atproto/api";
import { Client, type DatetimeString, type DidString } from "@atproto/lex";
import * as weareonhire from "$lib/lexicons/com/weareonhire";
import * as sifa from "$lib/lexicons/id/sifa";
import { getOAuthClient } from "./auth";
import { getDB } from "./db";
import type {
  Resume,
  Work,
  Education,
  WorkplaceType,
  EmploymentType,
} from "./jsonresume";
import type { DatabaseSchema } from "./db";
import { getPdsClient } from "./atproto";

export async function loadResume(did: DidString): Promise<Resume | undefined> {
  const db = await getDB();

  // Get target member
  const targetMember = await db
    .selectFrom("members")
    .selectAll()
    .where("did", "=", did)
    .executeTakeFirst();

  if (!targetMember) {
    return;
  }

  // Load all related data
  const [
    positions,
    education,
    projects,
    skills,
    languages,
    workplaces,
    profiles,
  ] = await Promise.all([
    db
      .selectFrom("member_positions")
      .selectAll()
      .where("did", "=", targetMember.did)
      .orderBy("started_at", "desc")
      .orderBy("ended_at", "desc")
      .execute(),
    db
      .selectFrom("member_education")
      .selectAll()
      .where("did", "=", targetMember.did)
      .orderBy("started_at", "desc")
      .orderBy("ended_at", "desc")
      .execute(),
    db
      .selectFrom("member_projects")
      .selectAll()
      .where("did", "=", targetMember.did)
      .orderBy("started_at", "desc")
      .orderBy("ended_at", "desc")
      .execute(),
    db
      .selectFrom("member_skills")
      .select("skill")
      .where("did", "=", targetMember.did)
      .execute(),
    db
      .selectFrom("member_languages")
      .select("language")
      .where("did", "=", targetMember.did)
      .execute(),
    db
      .selectFrom("member_preferred_workplaces")
      .select("workplace_type")
      .where("did", "=", targetMember.did)
      .execute(),
    db
      .selectFrom("member_profiles")
      .select("url")
      .where("did", "=", targetMember.did)
      .execute(),
  ]);

  // Build profiles array with network inference from URL
  function inferNetwork(url: string): string | undefined {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes("github.com")) return "GitHub";
    if (lowerUrl.includes("linkedin.com")) return "LinkedIn";
    if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com"))
      return "Twitter";
    if (lowerUrl.includes("facebook.com")) return "Facebook";
    if (lowerUrl.includes("instagram.com")) return "Instagram";
    if (lowerUrl.includes("t.me") || lowerUrl.includes("telegram.me"))
      return "Telegram";
    return undefined;
  }

  const resumeProfiles = profiles.map((p) => ({
    network: inferNetwork(p.url),
    url: p.url,
  }));

  // Build extension with custom fields (only non-position data)
  const extension: Resume["extension"] = {
    industry: targetMember.industry ?? undefined,
    preferredWorkplaces: workplaces.map(
      (w) => w.workplace_type as WorkplaceType,
    ),
  };

  const location = targetMember.location
    ? { address: targetMember.location }
    : undefined;

  const work: Work[] = positions.map((p) => {
    const workEntry: Work = {
      name: p.company,
      location: p.location ?? undefined,
      position: p.title,
      startDate: p.started_at ?? undefined,
      endDate: p.ended_at ?? undefined,
      summary: p.description ?? undefined,
    };

    // Add extension only if there are custom fields
    if (p.employment_type || p.workplace_type) {
      workEntry.extension = {
        employmentType: (p.employment_type as EmploymentType) ?? undefined,
        workplaceType: (p.workplace_type as WorkplaceType) ?? undefined,
      };
    }

    return workEntry;
  });

  const educationList: Education[] = education.map((e) => {
    const eduEntry: Education = {
      institution: e.institution,
      area: e.field ?? undefined,
      studyType: e.degree,
      startDate: e.started_at ?? undefined,
      endDate: e.ended_at ?? undefined,
    };

    if (e.description) {
      eduEntry.extension = { description: e.description };
    }

    return eduEntry;
  });

  const resume: Resume = {
    $schema:
      "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: targetMember.name ?? undefined,
      label: targetMember.headline ?? undefined,
      email: targetMember.email ?? undefined,
      url: targetMember.website ?? undefined,
      summary: targetMember.summary ?? undefined,
      location,
      profiles: resumeProfiles.length > 0 ? resumeProfiles : undefined,
    },
    work: work.length > 0 ? work : undefined,
    education: educationList.length > 0 ? educationList : undefined,
    projects:
      projects.length > 0
        ? projects.map((p) => ({
          name: p.name,
          description: p.description ?? undefined,
          url: p.url ?? undefined,
          startDate: p.started_at ?? undefined,
          endDate: p.ended_at ?? undefined,
        }))
        : undefined,
    skills:
      skills.length > 0 ? skills.map((s) => ({ name: s.skill })) : undefined,
    languages:
      languages.length > 0
        ? languages.map((l) => ({ language: l.language }))
        : undefined,
    meta: {
      lastModified: new Date().toISOString(),
    },
    extension: Object.keys(extension).length > 0 ? extension : undefined,
  };

  return resume;
}

async function updateResumeData(
  db: Kysely<DatabaseSchema>,
  did: string,
  resume: Resume,
) {
  // Update member profile (only extension/industry, basics are handled by updateResumeBasicsData)
  await db
    .updateTable("members")
    .set({
      industry: resume.extension?.industry || null,
      updated_at: new Date().toISOString(),
    })
    .where("did", "=", did)
    .execute();

  // Delete existing related records
  await db.deleteFrom("member_positions").where("did", "=", did).execute();
  await db.deleteFrom("member_education").where("did", "=", did).execute();
  await db.deleteFrom("member_projects").where("did", "=", did).execute();
  await db.deleteFrom("member_skills").where("did", "=", did).execute();
  await db.deleteFrom("member_languages").where("did", "=", did).execute();
  await db
    .deleteFrom("member_preferred_workplaces")
    .where("did", "=", did)
    .execute();

  // Insert positions
  if (resume.work && resume.work.length > 0) {
    await db
      .insertInto("member_positions")
      .values(
        resume.work.map((w) => ({
          did,
          company: w.name ?? "",
          title: w.position ?? "",
          location: w.location || null,
          workplace_type: (w.extension?.workplaceType ||
            null) as WorkplaceType | null,
          employment_type: (w.extension?.employmentType ||
            null) as EmploymentType | null,
          started_at: w.startDate || null,
          ended_at: w.endDate || null,
          description: w.summary || null,
        })),
      )
      .execute();
  }

  // Insert education
  if (resume.education && resume.education.length > 0) {
    await db
      .insertInto("member_education")
      .values(
        resume.education.map((e) => ({
          did,
          institution: e.institution ?? "",
          degree: e.studyType ?? "",
          field: e.area || null,
          started_at: e.startDate || null,
          ended_at: e.endDate || null,
          description: e.extension?.description || null,
        })),
      )
      .execute();
  }

  // Insert projects
  if (resume.projects && resume.projects.length > 0) {
    await db
      .insertInto("member_projects")
      .values(
        resume.projects.map((p) => ({
          did,
          name: p.name ?? "",
          description: p.description || null,
          url: p.url || null,
          started_at: p.startDate || null,
          ended_at: p.endDate || null,
        })),
      )
      .execute();
  }

  // Insert skills
  if (resume.skills && resume.skills.length > 0) {
    await db
      .insertInto("member_skills")
      .values(
        resume.skills.map((skill) => ({
          did,
          skill: skill.name?.trim().toLowerCase() ?? "",
        })),
      )
      .execute();
  }

  // Insert languages
  if (resume.languages && resume.languages.length > 0) {
    await db
      .insertInto("member_languages")
      .values(
        resume.languages.map((language) => ({
          did,
          language: language.language?.trim().toLowerCase() ?? "",
        })),
      )
      .execute();
  }

  // Insert preferred workplaces
  if (
    resume.extension?.preferredWorkplaces &&
    resume.extension.preferredWorkplaces.length > 0
  ) {
    await db
      .insertInto("member_preferred_workplaces")
      .values(
        resume.extension.preferredWorkplaces.map((workplace_type) => ({
          did,
          workplace_type,
        })),
      )
      .execute();
  }
}

export async function updateResume(did: string, resume: Resume): Promise<void> {
  const db = await getDB();

  await db.transaction().execute(async (trx) => {
    await updateResumeData(trx, did, resume);
  });
}

type ResumeBasicsData = {
  name?: string;
  title?: string;
  email?: string;
  countryCode?: string;
  summary?: string;
};

export async function loadResumeBasicsData(
  did: DidString,
  isOwnProfile: boolean,
) {
  const db = await getDB();

  // Load public profile data from profile_index
  const profileIndex = await db
    .selectFrom("profile_index")
    .select(["name", "title", "introduction", "country_code"])
    .where("did", "=", did)
    .executeTakeFirst();

  const result: ResumeBasicsData = {
    name: profileIndex?.name ?? undefined,
    title: profileIndex?.title ?? undefined,
    countryCode: profileIndex?.country_code ?? undefined,
  };
  try {
    const client = await getPdsClient(did);
    const existingProfile = await client.get(sifa.profile.self, {
      rkey: "self",
      repo: did,
    });
    result.summary = existingProfile.value.about;
  } catch {
    // Profile doesn't exist yet
  }

  if (isOwnProfile) {
    const profilePrivate = await db
      .selectFrom("profile_private")
      .select(["email", "status"])
      .where("did", "=", did)
      .executeTakeFirst();
    result.email = profilePrivate?.email ?? undefined;
  }

  return result;
}

export async function updateResumeBasicsData(
  did: DidString,
  data: ResumeBasicsData,
) {
  const db = await getDB();

  await db.transaction().execute(async (trx) => {
    // Update profile_index table (preserves introduction)
    await trx
      .insertInto("profile_index")
      .values({
        did,
        name: data.name ?? null,
        title: data.title ?? null,
        introduction: null,
        country_code: data.countryCode ?? null,
        created_at: new Date().toISOString(),
      })
      .onConflict((oc) =>
        oc.column("did").doUpdateSet({
          name: data.name ?? null,
          title: data.title ?? null,
          country_code: data.countryCode ?? null,
        }),
      )
      .execute();

    // Update profile_private table
    await trx
      .insertInto("profile_private")
      .values({
        did,
        email: data.email ?? null,
        status: "open_to_connect",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .onConflict((oc) =>
        oc.column("did").doUpdateSet({
          email: data.email ?? null,
          updated_at: new Date().toISOString(),
        }),
      )
      .execute();

    // Update legacy members table (only if member exists)
    const existingMember = await trx
      .selectFrom("members")
      .select("did")
      .where("did", "=", did)
      .executeTakeFirst();

    if (existingMember) {
      await trx
        .updateTable("members")
        .set({
          name: data.name ?? null,
          email: data.email ?? null,
          location: data.countryCode ?? null,
          headline: data.title ?? null,
          summary: data.summary ?? null,
          updated_at: new Date().toISOString(),
        })
        .where("did", "=", did)
        .execute();
    }
  });

  // Create typed client with authenticated session
  const oauthClient = await getOAuthClient();
  const session = await oauthClient.restore(did);
  const client = new Client(new Agent(session));

  // Get current weareonhire profile to preserve introduction
  let currentIntroduction: string | undefined;
  try {
    const existingProfile = await client.get(weareonhire.profile.main, {
      rkey: "self",
      repo: did,
    });
    currentIntroduction = existingProfile.value.introduction;
  } catch {
    // Profile doesn't exist yet
  }

  // Update com.weareonhire.profile record (preserves introduction)
  const now = new Date().toISOString() as DatetimeString;
  await client.put(weareonhire.profile.main, {
    createdAt: now,
    name: data.name,
    title: data.title,
    introduction: currentIntroduction,
    countryCode: data.countryCode,
  });
  await client.put(sifa.profile.self.main, {
    createdAt: now,
    headline: data.title,
    about: data.summary,
    location: data.countryCode ? { countryCode: data.countryCode } : undefined,
  });
}
