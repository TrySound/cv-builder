import { Client, type DidString } from "@atproto/lex";
import { Agent } from "@atproto/api";
import * as sifa from "$lib/lexicons/id/sifa";
import { getOAuthClient } from "./auth";
import type {
  Resume,
  Work,
  Education,
  WorkplaceType,
  EmploymentType,
} from "./jsonresume";
import { getDB } from "./dbkit";
import { normalizeUrl } from "./link";
import { applyWrites, getNow, getRkey } from "./atproto";
import { getContrail } from "./contrail";
import {
  getSifaEmploymentType,
  getSifaWorkplaceType,
} from "./jsonresume.server";

// Map sifa employment type to jsonresume employment type
function getEmploymentType(
  type: sifa.profile.position.Main["employmentType"] | undefined,
): EmploymentType | undefined {
  switch (type) {
    case "id.sifa.defs#fullTime":
      return "fulltime";
    case "id.sifa.defs#partTime":
      return "parttime";
    case "id.sifa.defs#contract":
      return "contract";
    case "id.sifa.defs#freelance":
      return "freelance";
    case "id.sifa.defs#internship":
      return "internship";
  }
}

// Map sifa workplace type to jsonresume workplace type
export function getWorkplaceType(
  type: sifa.profile.position.Main["workplaceType"] | undefined,
): WorkplaceType | undefined {
  switch (type) {
    case "id.sifa.defs#onSite":
      return "onsite";
    case "id.sifa.defs#remote":
      return "remote";
    case "id.sifa.defs#hybrid":
      return "hybrid";
  }
}

// Format datetime to ISO8601 date (YYYY-MM-DD)
function formatDate(dateString: string | undefined): string | undefined {
  if (!dateString) {
    return;
  }
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return;
  }
  return date.toISOString().split("T")[0];
}

export async function loadSifaResume(
  did: DidString,
  isProfileOwner: boolean,
): Promise<Resume | undefined> {
  const db = await getDB();

  // Query all contrail tables in parallel
  const [
    profile,
    basics,
    positions,
    education,
    skills,
    projects,
    languages,
    accounts,
    profilePrivate,
  ] = await Promise.all([
    db
      .selectFrom("records_profile")
      .select((q) => [
        q.ref("record", "->").key("name").as("name"),
        q.ref("record", "->").key("title").as("title"),
        q.ref("record", "->").key("countryCode").as("countryCode"),
      ])
      .where("did", "=", did)
      .executeTakeFirst(),

    db
      .selectFrom("records_basics")
      .select((q) => [
        q.ref("record", "->").key("about").as("about"),
        q.ref("record", "->").key("industry").as("industry"),
        q
          .ref("record", "->")
          .key("preferredWorkplace")
          .as("preferredWorkplace"),
        q.ref("record", "->").key("location").as("location"),
      ])
      .where("did", "=", did)
      .executeTakeFirst(),

    db
      .selectFrom("records_position")
      .select((q) => [
        q.ref("record", "->").key("company").as("company"),
        q.ref("record", "->").key("title").as("title"),
        q.ref("record", "->").key("description").as("description"),
        q.ref("record", "->").key("startedAt").as("startedAt"),
        q.ref("record", "->").key("endedAt").as("endedAt"),
        q.ref("record", "->").key("employmentType").as("employmentType"),
        q.ref("record", "->").key("workplaceType").as("workplaceType"),
        q.ref("record", "->").key("location").as("location"),
      ])
      .where("did", "=", did)
      .orderBy((q) => q.ref("record", "->>").key("startedAt"), "desc")
      .execute(),

    db
      .selectFrom("records_education")
      .select((q) => [
        q.ref("record", "->").key("institution").as("institution"),
        q.ref("record", "->").key("degree").as("degree"),
        q.ref("record", "->").key("fieldOfStudy").as("fieldOfStudy"),
        q.ref("record", "->").key("startedAt").as("startedAt"),
        q.ref("record", "->").key("endedAt").as("endedAt"),
        q.ref("record", "->").key("description").as("description"),
      ])
      .where("did", "=", did)
      .orderBy((q) => q.ref("record", "->>").key("startedAt"), "desc")
      .execute(),

    db
      .selectFrom("records_skill")
      .select((q) => [q.ref("record", "->").key("name").as("name")])
      .where("did", "=", did)
      .execute(),

    db
      .selectFrom("records_project")
      .select((q) => [
        q.ref("record", "->").key("name").as("name"),
        q.ref("record", "->").key("description").as("description"),
        q.ref("record", "->").key("url").as("url"),
        q.ref("record", "->").key("startedAt").as("startedAt"),
        q.ref("record", "->").key("endedAt").as("endedAt"),
      ])
      .where("did", "=", did)
      .orderBy((q) => q.ref("record", "->>").key("startedAt"), "desc")
      .execute(),

    db
      .selectFrom("records_language")
      .select((q) => [q.ref("record", "->").key("name").as("name")])
      .where("did", "=", did)
      .execute(),

    db
      .selectFrom("records_account")
      .select((q) => [
        q.ref("record", "->").key("url").as("url"),
        q.ref("record", "->").key("isPrimary").as("isPrimary"),
      ])
      .where("did", "=", did)
      .execute(),

    isProfileOwner
      ? db
          .selectFrom("profile_private")
          .select(["email"])
          .where("did", "=", did)
          .executeTakeFirst()
      : Promise.resolve(undefined),
  ]);

  // Build profiles array from external accounts
  // Sort: isPrimary first, then others
  const sortedAccounts = accounts.sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) {
      return -1;
    }
    if (!a.isPrimary && b.isPrimary) {
      return 1;
    }
    return 0;
  });
  const resumeProfiles = sortedAccounts.map((account) => {
    return {
      url: account.url,
    };
  });

  const work: Work[] = positions.map((item) => {
    const workEntry: Work = {
      name: item.company ?? "",
      position: item.title ?? "",
      startDate: formatDate(item.startedAt),
      endDate: formatDate(item.endedAt),
      summary: item.description,
    };
    if (item.location) {
      try {
        const { city, region, countryCode } = item.location;
        workEntry.location = [city, region, countryCode]
          .filter(Boolean)
          .join(", ");
      } catch {
        // Invalid location JSON, skip
      }
    }
    const employmentType = getEmploymentType(item.employmentType);
    const workplaceType = getWorkplaceType(item.workplaceType);
    if (employmentType || workplaceType) {
      workEntry.extension = {
        employmentType,
        workplaceType,
      };
    }
    return workEntry;
  });

  const educationList: Education[] = education.map((item) => {
    const eduEntry: Education = {
      institution: item.institution ?? "",
      area: item.fieldOfStudy,
      studyType: item.degree,
      startDate: formatDate(item.startedAt),
      endDate: formatDate(item.endedAt),
    };
    if (item.description) {
      eduEntry.extension = { description: item.description };
    }
    return eduEntry;
  });

  const projectsList = projects.map((item) => ({
    name: item.name ?? "",
    description: item.description,
    url: item.url,
    startDate: formatDate(item.startedAt),
    endDate: formatDate(item.endedAt),
  }));

  const skillsList = skills.map((item) => ({ name: item.name }));

  const languagesList = languages.map((item) => ({
    language: item.name,
  }));

  let location: undefined | { address: string };
  if (basics?.location) {
    try {
      const { city, region, countryCode } = basics.location;
      location = {
        address: [city, region, countryCode].filter(Boolean).join(", "),
      };
    } catch {
      // Invalid location JSON, skip
    }
  }

  const extension: Resume["extension"] = {};
  if (basics?.industry) {
    extension.industry = basics.industry;
  }

  const preferredWorkplaces = basics?.preferredWorkplace
    ?.map(getWorkplaceType)
    .filter((w) => w !== undefined);
  if (preferredWorkplaces && preferredWorkplaces.length > 0) {
    extension.preferredWorkplaces = preferredWorkplaces;
  }

  const resume: Resume = {
    $schema:
      "https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json",
    basics: {
      name: profile?.name ?? undefined,
      label: profile?.title ?? undefined,
      location: profile?.countryCode
        ? { countryCode: profile.countryCode }
        : location,
      email: profilePrivate?.email ?? undefined,
      summary: basics?.about,
      profiles: resumeProfiles.length > 0 ? resumeProfiles : undefined,
    },
    work: work.length > 0 ? work : undefined,
    education: educationList.length > 0 ? educationList : undefined,
    projects: projectsList.length > 0 ? projectsList : undefined,
    skills: skillsList.length > 0 ? skillsList : undefined,
    languages: languagesList.length > 0 ? languagesList : undefined,
    extension: Object.keys(extension).length > 0 ? extension : undefined,
  };

  return resume;
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

const updateWork = async (agent: Agent, resume: Resume) => {
  const now = getNow();
  const client = new Client(agent);
  const existingPositions = await client.list(sifa.profile.position);
  const response = await applyWrites(agent, (client) => {
    for (const record of existingPositions.records) {
      client.delete(sifa.profile.position, {
        rkey: getRkey(record.uri),
      });
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
  });
  const contrail = await getContrail();
  await contrail.notify(response.data.affectedUris);
};

const updateEducation = async (agent: Agent, resume: Resume) => {
  const client = new Client(agent);
  const now = getNow();
  const existingEducation = await client.list(sifa.profile.education);
  const response = await applyWrites(agent, (client) => {
    for (const record of existingEducation.records) {
      client.delete(sifa.profile.education, {
        rkey: getRkey(record.uri),
      });
    }
    for (const edu of resume.education ?? []) {
      client.create(sifa.profile.education, {
        createdAt: now,
        institution: edu.institution ?? "",
        degree: edu.studyType ?? "",
        fieldOfStudy: edu.area,
        startedAt: edu.startDate ?? now,
        endedAt: edu.endDate,
        description: edu.extension?.description,
      });
    }
  });
  const contrail = await getContrail();
  await contrail.notify(response.data.affectedUris);
};

const updateProjects = async (agent: Agent, resume: Resume) => {
  const client = new Client(agent);
  const now = getNow();
  const existingProjects = await client.list(sifa.profile.project);
  const response = await applyWrites(agent, (client) => {
    for (const record of existingProjects.records) {
      client.delete(sifa.profile.project, {
        rkey: getRkey(record.uri),
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
        startedAt: project.startDate ?? now,
        endedAt: project.endDate,
      });
    }
  });
  const contrail = await getContrail();
  await contrail.notify(response.data.affectedUris);
};

const updateLanguages = async (agent: Agent, resume: Resume) => {
  const client = new Client(agent);
  const now = getNow();
  const existingLanguages = await client.list(sifa.profile.language);
  const response = await applyWrites(agent, (client) => {
    for (const record of existingLanguages.records) {
      client.delete(sifa.profile.language, {
        rkey: getRkey(record.uri),
      });
    }
    for (const language of resume.languages ?? []) {
      client.create(sifa.profile.language, {
        createdAt: now,
        name: language.language ?? "",
      });
    }
  });
  const contrail = await getContrail();
  await contrail.notify(response.data.affectedUris);
};

export async function updateSifaResume(
  did: string,
  resume: Resume,
): Promise<void> {
  // Create typed client with authenticated session
  const oauthClient = await getOAuthClient();
  const session = await oauthClient.restore(did);
  const agent = new Agent(session);

  // update records concurrently to speed up update
  // Note: basics (name, email, summary, profiles) are handled by updateResumeBasics
  await Promise.all([
    updateWork(agent, resume),
    updateEducation(agent, resume),
    updateProjects(agent, resume),
    updateLanguages(agent, resume),
  ]);
}
