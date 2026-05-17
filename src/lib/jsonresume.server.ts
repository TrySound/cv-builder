import { Agent } from "@atproto/api";
import { getOAuthClient } from "./auth";
import type { EmploymentType, Resume, WorkplaceType } from "./jsonresume";
import { getDB } from "./dbkit";
import { applyWrites, getNow } from "./atproto";
import { sifa } from "./lexicons/id";
import { normalizeUrl } from "./link";
import { getContrail } from "./contrail";

export function getSifaEmploymentType(
  type: EmploymentType | undefined,
): sifa.profile.position.Main["employmentType"] | undefined {
  switch (type) {
    case "fulltime":
      return "id.sifa.defs#fullTime";
    case "parttime":
      return "id.sifa.defs#partTime";
    case "contract":
      return "id.sifa.defs#contract";
    case "freelance":
      return "id.sifa.defs#freelance";
    case "internship":
      return "id.sifa.defs#internship";
  }
}

// Reverse mapping: jsonresume workplace type to sifa workplace type
export function getSifaWorkplaceType(
  type: WorkplaceType | undefined,
): sifa.profile.position.Main["workplaceType"] | undefined {
  switch (type) {
    case "onsite":
      return "id.sifa.defs#onSite";
    case "remote":
      return "id.sifa.defs#remote";
    case "hybrid":
      return "id.sifa.defs#hybrid";
  }
}

// Infer platform from URL for external accounts
function inferPlatform(
  url: string,
): sifa.profile.externalAccount.Main["platform"] {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("github.com")) return "id.sifa.defs#platformGithub";
  if (lowerUrl.includes("linkedin.com")) return "id.sifa.defs#platformLinkedin";
  if (lowerUrl.includes("twitter.com") || lowerUrl.includes("x.com"))
    return "id.sifa.defs#platformTwitter";
  if (lowerUrl.includes("instagram.com"))
    return "id.sifa.defs#platformInstagram";
  if (lowerUrl.includes("youtube.com")) return "id.sifa.defs#platformYoutube";
  if (lowerUrl.includes("bsky.app")) return "id.sifa.defs#platformFediverse";
  if (lowerUrl.includes("mastodon")) return "id.sifa.defs#platformFediverse";
  if (lowerUrl.includes("orcid.org")) return "id.sifa.defs#platformOrcid";
  return "id.sifa.defs#platformOther";
}

// Parse location string into sifa location format
function parseLocation(
  address: string | undefined,
): sifa.profile.self.Main["location"] | undefined {
  if (!address) {
    return;
  }
  const parts = address.split(",").map((p) => p.trim());
  // Try to guess: city, region, countryCode
  if (parts.length >= 3) {
    return {
      city: parts[0],
      region: parts[1],
      countryCode: parts[2].toUpperCase(),
    };
  }
}

/**
 * Update all resume data in a single applyWrites call.
 * This replaces ALL existing records with the new data.
 * Used for full resume imports (e.g., PDF upload).
 */
export async function updateResumeData(
  did: string,
  resume: Resume,
): Promise<void> {
  // Create typed client with authenticated session
  const oauthClient = await getOAuthClient();
  const session = await oauthClient.restore(did);
  const agent = new Agent(session);

  const db = await getDB();
  const now = getNow();

  // Get all existing records that need to be deleted
  const [
    existingBasics,
    existingPositions,
    existingEducation,
    existingProjects,
    existingSkills,
    existingLanguages,
    existingAccounts,
  ] = await Promise.all([
    db
      .selectFrom("records_basics")
      .select((q) => q.ref("record", "->").key("createdAt").as("createdAt"))
      .where("did", "=", did)
      .executeTakeFirst(),
    db
      .selectFrom("records_position")
      .select("rkey")
      .where("did", "=", did)
      .execute(),
    db
      .selectFrom("records_education")
      .select("rkey")
      .where("did", "=", did)
      .execute(),
    db
      .selectFrom("records_project")
      .select("rkey")
      .where("did", "=", did)
      .execute(),
    db
      .selectFrom("records_skill")
      .select("rkey")
      .where("did", "=", did)
      .execute(),
    db
      .selectFrom("records_language")
      .select("rkey")
      .where("did", "=", did)
      .execute(),
    db
      .selectFrom("records_account")
      .select("rkey")
      .where("did", "=", did)
      .execute(),
  ]);

  // Build preferred workplaces from resume
  const preferredWorkplaces = resume.extension?.preferredWorkplaces
    ?.map(getSifaWorkplaceType)
    .filter((w) => w !== undefined);

  // Parse location from resume basics
  const location = resume.basics?.location?.countryCode
    ? { countryCode: resume.basics.location.countryCode }
    : undefined;

  const response = await applyWrites(agent, (client) => {
    // Delete all existing records first
    for (const record of existingAccounts) {
      client.delete(sifa.profile.externalAccount, { rkey: record.rkey });
    }
    for (const record of existingPositions) {
      client.delete(sifa.profile.position, { rkey: record.rkey });
    }
    for (const record of existingEducation) {
      client.delete(sifa.profile.education, { rkey: record.rkey });
    }
    for (const record of existingProjects) {
      client.delete(sifa.profile.project, { rkey: record.rkey });
    }
    for (const record of existingSkills) {
      client.delete(sifa.profile.skill, { rkey: record.rkey });
    }
    for (const record of existingLanguages) {
      client.delete(sifa.profile.language, { rkey: record.rkey });
    }

    client.put(sifa.profile.self, {
      headline: resume.basics?.label,
      about: resume.basics?.summary,
      industry: resume.extension?.industry,
      location,
      preferredWorkplace: preferredWorkplaces,
      createdAt: existingBasics?.createdAt ?? now,
    });

    for (const profile of resume.basics?.profiles ?? []) {
      if (profile.url) {
        client.create(sifa.profile.externalAccount, {
          createdAt: now,
          platform: inferPlatform(profile.url),
          url: normalizeUrl(profile.url) as `${string}:${string}`,
          label: profile.network,
        });
      }
    }

    for (const work of resume.work ?? []) {
      client.create(sifa.profile.position, {
        createdAt: now,
        company: work.name ?? "",
        title: work.position ?? "",
        startedAt: work.startDate ?? now,
        endedAt: work.endDate,
        description: work.summary,
        location: work.location ? parseLocation(work.location) : undefined,
        employmentType: getSifaEmploymentType(work.extension?.employmentType),
        workplaceType: getSifaWorkplaceType(work.extension?.workplaceType),
      });
    }

    for (const edu of resume.education ?? []) {
      client.create(sifa.profile.education, {
        createdAt: now,
        institution: edu.institution ?? "",
        degree: edu.studyType ?? "",
        fieldOfStudy: edu.area,
        startedAt: edu.startDate,
        endedAt: edu.endDate,
        description: edu.extension?.description,
      });
    }

    for (const project of resume.projects ?? []) {
      client.create(sifa.profile.project, {
        createdAt: now,
        name: project.name ?? "",
        description: project.description,
        url: project.url
          ? (normalizeUrl(project.url) as `${string}:${string}`)
          : undefined,
        startedAt: project.startDate,
        endedAt: project.endDate,
      });
    }

    for (const skill of resume.skills ?? []) {
      if (skill.name) {
        client.create(sifa.profile.skill, {
          createdAt: now,
          name: skill.name.trim().toLowerCase(),
        });
      }
    }

    for (const language of resume.languages ?? []) {
      if (language.language) {
        client.create(sifa.profile.language, {
          createdAt: now,
          name: language.language.trim(),
        });
      }
    }
  });

  const contrail = await getContrail();
  await contrail.notify(response.data.affectedUris);
}
